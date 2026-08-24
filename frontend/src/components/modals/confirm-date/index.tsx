import './style.scss'
// Use dynamic import of `jspdf` inside the downloader to avoid Vite import errors when the
// package is not installed in the environment. A text fallback is provided.

type Booking = {
  dateLabel: string
  timeLabel?: string | null
  specialty?: string
  location?: string
}

type Props = {
  isOpen: boolean
  booking?: Booking | null
  onClose: () => void
  onFinish: () => void
}

export default function ConfirmDate({ isOpen, booking, onClose, onFinish }: Props) {
  if (!isOpen || !booking) return null

  const handleDownload = async () => {
    try {
      // TypeScript may complain if `jspdf` is not installed in the environment; ignore here.
      // @ts-ignore
      const mod: any = await import('jspdf')
      const jsPDF = mod.jsPDF || mod.default
      const doc: any = new jsPDF({ unit: 'pt', format: 'a4' })
      const left = 40
      let y = 60
      doc.setFontSize(18)
      doc.setTextColor(123,13,20)
      doc.text('Cita Agendada', left, y)
      y += 28
      doc.setFontSize(12)
      doc.setTextColor(40,40,40)
      doc.text('Resumen de la cita', left, y)
      y += 18

      doc.setDrawColor(230, 220, 222)
      doc.line(left, y, 560, y)
      y += 16

      doc.setFontSize(11)
      doc.setTextColor(80,80,80)
      doc.text('Fecha y Hora:', left, y)
      doc.setFont(undefined, 'bold')
      doc.text((booking.dateLabel || '') + (booking.timeLabel ? ' - ' + booking.timeLabel : ''), left + 120, y)
      y += 18

      doc.setFont(undefined, 'normal')
      doc.text('Especialidad:', left, y)
      doc.setFont(undefined, 'bold')
      doc.text(booking.specialty || '', left + 120, y)
      y += 18

      doc.setFont(undefined, 'normal')
      doc.text('Ubicación:', left, y)
      doc.setFont(undefined, 'bold')
      doc.text(booking.location || '', left + 120, y)

      doc.save('comprobante_cita.pdf')
    } catch (err) {
      // Fallback: download a simple text file with the booking data
      const text = `Cita Agendada\n\nFecha y Hora: ${booking.dateLabel}${booking.timeLabel ? ' - ' + booking.timeLabel : ''}\nEspecialidad: ${booking.specialty || ''}\nUbicación: ${booking.location || ''}`
      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'comprobante_cita.txt'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="cd-final-backdrop animate__animated animate__fadeIn" onMouseDown={onClose} role="presentation">
      <div className="cd-final-card animate__animated animate__zoomIn" role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()}>
        <div className="cd-final-icon">
          <div className="cd-final-icon__bg"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="#7b0d14" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
        </div>

        <h2 className="cd-final-title">Cita Agendada</h2>
        <p className="cd-final-sub">Tu cita ha sido agendada con éxito en nuestro sistema de atención.</p>

        <div className="cd-final-summary">
          <div className="cd-final-summary__title">RESUMEN DE LA CITA</div>

          <div className="cd-final-row"><div className="label">Fecha y Hora</div><div className="value">{booking.dateLabel}{booking.timeLabel ? `, ${booking.timeLabel}` : ''}</div></div>
          <div className="cd-final-row"><div className="label">Especialidad</div><div className="value">{booking.specialty}</div></div>
          <div className="cd-final-row"><div className="label">Ubicación</div><div className="value">{booking.location}</div></div>
        </div>

        <div className="cd-final-actions">
          <button className="btn-primary" onClick={() => { onFinish(); onClose() }}>Finalizar</button>
          <button className="btn-outline" onClick={handleDownload}><span className="download-icon">↓</span> Descargar comprobante</button>
        </div>

        <p className="cd-final-note">Se ha enviado una confirmación a su correo electrónico registrado.</p>
      </div>
    </div>
  )
}

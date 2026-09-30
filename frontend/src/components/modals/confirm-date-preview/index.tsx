import { useEffect, useRef } from 'react'
import './style.scss'
import EditCalendarOutlinedIcon from '@mui/icons-material/EditCalendarOutlined';

type Props = {
  isOpen: boolean
  dateText: string
  timeText?: string | null
  loading?: boolean
  onClose: () => void
  onConfirm: () => void
  onChangeDate: () => void
  onChangeTime: () => void
}

export default function ConfirmDatePreview({ isOpen, dateText, timeText, loading = false, onClose, onConfirm, onChangeDate, onChangeTime }: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', onKey)
      setTimeout(() => wrapperRef.current?.focus(), 0)
    }
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="cdp-backdrop animate__animated animate__fadeIn" onMouseDown={onClose} role="presentation">
      <div className="cdp-dialog animate__animated animate__zoomIn" role="dialog" aria-modal="true" aria-label="Confirmar cita" tabIndex={-1} ref={wrapperRef} onMouseDown={e => e.stopPropagation()}>
        <div className="cdp-icon" aria-hidden>
          <EditCalendarOutlinedIcon />
        </div>

        <div className="cdp-body">
          <p className="cdp-question">¿Confirmas que deseas agendar la cita para el <strong>{dateText}</strong>{timeText ? ` a las ${timeText}` : ''}?</p>

          <div className="cdp-actions">
            <button className="cdp-btn cdp-btn--primary" onClick={onConfirm} disabled={loading}>
              {loading ? <span className="cdp-spinner" aria-hidden /> : 'Sí'}
            </button>

            <button className="cdp-btn cdp-btn--outline" onClick={onChangeDate}>Cambiar fecha</button>
            <button className="cdp-btn cdp-btn--outline" onClick={onChangeTime}>Cambiar hora</button>

            <button className="cdp-link" onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

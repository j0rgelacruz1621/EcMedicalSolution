import './style.scss';
import { Save, Upload, X } from 'lucide-react';

interface NewClinicalHistoryModalProps {
  isOpen: boolean;
  patientName: string;
  onClose: () => void;
}

const personalHistoryOptions = [
  'HTA',
  'DM2',
  'ALERGIAS A FÁRMACOS',
  'ENF. NEUROLÓGICA',
  'ENF. CARDIACA',
  'ENF. PULMONAR',
];

const habits = ['TABÁQUICOS', 'CHIMOICOS', 'ENÓLICOS', 'COCINA CON LEÑA', 'CONTACTO CON VECTOR DEL CHAGAS'];

export default function NewClinicalHistoryModal({ isOpen, patientName, onClose }: NewClinicalHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="new-clinical-history-overlay" onClick={onClose} role="presentation">
      <div className="new-clinical-history-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <header className="new-clinical-history-header">
          <div>
            <h2>Agregar al Historial Clínico</h2>
            <p>Paciente: {patientName} • Fecha: 13 de Julio de 2026</p>
          </div>
          <button type="button" className="close-button" aria-label="Cerrar formulario" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="new-clinical-history-body">
          <div className="form-grid">
            <section className="form-column left-column">
              <div className="field-group">
                <label>Motivo de consulta</label>
                <textarea placeholder="Escriba los síntomas principales o razón de la visita..." rows={4} />
              </div>

              <div className="field-group">
                <label>Antecedentes personales</label>
                <div className="radio-matrix">
                  {personalHistoryOptions.map((item) => (
                    <div key={item} className="matrix-row">
                      <span>{item}</span>
                      <div className="options-box">
                        <label>
                          <input type="radio" name={item} value="niega" />
                          <span>NIEGA</span>
                        </label>
                        <label>
                          <input type="radio" name={item} value="afirma" />
                          <span>AFIRMA</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="form-column right-column">
              <div className="field-group">
                <label>PADRE</label>
                <textarea placeholder="Antecedentes paternos..." rows={3} />
              </div>

              <div className="field-group">
                <label>MADRE</label>
                <textarea placeholder="Antecedentes maternos..." rows={3} />
              </div>

              <div className="field-group">
                <label className="highlight-label">TRATAMIENTO ACTUAL</label>
                <textarea placeholder="Describa el tratamiento actual del paciente..." rows={4} />
              </div>
            </section>
          </div>

          <section className="habits-panel">
            <h3>Hábitos Psicobiológicos</h3>
            <div className="habit-list">
              {habits.map((habit) => (
                <label key={habit} className="habit-item">
                  <input type="checkbox" />
                  <span>{habit}</span>
                </label>
              ))}
            </div>
            <div className="field-group compact-field">
              <label>Otros hábitos relevantes...</label>
              <textarea rows={2} placeholder="Otros hábitos relevantes..." />
            </div>
          </section>

          <section className="vitals-panel">
            <h3>Examen físico: Signos vitales</h3>
            <div className="vitals-grid">
              <div className="vital-box">
                <label>P.A. (mmHg)</label>
                <input type="text" placeholder="120/80" />
              </div>
              <div className="vital-box">
                <label>F.C. (LPM)</label>
                <input type="text" placeholder="72" />
              </div>
              <div className="vital-box">
                <label>F.R (RPM)</label>
                <input type="text" placeholder="85.0" />
              </div>
              <div className="vital-box">
                <label>Peso (Kg)</label>
                <input type="text" placeholder="1.78" />
              </div>
              <div className="vital-box">
                <label>Talla (m) / IMC</label>
                <input type="text" placeholder="26.8" />
              </div>
            </div>
          </section>

          <section className="field-group full-width">
            <label>Hallazgos detallados</label>
            <textarea rows={5} placeholder="Describa la exploración física completa por sistemas..." />
          </section>

          <section className="ekg-panel">
            <h3>Electrocardiograma</h3>
            <div className="upload-box">
              <Upload size={24} />
              <div>
                <strong>Adjuntar EKG</strong>
                <p>Formatos aceptados: PDF, JPG o PNG • Máx 10MB</p>
              </div>
              <button type="button" className="upload-button">Seleccionar archivo</button>
            </div>

            <div className="field-group">
              <label>Observaciones EKG</label>
              <textarea placeholder="Observaciones del EKG y descripción de hallazgos relevantes..." rows={3} />
            </div>

            <div className="ekg-readout">
              <h4>ECG INGRESO</h4>
              <div className="readout-grid">
                <div className="readout-item">
                  <span>Frecuencia Cardíaca</span>
                  <div className="formula-box">R / <input type="text" value="72" aria-label="Frecuencia cardiaca" /> lpm</div>
                </div>
                <div className="readout-item">
                  <span>Intervalos</span>
                  <div className="formula-box"><input type="text" value="" placeholder="" /> / <input type="text" value="" placeholder="" /> / <input type="text" value="" placeholder="" /> / <input type="text" value="" placeholder="" /> / <input type="text" value="" placeholder="" /></div>
                </div>
                <div className="readout-item">
                  <span>TRAZO</span>
                  <div className="formula-box narrow"><input type="text" placeholder="NORMAL" /></div>
                </div>
              </div>
            </div>
          </section>

          <section className="final-block">
            <div className="field-group">
              <label className="highlight-label">DIAGNÓSTICOS</label>
              <textarea rows={4} placeholder="Ingrese los diagnósticos del paciente..." />
            </div>

            <div className="field-group">
              <label className="highlight-label">COMENTARIO / PLAN Y TRATAMIENTO</label>
              <textarea rows={4} placeholder="Describa el plan de tratamiento y comentarios adicionales..." />
            </div>
          </section>
        </div>

        <footer className="new-clinical-history-footer">
          <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
          <button type="button" className="primary-button">
            <Save size={18} />
            Guardar información
          </button>
        </footer>
      </div>
    </div>
  );
}

import React from 'react';
import { X, UserPlus, Save, Activity } from 'lucide-react';
import './style.scss';
import { useState } from 'react';
import { createPatient, type Patient, type PatientGender } from '../../../services/patients/patient-services';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patient: Patient) => void;
}


export default function NewPatientModal({ isOpen, onClose, onSuccess }: Props) {
  // Estado interno para el formulario
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    ci: '',
    email: '',
    dateOfBirth: '',
    gender: '' as PatientGender | '',
    phone: '',
    pa: '',
    fc: '',
    weight: '',
    address: ''
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const result = await createPatient({
        nationalId: formData.ci,
        firstName: formData.name,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as PatientGender,
        vitals: {
          ...(formData.pa ? { bloodPressure: formData.pa.replace(/\s*mmHg\s*$/i, '') } : {}),
          ...(formData.fc ? { heartRateBpm: Number(formData.fc.replace(/\s*bpm\s*$/i, '')) } : {}),
          ...(formData.weight ? { weightKg: Number(formData.weight.replace(/\s*kg\s*$/i, '')) } : {}),
        },
      });
      onSuccess(result.patient);
    } catch {
      setError('No se pudo guardar el paciente. Verifica los datos e inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div className="header-title-group">
            <div className="icon-circle">
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="title-vinotinto">Agregar Paciente</h2>
              <p>Ingrese los datos clínicos del nuevo ingreso</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </header>

        <form id="new-patient-form" className="modal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Nombres</label>
              <input 
                type="text" 
                placeholder="Ej. Juan Carlos" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required 
              />  
            </div>
            <div className="form-group">
              <label>Apellidos</label>
                <input 
                  type="text" 
                  placeholder="Ej. Pérez García" 
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required 
                />
            </div>
            
            <div className="form-group">
              <label>Cédula</label>
              <input 
                type="text" 
                placeholder="V-00.000.000" 
                  value={formData.ci}
                onChange={(e) => setFormData({...formData, ci: e.target.value})}
                required 
              />
            </div>
            <div className="form-group">
              <label>Fecha de nacimiento</label>
              <input 
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                required 
              />
            </div>

            <div className="form-group">
              <label>Correo electrónico</label>
              <input
                type="email"
                placeholder="paciente@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Género</label>
                <select 
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value as PatientGender})}
                  required
                >
                  <option value="">Seleccione una opción</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMENINO">Femenino</option>
                  <option value="OTRO">Otro</option>
                </select>
            </div>
            <div className="form-group">
              <label>Número de teléfono</label>
              <input 
                type="text" 
                placeholder="+58 412-0000000" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>

            {/* SECCIÓN DE SIGNOS VITALES EN UNA LÍNEA */}
            <div className="form-section-title">
              <Activity size={18} />
              <span>Datos Signos Vitales (Triaje Inicial)</span>
            </div>

            <div className="vitals-row">
              <div className="form-group">
                <label>P.A (Presión Arterial)</label>
                <input 
                  type="text" 
                  placeholder="Ej. 120/80 mmHg" 
                  value={formData.pa}
                  onChange={(e) => setFormData({...formData, pa: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>F.C (Frecuencia Cardíaca)</label>
                <input 
                  type="text" 
                  placeholder="Ej. 72 bpm" 
                  value={formData.fc}
                  onChange={(e) => setFormData({...formData, fc: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Peso</label>
                <input 
                  type="text" 
                  placeholder="Ej. 75 kg" 
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group full-width">
              {error && <p className="text-danger mb-0">{error}</p>}
            </div>
          </div>
        </form>

        <footer className="modal-footer">
          <button type="button" className="btn-text" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-save-large" form="new-patient-form" disabled={saving}>
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar Paciente'}
          </button>
        </footer>
      </div>
    </div>
  );
}
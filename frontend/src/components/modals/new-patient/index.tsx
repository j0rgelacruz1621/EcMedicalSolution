import React from 'react';
import { X, UserPlus, Save } from 'lucide-react';
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
    age: '',
    gender: '' as PatientGender | '',
    phone: '',
    pa: '',
    fc: '',
    weight: '',
    address: ''
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const buildVitalsPayload = () => {
    const vitals: {
      bloodPressure?: string;
      heartRateBpm?: number;
      weightKg?: number;
    } = {};

    const paValue = formData.pa.trim();
    if (paValue) {
      const normalizedPa = paValue.replace(/\s+/g, '').replace(/mmhg/gi, '').toUpperCase();
      const paMatch = normalizedPa.match(/^(\d{2,3})\/(\d{2,3})$/);

      if (!paMatch) {
        setError('La presión arterial debe tener el formato 120/80.');
        return null;
      }

      const systolic = Number(paMatch[1]);
      const diastolic = Number(paMatch[2]);

      if (systolic < 60 || systolic > 220 || diastolic < 30 || diastolic > 140) {
        setError('La presión arterial ingresada está fuera del rango válido.');
        return null;
      }

      vitals.bloodPressure = `${systolic}/${diastolic}`;
    }

    const fcValue = formData.fc.trim();
    if (fcValue) {
      const heartRate = Number(fcValue.replace(/[^\d.]/g, ''));
      if (!Number.isFinite(heartRate) || heartRate < 20 || heartRate > 250) {
        setError('La frecuencia cardíaca debe estar entre 20 y 250 bpm.');
        return null;
      }

      vitals.heartRateBpm = heartRate;
    }

    const weightValue = formData.weight.trim();
    if (weightValue) {
      const weight = Number(weightValue.replace(/[^\d.]/g, ''));
      if (!Number.isFinite(weight) || weight <= 0 || weight > 500) {
        setError('El peso debe estar entre 0 y 500 kg.');
        return null;
      }

      vitals.weightKg = weight;
    }

    return Object.keys(vitals).length > 0 ? vitals : undefined;
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Debes iniciar sesión para registrar un paciente.');
      return;
    }

    const ageValue = Number(formData.age);
    if (!formData.age || Number.isNaN(ageValue) || ageValue < 0 || ageValue > 120) {
      setError('Ingresa una edad válida entre 0 y 120 años.');
      return;
    }

    const computedDateOfBirth = new Date();
    computedDateOfBirth.setFullYear(computedDateOfBirth.getFullYear() - ageValue);
    const isoDate = computedDateOfBirth.toISOString().slice(0, 10);

    const vitals = buildVitalsPayload();
    if (vitals === null) {
      return;
    }

    setSaving(true);

    try {
      const result = await createPatient({
        nationalId: formData.ci,
        firstName: formData.name,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: isoDate,
        gender: formData.gender as PatientGender,
        ...(vitals ? { vitals } : {}),
      });
      onSuccess(result.patient);
    } catch (err: unknown) {
      const apiMessage = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message
        ?? (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.error
        ?? 'No se pudo guardar el paciente. Verifica los datos e inténtalo nuevamente.';

      setError(apiMessage);
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
              <label>Edad</label>
              <input 
                type="number"
                min="0"
                max="120"
                placeholder="Ej. 34"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
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
              <label>Dirección detallada</label>
              <textarea
                rows={3}
                placeholder="Ej. Calle 15, casa 3, urbanización ..."
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
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
import React from 'react';
import { X, UserPlus, CheckCircle, PencilLine } from 'lucide-react';
import './style.scss';
import { useEffect } from 'react';
import { useState } from 'react';
import { createPatient, updatePatient, type Patient, type PatientGender } from '../../../services/patients/patient-services';
import type { Office } from '../../../services/medical-center/medical-center-services';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patient: Patient) => void;
  doctorId?: number;
  offices?: Office[];
  patientToEdit?: Patient | null;
}


export default function NewPatientModal({ isOpen, onClose, onSuccess, doctorId, offices = [], patientToEdit = null }: Props) {
  // Estado interno para el formulario
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    ci: '',
    email: '',
    age: '',
    origin: '',
    address: '',
    gender: '' as PatientGender | '',
    phone: ''
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(patientToEdit);

  // Al abrir en modo edición, precargar los datos del paciente
  useEffect(() => {
    if (!isOpen || !patientToEdit) return;
    setFormData({
      name: patientToEdit.firstName,
      lastName: patientToEdit.lastName,
      ci: patientToEdit.nationalId,
      email: patientToEdit.email,
      age: String(patientToEdit.age ?? ''),
      origin: patientToEdit.origin ?? '',
      address: patientToEdit.address ?? '',
      gender: (patientToEdit.gender as PatientGender) ?? '',
      phone: patientToEdit.phone ?? '',
    });
  }, [isOpen, patientToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Debes iniciar sesión para guardar un paciente.');
      return;
    }

    const ageValue = Number(formData.age);
    if (!formData.age || Number.isNaN(ageValue) || ageValue < 0 || ageValue > 120) {
      setError('Ingresa una edad válida entre 0 y 120 años.');
      return;
    }

    setSaving(true);

    try {
      if (isEditing && patientToEdit) {
        const result = await updatePatient(patientToEdit.id, {
          nationalId: formData.ci,
          firstName: formData.name,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          age: Number(formData.age),
          origin: formData.origin || null,
          address: formData.address || null,
          gender: formData.gender as PatientGender,
        });
        onSuccess(result.patient);
      } else {
        const result = await createPatient({
          nationalId: formData.ci,
          firstName: formData.name,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          age: Number(formData.age),
          origin: formData.origin || undefined,
          address: formData.address || undefined,
          ...(doctorId ? { assignedDoctorId: doctorId } : {}),
          gender: formData.gender as PatientGender,
          vitals: {},
        });
      }
      onClose();
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
              {isEditing ? <PencilLine size={24} /> : <UserPlus size={24} />}
            </div>
            <div>
              <h2 className="title-vinotinto">{isEditing ? 'Editar Paciente' : 'Agregar Paciente'}</h2>
              <p>{isEditing ? 'Actualice los datos del paciente' : 'Ingrese los datos clínicos del nuevo ingreso'}</p>
            </div>
          </div>
          <button className="close-btn" onClick={() => { onClose(); }}>
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
                min={0}
                max={120}
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
              <label>Procedencia</label>
              <select
                value={formData.origin}
                onChange={(e) => setFormData({...formData, origin: e.target.value})}
              >
                <option value="">Seleccione una opción</option>
                {offices.map((office) => (
                  <option key={office.id} value={office.officeNumber}>
                    {`Consultorio ${office.officeNumber}${office.medicalCenter?.name ? ` · ${office.medicalCenter.name}` : ''}`}
                  </option>
                ))}
                {offices.length === 0 && <option value="Otra">Otra</option>}
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

            {/* SECCIÓN DE SIGNOS VITALES ELIMINADA: el médico registra el triaje luego en otra parte del flujo */}

            <div className="form-group full-width">
              <label>Dirección detallada</label>
              <textarea
                placeholder="Calle, edificio, urbanización, ciudad..."
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
            <CheckCircle size={20} />
            {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Guardar Paciente'}
          </button>
        </footer>
      </div>
    </div>
  );
}
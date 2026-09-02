import React from 'react';
import { X, UserPlus, Save, Activity } from 'lucide-react';
import './style.scss';
import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void; // Nueva prop
}


export default function NewPatientModal({ isOpen, onClose, onSuccess }: Props) {
  // Estado interno para el formulario
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    ci: '',
    age: '',
    origin: '',
    phone: '',
    pa: '',
    fc: '',
    weight: '',
    address: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess({
      name: `${formData.name} ${formData.lastName}`,
      ci: formData.ci,
      age: formData.age,
      origin: formData.origin,
      email: `${formData.name.toLowerCase().replace(' ', '.')}@email.com`
    });
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
                type="text" 
                placeholder="Años" 
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                required 
              />
            </div>

            <div className="form-group">
              <label>Procedencia</label>
                <select 
                  value={formData.origin}
                  onChange={(e) => setFormData({...formData, origin: e.target.value})}
                  required
                >
                  <option value="">Seleccione una opción</option>
                  <option value="Mérida">Mérida</option>
                  <option value="Tovar">Tovar</option>
                  <option value="Ejido">Ejido</option>
                </select>
            </div>
            <div className="form-group">
              <label>Número de teléfono</label>
              <input 
                type="text" 
                placeholder="+58 412-0000000" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
              <label>Dirección detallada</label>
              <textarea 
  placeholder="Calle, edificio, urbanización, ciudad..." 
  rows={3}
  value={formData.address}
  onChange={(e) => setFormData({...formData, address: e.target.value})}
></textarea>
            </div>
          </div>
        </form>

        <footer className="modal-footer">
          <button type="button" className="btn-text" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-save-large" form="new-patient-form">
            <Save size={18} />
            Guardar Paciente
          </button>
        </footer>
      </div>
    </div>
  );
}
-- ============================================================================
-- Datos de prueba: 2 especialistas con centro/oficina, horarios, pacientes,
-- citas, signos vitales, récipes, informes médicos y órdenes de laboratorio.
-- Idempotente: ON CONFLICT DO NOTHING sobre claves naturales.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------- centro/oficina
INSERT INTO medical_centers (name, address, phone)
VALUES ('Centro Médico Los Andes', 'Av. Principal #456, Quito', '+593 2 234 5678')
ON CONFLICT DO NOTHING;

INSERT INTO offices (medical_center_id, office_number, location_details)
SELECT mc.id, '101', 'Primer piso, ala norte'
FROM medical_centers mc WHERE mc.name = 'Centro Médico Los Andes'
AND NOT EXISTS (SELECT 1 FROM offices o WHERE o.office_number = '101' AND o.medical_center_id = mc.id);

INSERT INTO offices (medical_center_id, office_number, location_details)
SELECT mc.id, '102', 'Primer piso, ala sur'
FROM medical_centers mc WHERE mc.name = 'Centro Médico Los Andes'
AND NOT EXISTS (SELECT 1 FROM offices o WHERE o.office_number = '102' AND o.medical_center_id = mc.id);

-- ---------------------------------------------------------------- 2 especialistas
INSERT INTO doctors (license_number, national_id, first_name, last_name, email, phone, specialty, gender, office_id, description, is_active, updated_at)
VALUES
  ('MED-EC-10421', '1712345678', 'María', 'Fernández', 'maria.fernandez@ecmed.com', '+593 99 111 2222', 'Cardiología', 'Female',
   (SELECT id FROM offices WHERE office_number='101'), 'Cardióloga con 15 años de experiencia en prevención cardiovascular.', true, CURRENT_TIMESTAMP),
  ('MED-EC-10777', '1807654321', 'Carlos', 'Mendoza', 'carlos.mendoza@ecmed.com', '+593 98 333 4444', 'Medicina Interna', 'Male',
   (SELECT id FROM offices WHERE office_number='102'), 'Internista enfocado en manejo de enfermedades crónicas.', true, CURRENT_TIMESTAMP)
ON CONFLICT (license_number) DO NOTHING;

-- ---------------------------------------------------------------- horarios
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes)
SELECT d.id, 'Monday', '08:00', '12:00', 30 FROM doctors d WHERE d.license_number='MED-EC-10421'
AND NOT EXISTS (SELECT 1 FROM doctor_schedules s WHERE s.doctor_id=d.id AND s.day_of_week='Monday');
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes)
SELECT d.id, 'Wednesday', '08:00', '12:00', 30 FROM doctors d WHERE d.license_number='MED-EC-10421'
AND NOT EXISTS (SELECT 1 FROM doctor_schedules s WHERE s.doctor_id=d.id AND s.day_of_week='Wednesday');
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes)
SELECT d.id, 'Tuesday', '14:00', '18:00', 30 FROM doctors d WHERE d.license_number='MED-EC-10777'
AND NOT EXISTS (SELECT 1 FROM doctor_schedules s WHERE s.doctor_id=d.id AND s.day_of_week='Tuesday');

-- ---------------------------------------------------------------- pacientes
INSERT INTO patients (national_id, first_name, last_name, email, phone, age, gender, origin, address, assigned_doctor_id, medical_history_notes, updated_at)
VALUES
  ('1753214567', 'Ana', 'Torres', 'ana.torres@mail.com', '+593 96 555 1010', 58, 'Female', 'Quito', 'Av. América #789',
   (SELECT id FROM doctors WHERE license_number='MED-EC-10421'), 'Hipertensión diagnosticada 2019. Alergia a penicilina.', CURRENT_TIMESTAMP),
  ('1759876543', 'Luis', 'Paredes', 'luis.paredes@mail.com', '+593 97 555 2020', 45, 'Male', 'Quito', 'Calle Los Pinos #12',
   (SELECT id FROM doctors WHERE license_number='MED-EC-10421'), 'Antecedente familiar de infarto.', CURRENT_TIMESTAMP),
  ('1723456789', 'Gabriela', 'Suárez', 'gabriela.suarez@mail.com', '+593 96 555 3030', 34, 'Female', 'Ambato', 'Av. Cevallos #34',
   (SELECT id FROM doctors WHERE license_number='MED-EC-10777'), 'Diabetes tipo 1 desde 2015.', CURRENT_TIMESTAMP),
  ('1745678901', 'Pedro', 'Almeida', 'pedro.almeida@mail.com', '+593 95 555 4040', 62, 'Male', 'Cuenca', 'Av. Solano #200',
   (SELECT id FROM doctors WHERE license_number='MED-EC-10777'), 'Hipotiroidismo. Tiene hipertensión controlada.', CURRENT_TIMESTAMP)
ON CONFLICT (national_id) DO NOTHING;

-- ---------------------------------------------------------------- citas (pasadas y futuras)
INSERT INTO appointments (appointment_code, patient_id, doctor_id, medical_center_id, office_id, appointment_date, start_time, end_time, reason_for_visit, status, type)
VALUES
  ('APT-2026-0001', (SELECT id FROM patients WHERE national_id='1753214567'), (SELECT id FROM doctors WHERE license_number='MED-EC-10421'),
   (SELECT id FROM medical_centers WHERE name='Centro Médico Los Andes'), (SELECT id FROM offices WHERE office_number='101'),
   CURRENT_DATE - 7, '08:00', '08:30', 'Control de presión arterial', 'COMPLETED', 'Control'),
  ('APT-2026-0002', (SELECT id FROM patients WHERE national_id='1759876543'), (SELECT id FROM doctors WHERE license_number='MED-EC-10421'),
   (SELECT id FROM medical_centers WHERE name='Centro Médico Los Andes'), (SELECT id FROM offices WHERE office_number='101'),
   CURRENT_DATE - 7, '08:30', '09:00', 'Chequeo preventivo cardiovascular', 'COMPLETED', 'De primera'),
  ('APT-2026-0003', (SELECT id FROM patients WHERE national_id='1723456789'), (SELECT id FROM doctors WHERE license_number='MED-EC-10777'),
   (SELECT id FROM medical_centers WHERE name='Centro Médico Los Andes'), (SELECT id FROM offices WHERE office_number='102'),
   CURRENT_DATE - 2, '14:00', '14:30', 'Seguimiento diabetes', 'COMPLETED', 'Control'),
  ('APT-2026-0004', (SELECT id FROM patients WHERE national_id='1745678901'), (SELECT id FROM doctors WHERE license_number='MED-EC-10777'),
   (SELECT id FROM medical_centers WHERE name='Centro Médico Los Andes'), (SELECT id FROM offices WHERE office_number='102'),
   CURRENT_DATE + 3, '15:00', '15:30', 'Revisión resultados de laboratorio', 'CONFIRMED', 'Control'),
  ('APT-2026-0005', (SELECT id FROM patients WHERE national_id='1753214567'), (SELECT id FROM doctors WHERE license_number='MED-EC-10421'),
   (SELECT id FROM medical_centers WHERE name='Centro Médico Los Andes'), (SELECT id FROM offices WHERE office_number='101'),
   CURRENT_DATE + 5, '09:00', '09:30', 'Control mensual cardiología', 'SCHEDULED', 'Control')
ON CONFLICT (appointment_code) DO NOTHING;

-- ---------------------------------------------------------------- signos vitales
INSERT INTO patient_vitals (patient_id, appointment_id, blood_pressure_systolic, blood_pressure_diastolic, heart_rate_bpm, weight_kg)
SELECT p.id, a.id, 145, 90, 78, 72.5
FROM patients p JOIN appointments a ON a.appointment_code='APT-2026-0001'
WHERE p.national_id='1753214567'
AND NOT EXISTS (SELECT 1 FROM patient_vitals v WHERE v.appointment_id=a.id);

INSERT INTO patient_vitals (patient_id, appointment_id, blood_pressure_systolic, blood_pressure_diastolic, heart_rate_bpm, weight_kg)
SELECT p.id, a.id, 118, 76, 68, 80.2
FROM patients p JOIN appointments a ON a.appointment_code='APT-2026-0003'
WHERE p.national_id='1723456789'
AND NOT EXISTS (SELECT 1 FROM patient_vitals v WHERE v.appointment_id=a.id);

-- ---------------------------------------------------------------- récipes + medicamentos
INSERT INTO recipes (patient_id, doctor_id, medical_center_id, appointment_id, issue_date, additional_instructions, status, version_type)
SELECT p.id, d.id, mc.id, a.id, CURRENT_DATE - 7, 'Tomar abundante agua. Volver en 30 días.', 'ACTIVE', 'ORIGINAL'
FROM patients p, doctors d, medical_centers mc, appointments a
WHERE p.national_id='1753214567' AND d.license_number='MED-EC-10421'
  AND mc.name='Centro Médico Los Andes' AND a.appointment_code='APT-2026-0001'
AND NOT EXISTS (SELECT 1 FROM recipes r WHERE r.appointment_id=a.id);

INSERT INTO recipes (patient_id, doctor_id, medical_center_id, appointment_id, issue_date, additional_instructions, status, version_type)
SELECT p.id, d.id, mc.id, a.id, CURRENT_DATE - 2, 'Monitorear glucosa en ayuna.', 'ACTIVE', 'ORIGINAL'
FROM patients p, doctors d, medical_centers mc, appointments a
WHERE p.national_id='1723456789' AND d.license_number='MED-EC-10777'
  AND mc.name='Centro Médico Los Andes' AND a.appointment_code='APT-2026-0003'
AND NOT EXISTS (SELECT 1 FROM recipes r WHERE r.appointment_id=a.id);

INSERT INTO recipe_medications (recipe_id, drug_name, presentation, dose, frequency, duration, sort_order)
SELECT r.id, m.drug_name, m.presentation, m.dose, m.frequency, m.duration, m.sort_order
FROM (VALUES
  ('Losartán', 'Tableta 50 mg', '1 tableta', 'Cada 12 horas', '30 días', 0),
  ('Atorvastatina', 'Tableta 20 mg', '1 tableta', 'Una vez al día (noche)', '30 días', 1)
) AS m(drug_name, presentation, dose, frequency, duration, sort_order)
CROSS JOIN recipes r
WHERE r.patient_id = (SELECT id FROM patients WHERE national_id='1753214567')
AND NOT EXISTS (SELECT 1 FROM recipe_medications rm WHERE rm.recipe_id=r.id);

INSERT INTO recipe_medications (recipe_id, drug_name, presentation, dose, frequency, duration, sort_order)
SELECT r.id, m.drug_name, m.presentation, m.dose, m.frequency, m.duration, m.sort_order
FROM (VALUES
  ('Metformina', 'Tableta 850 mg', '1 tableta', 'Cada 12 horas con comida', 'Continuo', 0),
  ('Insulina glargina', 'Lantus 100 UI/mL', '10 UI', 'Una vez al día (noche)', 'Continuo', 1)
) AS m(drug_name, presentation, dose, frequency, duration, sort_order)
CROSS JOIN recipes r
WHERE r.patient_id = (SELECT id FROM patients WHERE national_id='1723456789')
AND NOT EXISTS (SELECT 1 FROM recipe_medications rm WHERE rm.recipe_id=r.id);

-- ---------------------------------------------------------------- informes médicos
INSERT INTO medical_reports (patient_id, doctor_id, medical_center_id, appointment_id, title, type, content, issue_date, rest_start_date, rest_end_date, diagnosis_code, diagnosis, status)
SELECT p.id, d.id, mc.id, a.id, 'Reposo médico por crisis hipertensiva', 'REPOSO_MEDICO',
  'Paciente con cifras tensionales elevadas (145/90 mmHg). Se recomienda reposo laboral de 3 días, dieta baja en sodio y control tensional diario.',
  CURRENT_DATE - 7, CURRENT_DATE - 7, CURRENT_DATE - 4, 'I10', 'Hipertensión esencial (primaria)', 'ACTIVE'
FROM patients p, doctors d, medical_centers mc, appointments a
WHERE p.national_id='1753214567' AND d.license_number='MED-EC-10421'
  AND mc.name='Centro Médico Los Andes' AND a.appointment_code='APT-2026-0001'
AND NOT EXISTS (SELECT 1 FROM medical_reports mr WHERE mr.appointment_id=a.id);

INSERT INTO medical_reports (patient_id, doctor_id, medical_center_id, appointment_id, title, type, content, issue_date, diagnosis_code, diagnosis, status)
SELECT p.id, d.id, mc.id, a.id, 'Constancia de asistencia', 'CONSTANCIA_ASISTENCIA',
  'El paciente acudió a consulta externa para control de diabetes tipo 1, presentando buen estado general y glucosa dentro de metas.',
  CURRENT_DATE - 2, 'E10', 'Diabetes mellitus tipo 1', 'ACTIVE'
FROM patients p, doctors d, medical_centers mc, appointments a
WHERE p.national_id='1723456789' AND d.license_number='MED-EC-10777'
  AND mc.name='Centro Médico Los Andes' AND a.appointment_code='APT-2026-0003'
AND NOT EXISTS (SELECT 1 FROM medical_reports mr WHERE mr.appointment_id=a.id);

-- ---------------------------------------------------------------- laboratorio: catálogo
INSERT INTO laboratory_categories (name, description)
VALUES
  ('Hematología', 'Biometría hemática y coagulación'),
  ('Bioquímica', 'Química sanguínea, perfil lipídico y glicemia'),
  ('Orina', 'Examen general de orina')
ON CONFLICT (name) DO NOTHING;

INSERT INTO laboratory_tests (category_id, internal_code, name, loinc_code)
SELECT c.id, v.code, v.name, v.loinc
FROM (VALUES
  ('Hematología', 'HEM-001', 'Biometría hemática completa', '58410-2'),
  ('Hematología', 'HEM-002', 'Velocidad de sedimentación globular', '4537-7'),
  ('Bioquímica', 'BIO-001', 'Glucosa en ayunas', '1558-6'),
  ('Bioquímica', 'BIO-002', 'Perfil lipídico completo', '5767-4'),
  ('Bioquímica', 'BIO-003', 'Creatinina', '2160-0'),
  ('Orina', 'ORI-001', 'Examen general de orina', '24357-6')
) AS v(cat, code, name, loinc)
JOIN laboratory_categories c ON c.name = v.cat
WHERE NOT EXISTS (SELECT 1 FROM laboratory_tests t WHERE t.internal_code = v.code);

-- ---------------------------------------------------------------- órdenes de laboratorio
INSERT INTO laboratory_orders (patient_id, doctor_id, medical_center_id, appointment_id, issue_date, diagnosis, additional_notes, status)
SELECT p.id, d.id, mc.id, a.id, CURRENT_DATE - 7, 'I10', 'Ayuno de 8 horas requerido.', 'ACTIVE'
FROM patients p, doctors d, medical_centers mc, appointments a
WHERE p.national_id='1753214567' AND d.license_number='MED-EC-10421'
  AND mc.name='Centro Médico Los Andes' AND a.appointment_code='APT-2026-0001'
AND NOT EXISTS (SELECT 1 FROM laboratory_orders lo WHERE lo.appointment_id=a.id);

INSERT INTO laboratory_orders (patient_id, doctor_id, medical_center_id, appointment_id, issue_date, diagnosis, additional_notes, status)
SELECT p.id, d.id, mc.id, a.id, CURRENT_DATE - 2, 'E10', 'Glucosa y HbA1c.', 'ACTIVE'
FROM patients p, doctors d, medical_centers mc, appointments a
WHERE p.national_id='1723456789' AND d.license_number='MED-EC-10777'
  AND mc.name='Centro Médico Los Andes' AND a.appointment_code='APT-2026-0003'
AND NOT EXISTS (SELECT 1 FROM laboratory_orders lo WHERE lo.appointment_id=a.id);

-- ítems de catálogo para la orden de Ana
INSERT INTO laboratory_order_tests (order_id, test_id, category_id, sort_order)
SELECT lo.id, t.id, t.category_id, v.so
FROM (VALUES ('HEM-001', 0), ('BIO-001', 1), ('BIO-002', 2), ('ORI-001', 3)) AS v(code, so)
JOIN laboratory_tests t ON t.internal_code = v.code
JOIN laboratory_orders lo ON lo.appointment_id = (SELECT id FROM appointments WHERE appointment_code='APT-2026-0001')
WHERE NOT EXISTS (SELECT 1 FROM laboratory_order_tests lot WHERE lot.order_id=lo.id AND lot.test_id=t.id);

-- ítems de catálogo para la orden de Gabriela
INSERT INTO laboratory_order_tests (order_id, test_id, category_id, sort_order)
SELECT lo.id, t.id, t.category_id, v.so
FROM (VALUES ('BIO-001', 0), ('HEM-001', 1), ('BIO-003', 2)) AS v(code, so)
JOIN laboratory_tests t ON t.internal_code = v.code
JOIN laboratory_orders lo ON lo.appointment_id = (SELECT id FROM appointments WHERE appointment_code='APT-2026-0003')
WHERE NOT EXISTS (SELECT 1 FROM laboratory_order_tests lot WHERE lot.order_id=lo.id AND lot.test_id=t.id);

-- ítem personalizado para la orden de Gabriela
INSERT INTO laboratory_order_custom_tests (order_id, category_name, test_name, sort_order)
SELECT lo.id, 'Bioquímica', 'Hemoglobina glucosilada (HbA1c)', 0
FROM laboratory_orders lo
WHERE lo.appointment_id = (SELECT id FROM appointments WHERE appointment_code='APT-2026-0003')
AND NOT EXISTS (SELECT 1 FROM laboratory_order_custom_tests l WHERE l.order_id=lo.id AND l.test_name LIKE 'Hemoglobina glucosilada%');

-- ---------------------------------------------------------------- tareas médicas
INSERT INTO tasks (doctor_id, title, description, priority, status, due_date)
SELECT d.id, 'Revisar resultados de laboratorio de Ana Torres', 'Perfil lipídico elevado, ajustar estatina si necesario.', 'HIGH', 'PENDING', now() + interval '2 days'
FROM doctors d WHERE d.license_number='MED-EC-10421'
AND NOT EXISTS (SELECT 1 FROM tasks t WHERE t.title LIKE 'Revisar resultados de laboratorio de Ana%');

INSERT INTO tasks (doctor_id, title, description, priority, status, due_date)
SELECT d.id, 'Actualizar esquema de insulina de Gabriela Suárez', 'Evaluar HbA1c del último mes.', 'MEDIUM', 'IN_PROGRESS', now() + interval '5 days'
FROM doctors d WHERE d.license_number='MED-EC-10777'
AND NOT EXISTS (SELECT 1 FROM tasks t WHERE t.title LIKE 'Actualizar esquema de insulina%');

COMMIT;

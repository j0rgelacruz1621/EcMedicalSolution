import { useMemo, useState } from 'react';
import { CalendarDays, Search, Save, UserRound, X } from 'lucide-react';
import './style.scss';

interface NewSupplementaryTestsProps {
	patientName: string;
	onClose: () => void;
}

interface LaboratoryArea {
	name: string;
	description: string;
	exams: string[];
}

const laboratoryAreas: LaboratoryArea[] = [
	{ name: 'HEMATOLOGÍA', description: 'Complete los resultados para la serie roja y blanca', exams: ['Hematología completa', 'Contaje de plaquetas', 'Hb. y Hto', 'Frotis de sangre periférica', 'Grupo sanguíneo y Factor RH', 'VSG'] },
	{ name: 'COAGULACIÓN', description: 'Registre los tiempos y factores de coagulación', exams: ['Tiempo de protrombina (TP)', 'Tiempo parcial de tromboplastina (TPT)', 'INR', 'Fibrinógeno'] },
	{ name: 'QUÍMICA', description: 'Complete los resultados del perfil químico', exams: ['Glicemia', 'Creatinina', 'Perfil lipídico', 'Hemoglobina glicosilada (HbA1c)', 'Ácido úrico', 'Transaminasas'] },
	{ name: 'SEROLOGÍA', description: 'Registre los resultados de pruebas serológicas', exams: ['VDRL', 'HIV', 'Hepatitis B', 'Hepatitis C'] },
	{ name: 'HORMONALES', description: 'Complete los resultados del perfil hormonal', exams: ['TSH', 'T4 libre', 'Cortisol', 'Estradiol'] },
	{ name: 'MARCADORES TUMORALES', description: 'Registre los resultados de marcadores tumorales', exams: ['PSA', 'CA 125', 'CA 19-9', 'Antígeno carcinoembrionario'] },
	{ name: 'VIRALES/INFECCIOSAS', description: 'Complete los resultados de pruebas infecciosas', exams: ['Dengue', 'COVID-19', 'Influenza', 'Chikungunya'] },
	{ name: 'ORINA Y HECES', description: 'Registre los resultados de uroanálisis y coprología', exams: ['Uroanálisis', 'Examen de heces', 'Sangre oculta en heces'] },
	{ name: 'OTROS', description: 'Agregue otros exámenes paraclínicos', exams: ['Examen adicional', 'Observación general'] },
];

export default function NewSupplementaryTests({ patientName, onClose }: NewSupplementaryTestsProps) {
	const [selectedArea, setSelectedArea] = useState(laboratoryAreas[0].name);
	const [search, setSearch] = useState('');
	const [values, setValues] = useState<Record<string, { result: string; observations: string }>>({});
	const area = laboratoryAreas.find((item) => item.name === selectedArea) ?? laboratoryAreas[0];
	const filteredExams = useMemo(() => area.exams.filter((exam) => exam.toLowerCase().includes(search.toLowerCase())), [area, search]);

	const updateValue = (exam: string, field: 'result' | 'observations', value: string) => {
		setValues((current) => ({ ...current, [exam]: { result: current[exam]?.result ?? '', observations: current[exam]?.observations ?? '', [field]: value } }));
	};

	return (
		<div className="new-supplementary-overlay" role="dialog" aria-modal="true" aria-labelledby="new-supplementary-title">
			<header className="new-supplementary-header">
				<div className="new-supplementary-patient"><div className="new-supplementary-avatar"><UserRound size={21} /></div><div><h1>{patientName}</h1><p><CalendarDays size={13} /> 13 de Julio de 2026 <span>•</span> <strong>Registro de Paraclínicos</strong></p></div></div>
				<button type="button" className="new-supplementary-close" aria-label="Cerrar registro de paraclínicos" onClick={onClose}><X size={22} /></button>
			</header>

			<main className="new-supplementary-content">
				<aside className="laboratory-sidebar" aria-label="Áreas del laboratorio clínico"><h2>SELECCIONAR ÁREA PRINCIPAL DEL LABORATORIO CLÍNICO</h2><nav>{laboratoryAreas.map((item) => <button key={item.name} type="button" className={item.name === selectedArea ? 'selected' : ''} onClick={() => { setSelectedArea(item.name); setSearch(''); }}>{item.name}</button>)}</nav></aside>

				<section className="laboratory-panel"><div className="laboratory-panel-heading"><div><h2 id="new-supplementary-title">Registro de {area.name.charAt(0) + area.name.slice(1).toLowerCase()}</h2><p>{area.description}</p></div><label className="exam-search"><Search size={18} /><span className="sr-only">Buscar examen</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar examen por nombre..." /></label></div><div className="exam-list">{filteredExams.map((exam, index) => <article className="exam-card" key={exam}><h3>{index + 1}. {exam}</h3><div className="exam-fields"><label>Resultado<input value={values[exam]?.result ?? ''} onChange={(event) => updateValue(exam, 'result', event.target.value)} placeholder="Resultado..." /></label><label>Observaciones<input value={values[exam]?.observations ?? ''} onChange={(event) => updateValue(exam, 'observations', event.target.value)} placeholder="Observaciones clínicas..." /></label></div></article>)}{filteredExams.length === 0 && <p className="empty-exams">No se encontraron exámenes con ese nombre.</p>}</div></section>
			</main>

			<footer className="new-supplementary-footer"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button type="button" className="save-button" onClick={onClose}><Save size={15} />Guardar Paraclínicos</button></footer>
		</div>
	);
}

import { useMemo, useState } from 'react';
import { CalendarDays, Plus, Search, Save, Trash2, UserRound, X } from 'lucide-react';
import './style.scss';

interface NewSupplementaryTestsProps {
	patientName: string;
	onClose: () => void;
}

interface LaboratoryArea {
	name: string;
	description: string;
	exams: string[];
	title?: string;
	customExams?: boolean;
	hideSearch?: boolean;
}

interface CustomExam {
	id: number;
	name: string;
	result: string;
	observations: string;
}

const laboratoryAreas: LaboratoryArea[] = [
	{ name: 'HEMATOLOGÍA', description: 'Complete los resultados para la serie roja y blanca', exams: ['Hematología completa', 'Contaje de plaquetas', 'Hb. y Hto', 'Frotis de sangre periférica', 'Grupo sanguíneo y Factor RH', 'VSG'] },
	{ name: 'COAGULACIÓN', description: 'Complete los resultados para hemostasia y factores de la coagulación', exams: ['Tiempo de protrombina (PT)', 'Tiempo parcial de tromboplastina (PTT)', 'INR', 'Fibrinógeno', 'Tiempo de sangría'] },
	{
		name: 'QUÍMICA',
		description: 'Complete los resultados para perfil metabólico, renal, hepático y lipídico',
		exams: [
			'Glicemia basal',
			'Glicemia post-prandial',
			'Insulina basal',
			'Insulina post-prandial',
			'Urea',
			'Creatinina',
			'Colesterol Total',
			'HDL - LDL',
			'Triglicéridos',
			'Hemoglobina glicosilada',
			'Ácido úrico',
			'TGP - TGO',
			'Proteína T. y F.',
			'Bilirrubina T. y F.',
			'Electrolitos (K, CL, NA)',
			'Fosfatasa alcalina',
			'Amilasa',
			'Hierro',
			'Lipasa',
			'Calcio',
		],
	},
	{
		name: 'SEROLOGÍA',
		description: 'Complete los resultados para pruebas inmunológicas y reactantes de fase aguda',
		exams: ['RA test', 'Proteína C reactiva', 'Factor reumatoideo', 'Mono test', 'Prueba de embarazo'],
	},
	{
		name: 'HORMONALES',
		description: 'Complete los resultados para perfil endocrino y regulación metabólica',
		exams: [
			'T3',
			'T4',
			'TSH',
			'LH',
			'FSH',
			'Tiroglobulina',
			'Progesterona',
			'Estradiol',
			'Prolactina',
			'AC. Antitiroglobulinas',
			'AC. Antiperoxidasa',
			'AC. Antitiroideo',
			'DHEA',
			'DHEA-SO4',
			'Testosterona',
			'17-Hidroxiprogesterona',
		],
	},
	{
		name: 'MARCADORES TUMORALES',
		description: 'Complete los resultados para Inmunodiagnóstico oncológico y biomarcadores',
		exams: [
			'AFP',
			'CEA',
			'CA 15-3 (BR-MA)',
			'CA 19-9 (GI-MA)',
			'CA 125 (OM-MA)',
			'CA 72-4',
			'PSA Total',
			'PSA Libre',
		],
	},
	{
		name: 'VIRALES/INFECCIOSAS',
		title: 'Virales / Infecciosas',
		description: 'Complete los resultados para Inmunodiagnóstico infeccioso y marcadores virales',
		exams: [
			'HIV',
			'VDRL',
			'Toxoplasmosis',
			'Hepatitis A',
			'Hepatitis B',
			'Hepatitis C',
			'Epstein Barr',
			'Citomegalovirus',
			'Dengue',
			'Covid',
		],
	},
	{
		name: 'ORINA Y HECES',
		description: 'Complete los resultados para Uroanálisis y coproanálisis clínico',
		exams: [
			'Uroanálisis',
			'Urocultivo',
			'Proteinuria en 24H',
			'Calcio en la orina',
			'Coproanálisis',
			'Sangre Oculta en Heces',
			'Helicobacter pylori en heces',
		],
	},
	{
		name: 'OTROS',
		description: 'Ingrese el resultado de las pruebas no clasificadas en las áreas anteriores.',
		exams: [],
		title: 'Resultados de exámenes fuera del panel principal',
		customExams: true,
		hideSearch: true,
	},
];

const examsWithFreeAndTotal = new Set(['T3', 'T4', 'Testosterona']);
const serologyFields: Record<string, string[]> = {
	Toxoplasmosis: ['IgG', 'IgM'],
	'Hepatitis A': ['IgG', 'IgM'],
	'Hepatitis B': ['IgM', 'AC.I'],
	'Hepatitis C': ['IgG', 'IgM'],
	'Epstein Barr': ['IgG', 'IgM'],
	Citomegalovirus: ['IgG', 'IgM'],
	Dengue: ['IgG', 'IgM'],
	Covid: ['IgG', 'IgM'],
};

function formatCurrentDate() {
	return new Intl.DateTimeFormat('es-ES', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	}).format(new Date());
}

export default function NewSupplementaryTests({ patientName, onClose }: NewSupplementaryTestsProps) {
	const [selectedArea, setSelectedArea] = useState('COAGULACIÓN');
	const [search, setSearch] = useState('');
	const [values, setValues] = useState<Record<string, { result: string; observations: string; free?: string; total?: string; serology?: Record<string, string> }>>({});
	const [customExams, setCustomExams] = useState<CustomExam[]>([
		{ id: 1, name: '', result: '', observations: '' },
	]);
	const area = laboratoryAreas.find((item) => item.name === selectedArea) ?? laboratoryAreas[0];
	const filteredExams = useMemo(() => area.exams.filter((exam) => exam.toLowerCase().includes(search.toLowerCase())), [area, search]);

	const updateValue = (exam: string, field: 'result' | 'observations', value: string) => {
		setValues((current) => ({ ...current, [exam]: { result: current[exam]?.result ?? '', observations: current[exam]?.observations ?? '', [field]: value } }));
	};

	const updateFreeOrTotal = (exam: string, field: 'free' | 'total', value: string) => {
		setValues((current) => ({
			...current,
			[exam]: {
				result: current[exam]?.result ?? '',
				observations: current[exam]?.observations ?? '',
				...current[exam],
				[field]: value,
			},
		}));
	};

	const updateSerologyResult = (exam: string, field: string, value: string) => {
		setValues((current) => ({
			...current,
			[exam]: {
				result: current[exam]?.result ?? '',
				observations: current[exam]?.observations ?? '',
				...current[exam],
				serology: { ...current[exam]?.serology, [field]: value },
			},
		}));
	};

	const updateCustomExam = (id: number, field: 'name' | 'result' | 'observations', value: string) => {
		setCustomExams((current) =>
			current.map((exam) => (exam.id === id ? { ...exam, [field]: value } : exam)),
		);
	};

	const addCustomExam = () => {
		setCustomExams((current) => [
			...current,
			{
				id: Math.max(0, ...current.map((exam) => exam.id)) + 1,
				name: '',
				result: '',
				observations: '',
			},
		]);
	};

	const removeCustomExam = (id: number) => {
		setCustomExams((current) => current.filter((exam) => exam.id !== id));
	};

	const panelTitle = area.customExams
		? `Registro de ${area.title}`
		: `Registro de ${area.title ?? area.name.charAt(0) + area.name.slice(1).toLowerCase()}`;

	return (
		<div className="new-supplementary-overlay" role="dialog" aria-modal="true" aria-labelledby="new-supplementary-title">
			<header className="new-supplementary-header">
				<div className="new-supplementary-patient"><div className="new-supplementary-avatar"><UserRound size={21} /></div><div><h1>{patientName}</h1><p><CalendarDays size={13} /> {formatCurrentDate()} <span>•</span> <strong>Registro de Paraclínicos</strong></p></div></div>
				<button type="button" className="new-supplementary-close" aria-label="Cerrar registro de paraclínicos" onClick={onClose}><X size={22} /></button>
			</header>

			<main className="new-supplementary-content">
				<aside className="laboratory-sidebar" aria-label="Áreas del laboratorio clínico"><h2>SELECCIONAR ÁREA PRINCIPAL DEL LABORATORIO CLÍNICO</h2><nav>{laboratoryAreas.map((item) => <button key={item.name} type="button" className={item.name === selectedArea ? 'selected' : ''} aria-pressed={item.name === selectedArea} onClick={() => { setSelectedArea(item.name); setSearch(''); }}>{item.name}</button>)}</nav></aside>

				<section className="laboratory-panel">
					<div className="laboratory-panel-heading">
						<div>
							<h2 id="new-supplementary-title">{panelTitle}</h2>
							<p>{area.description}</p>
						</div>
						{!area.hideSearch && (
							<label className="exam-search">
								<Search size={18} />
								<span className="sr-only">Buscar examen</span>
								<input
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									placeholder="Buscar examen por nombre..."
								/>
							</label>
						)}
					</div>

					<div className={area.customExams ? 'exam-list custom-exam-list' : 'exam-list'}>
						{area.customExams ? (
							<>
								{customExams.map((exam, index) => (
									<article className="exam-card custom-exam-card" key={exam.id}>
										<div className="custom-exam-heading">
											<h3>{index + 1}. Examen Personalizado / Adicional</h3>
											<button
												type="button"
												className="remove-custom-exam"
												onClick={() => removeCustomExam(exam.id)}
												aria-label={`Eliminar examen personalizado ${index + 1}`}
											>
												<Trash2 size={14} />
												Eliminar
											</button>
										</div>
										<div className="custom-exam-name">
											<label htmlFor={`custom-exam-name-${exam.id}`}>Nombre del Examen</label>
											<input
												id={`custom-exam-name-${exam.id}`}
												value={exam.name}
												onChange={(event) => updateCustomExam(exam.id, 'name', event.target.value)}
												placeholder="Ej. Biopsia de piel, Gasometría arterial, Panel genético..."
											/>
										</div>
										<div className="exam-fields">
											<label>
												Resultado
												<input
													value={exam.result}
													onChange={(event) => updateCustomExam(exam.id, 'result', event.target.value)}
													placeholder="Resultado..."
												/>
											</label>
											<label>
												Observaciones
												<input
													value={exam.observations}
													onChange={(event) => updateCustomExam(exam.id, 'observations', event.target.value)}
													placeholder="Observaciones clínicas..."
												/>
											</label>
										</div>
									</article>
								))}
								<button type="button" className="add-custom-exam" onClick={addCustomExam}>
									<Plus size={16} />
									Agregar otro examen personalizado
								</button>
							</>
						) : (
							<>
								{filteredExams.map((exam) => {
									const examNumber = area.exams.indexOf(exam) + 1;
									const isFreeAndTotalExam = area.name === 'HORMONALES' && examsWithFreeAndTotal.has(exam);
									const markers = area.name === 'VIRALES/INFECCIOSAS' ? serologyFields[exam] : undefined;

									return (
										<article className="exam-card" key={exam}>
											<h3>{examNumber}. {exam}</h3>
											{markers ? (
												<div className="exam-fields exam-fields-serology">
													{markers.map((marker) => (
														<label key={marker}>
															{marker}
															<input
																value={values[exam]?.serology?.[marker] ?? ''}
																onChange={(event) => updateSerologyResult(exam, marker, event.target.value)}
																placeholder="Resultado..."
															/>
														</label>
													))}
													<label className="exam-observations">
														Observaciones
														<input
															value={values[exam]?.observations ?? ''}
															onChange={(event) => updateValue(exam, 'observations', event.target.value)}
															placeholder="Observaciones clínicas..."
														/>
													</label>
												</div>
											) : isFreeAndTotalExam ? (
												<div className="exam-fields exam-fields-free-total">
													<label>
														Libre
														<input
															value={values[exam]?.free ?? ''}
															onChange={(event) => updateFreeOrTotal(exam, 'free', event.target.value)}
															placeholder="Resultado..."
														/>
													</label>
													<label>
														Total
														<input
															value={values[exam]?.total ?? ''}
															onChange={(event) => updateFreeOrTotal(exam, 'total', event.target.value)}
															placeholder="Resultado..."
														/>
													</label>
													<label className="exam-observations">
														Observaciones
														<input
															value={values[exam]?.observations ?? ''}
															onChange={(event) => updateValue(exam, 'observations', event.target.value)}
															placeholder="Observaciones clínicas..."
														/>
													</label>
												</div>
											) : (
												<div className="exam-fields">
													<label>
														Resultado
														<input
															value={values[exam]?.result ?? ''}
															onChange={(event) => updateValue(exam, 'result', event.target.value)}
															placeholder="Resultado..."
														/>
													</label>
													<label>
														Observaciones
														<input
															value={values[exam]?.observations ?? ''}
															onChange={(event) => updateValue(exam, 'observations', event.target.value)}
															placeholder="Observaciones clínicas..."
														/>
													</label>
												</div>
											)}
										</article>
									);
								})}
								{filteredExams.length === 0 && <p className="empty-exams">No se encontraron exámenes con ese nombre.</p>}
							</>
						)}
					</div>
				</section>
			</main>

			<footer className="new-supplementary-footer"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button type="button" className="save-button" onClick={onClose}><Save size={15} />Guardar Paraclínicos</button></footer>
		</div>
	);
}

import { useState } from 'react';
import { Activity, CalendarDays, ChevronDown, ChevronUp, Gauge, HeartPulse, Printer, Save, UserRound, X } from 'lucide-react';
import './style.scss';

interface ClinicalStudiesModalProps {
	isOpen: boolean;
	patientName: string;
	onClose: () => void;
}

const studySections = [
	{ id: 'echocardiogram', title: 'ECOCARDIOGRAMA', icon: HeartPulse, placeholder: 'Registre los hallazgos ecocardiográficos del paciente...' },
	{ id: 'holter', title: 'HOLTER DE ARRITMIAS', icon: Activity, placeholder: 'Registre los eventos arrítmicos detectados durante el monitoreo...' },
	{ id: 'mapa', title: 'MAPA (MONITOREO AMBULATORIO DE PRESIÓN ARTERIAL)', icon: Gauge, placeholder: 'Registre los resultados del monitoreo ambulatorio de presión arterial...' },
] as const;

const echoInitialValues = {
	SVId: '07', DDVId: '71', PPVId: '08', ER: '0.22', Masa: '133', FEVI: '24', RaizAo: '3.5',
	AI: '135', AIIndex: '77', AD: '102', ADIndex: '58', VDDB: '07', VDDM: '05', VDLong: '04', TAPSE: '15', VCI: '27',
	septumBase: '1', septumMedio: '1', septumApical: '1', anteriorBase: '1', anteriorMedio: '1', anteriorApical: '1',
	lateralBase: '1', lateralMedio: '1', lateralApical: '1', inferiorBase: '1', inferiorMedio: '1', inferiorApical: '1',
	posteriorBase: '1', posteriorMedio: '1', posteriorApical: '1', apexBase: '1', apexMedio: '1', apexApical: '1',
	transmitralE: '', transmitralA: '', transmitralEA: '', transmitralTdec: '', tissueS: '', tissueE: '', tissueA: '', tissueEe: '',
	aortaVmax: '', aortaGp: '', aortaDescription: 'Competente por doppler color y continuo.', mitralDescription: '',
	pulmonarVmax: '', pulmonarGp: '', pulmonarDescription: '', tricuspidVmax: '', tricuspidGp: '', tricuspidDescription: '',
};

const conclusionText = `1. VENTRÍCULO IZQUIERDO NO DILATADO CON PATRÓN GEOMÉTRICO NORMAL Y FUNCIÓN SISTÓLICA DEL VI CONSERVADA (%) SIN TRASTORNOS DE CINESIA REGIONAL.
2. FUNCIÓN DIASTÓLICA DEL VI NORMAL.
3. VENTRÍCULO DERECHO NO DILATADO CON FUNCIÓN SISTÓLICA CONSERVADA.
4. AURÍCULAS NO DILATADAS.
5. APARATO VALVULAR COMPETENTE.
6. PERICARDIO INDEMNE.`;

type EchoValues = typeof echoInitialValues;

function EchoField({ label, value, unit, onChange }: { label: string; value: string; unit?: string; onChange: (value: string) => void }) {
	return (
		<label className="echo-field">
			<span>{label}</span>
			<div className="echo-input-wrap">
				<input type="number" step="any" value={value} onChange={(event) => onChange(event.target.value)} />
				{unit ? <em>{unit}</em> : null}
			</div>
		</label>
	);
}

function EchoTextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
	return (
		<label className="echo-text-field">
			<span>{label}</span>
			<input type="text" value={value} onChange={(event) => onChange(event.target.value)} />
		</label>
	);
}

function EchoSectionTitle({ children }: { children: string }) {
	return <h3 className="echo-section-title">{children}</h3>;
}

function EchocardiogramForm() {
	const [values, setValues] = useState<EchoValues>(echoInitialValues);
	const [conclusions, setConclusions] = useState(conclusionText);

	const updateValue = (field: keyof EchoValues, value: string) => {
		setValues((current) => ({ ...current, [field]: value }));
	};

	const saveStudy = () => {
		localStorage.setItem('ecmedical-ecocardiograma', JSON.stringify({ values, conclusions }));
	};

	const segments = [
		['Septum', 'septum'], ['P. Anterior', 'anterior'], ['P. Lateral', 'lateral'],
		['P. Inferior', 'inferior'], ['P. Posterior', 'posterior'], ['Ápex', 'apex'],
	] as const;

	return (
		<div className="echocardiogram-form">
			<EchoSectionTitle>BIDIMENSIONAL Y MODO M</EchoSectionTitle>
			<div className="echo-fields-grid">
				<EchoField label="SVId" value={values.SVId} unit="mm" onChange={(value) => updateValue('SVId', value)} />
				<EchoField label="DDVId" value={values.DDVId} unit="mm" onChange={(value) => updateValue('DDVId', value)} />
				<EchoField label="PPVId" value={values.PPVId} unit="mm" onChange={(value) => updateValue('PPVId', value)} />
				<EchoField label="E.R" value={values.ER} onChange={(value) => updateValue('ER', value)} />
				<EchoField label="Masa" value={values.Masa} unit="g/m²" onChange={(value) => updateValue('Masa', value)} />
				<EchoField label="FEVI" value={values.FEVI} unit="%" onChange={(value) => updateValue('FEVI', value)} />
				<EchoField label="Raíz Ao" value={values.RaizAo} unit="cm" onChange={(value) => updateValue('RaizAo', value)} />
				<div className="echo-paired-fields"><EchoField label="AI (mL)" value={values.AI} unit="mL" onChange={(value) => updateValue('AI', value)} /><EchoField label="/Ind" value={values.AIIndex} unit="mL/sc" onChange={(value) => updateValue('AIIndex', value)} /></div>
				<div className="echo-paired-fields"><EchoField label="AD (mL)" value={values.AD} unit="mL" onChange={(value) => updateValue('AD', value)} /><EchoField label="/Ind" value={values.ADIndex} unit="mL/sc" onChange={(value) => updateValue('ADIndex', value)} /></div>
				<EchoField label="VD DB" value={values.VDDB} unit="mm" onChange={(value) => updateValue('VDDB', value)} />
				<EchoField label="VD DM" value={values.VDDM} unit="mm" onChange={(value) => updateValue('VDDM', value)} />
				<EchoField label="VD Long" value={values.VDLong} unit="mm" onChange={(value) => updateValue('VDLong', value)} />
				<EchoField label="TAPSE" value={values.TAPSE} unit="mm" onChange={(value) => updateValue('TAPSE', value)} />
				<EchoField label="VCI" value={values.VCI} unit="mm >50%" onChange={(value) => updateValue('VCI', value)} />
			</div>

			<EchoSectionTitle>TRASTORNOS DE CINESIA</EchoSectionTitle>
			<div className="kinetic-table-wrap">
				<table className="kinetic-table"><thead><tr><th scope="col">Segmento</th><th scope="col">Base</th><th scope="col">Medio</th><th scope="col">Apical</th></tr></thead>
					<tbody>{segments.map(([label, key]) => <tr key={key}><th scope="row">{label}</th>{(['Base', 'Medio', 'Apical'] as const).map((zone) => { const field = `${key}${zone}` as keyof EchoValues; return <td key={zone}><input aria-label={`${label} ${zone}`} type="number" min="1" max="3" value={values[field]} onChange={(event) => updateValue(field, event.target.value)} /></td>; })}</tr>)}</tbody>
				</table>
				<p className="table-legend">1: Normal, 2: Hipocinesia, 3: Acinesia</p>
			</div>

			<EchoSectionTitle>DOPPLER PULSADO Y CONTÍNUO</EchoSectionTitle>
			<h4 className="echo-subtitle">FUNCIÓN DIASTÓLICA DEL VI</h4>
			<div className="doppler-grid"><div className="doppler-row"><strong>Flujo transmitral</strong><EchoField label="E" value={values.transmitralE} unit="m/s" onChange={(value) => updateValue('transmitralE', value)} /><EchoField label="A" value={values.transmitralA} unit="m/s" onChange={(value) => updateValue('transmitralA', value)} /><EchoField label="E/A" value={values.transmitralEA} onChange={(value) => updateValue('transmitralEA', value)} /><EchoField label="Tdec" value={values.transmitralTdec} unit="ms" onChange={(value) => updateValue('transmitralTdec', value)} /></div><div className="doppler-row"><strong>Doppler tisular</strong><EchoField label="s'" value={values.tissueS} unit="m/s" onChange={(value) => updateValue('tissueS', value)} /><EchoField label="e'" value={values.tissueE} unit="m/s" onChange={(value) => updateValue('tissueE', value)} /><EchoField label="a'" value={values.tissueA} unit="m/s" onChange={(value) => updateValue('tissueA', value)} /><EchoField label="E/e'" value={values.tissueEe} onChange={(value) => updateValue('tissueEe', value)} /></div></div>

			<EchoSectionTitle>APARATO VALVULAR</EchoSectionTitle>
			<div className="valves-grid"><div className="valve-row"><strong>Aorta</strong><EchoField label="Vmax" value={values.aortaVmax} unit="m/s" onChange={(value) => updateValue('aortaVmax', value)} /><EchoField label="Gp" value={values.aortaGp} unit="mmHg" onChange={(value) => updateValue('aortaGp', value)} /><EchoTextField label="Descripción" value={values.aortaDescription} onChange={(value) => updateValue('aortaDescription', value)} /></div><div className="valve-row"><strong>Mitral</strong><EchoTextField label="Descripción" value={values.mitralDescription} onChange={(value) => updateValue('mitralDescription', value)} /></div><div className="valve-row"><strong>Pulmonar</strong><EchoField label="Vmax" value={values.pulmonarVmax} unit="m/s" onChange={(value) => updateValue('pulmonarVmax', value)} /><EchoField label="Gp" value={values.pulmonarGp} unit="mmHg" onChange={(value) => updateValue('pulmonarGp', value)} /><EchoTextField label="Descripción" value={values.pulmonarDescription} onChange={(value) => updateValue('pulmonarDescription', value)} /></div><div className="valve-row"><strong>Tricúspide</strong><EchoField label="Vmax" value={values.tricuspidVmax} unit="m/s" onChange={(value) => updateValue('tricuspidVmax', value)} /><EchoField label="Gp" value={values.tricuspidGp} unit="mmHg" onChange={(value) => updateValue('tricuspidGp', value)} /><EchoTextField label="Descripción" value={values.tricuspidDescription} onChange={(value) => updateValue('tricuspidDescription', value)} /></div></div>

			<EchoSectionTitle>CONCLUSIONES</EchoSectionTitle>
			<textarea className="conclusions-textarea" value={conclusions} onChange={(event) => setConclusions(event.target.value)} aria-label="Conclusiones del ecocardiograma" />
			<div className="study-actions"><button type="button" className="study-outline-button" onClick={saveStudy}><Save size={16} />Guardar</button><button type="button" className="study-outline-button" onClick={() => window.print()}><Printer size={17} />Imprimir</button></div>
		</div>
	);
}

function MapaForm() {
	const [dayAverage, setDayAverage] = useState('');
	const [nightAverage, setNightAverage] = useState('');
	const [analysis, setAnalysis] = useState('');

	const saveMapa = () => {
		localStorage.setItem('ecmedical-mapa', JSON.stringify({ dayAverage, nightAverage, analysis }));
	};

	return (
		<div className="mapa-form">
			<h3 className="echo-section-title">PROMEDIOS TENSIONALES</h3>
			<div className="mapa-averages-grid">
				<label className="mapa-field">
					<span>Promedio Diurno</span>
					<input type="text" value={dayAverage} placeholder="Ej: 120/80" onChange={(event) => setDayAverage(event.target.value)} />
				</label>
				<label className="mapa-field">
					<span>Promedio Nocturno</span>
					<input type="text" value={nightAverage} placeholder="Ej: 110/70" onChange={(event) => setNightAverage(event.target.value)} />
				</label>
			</div>

			<h3 className="echo-section-title">ANÁLISIS CLÍNICO</h3>
			<textarea className="mapa-analysis" value={analysis} placeholder="Análisis clínico de los promedios de presión arterial..." onChange={(event) => setAnalysis(event.target.value)} aria-label="Análisis clínico de MAPA" />
			<div className="study-actions">
				<button type="button" className="study-outline-button" onClick={saveMapa}><Save size={16} />Guardar</button>
				<button type="button" className="study-outline-button" onClick={() => window.print()}><Printer size={17} />Imprimir</button>
			</div>
		</div>
	);
}

export default function ClinicalStudiesModal({ isOpen, patientName, onClose }: ClinicalStudiesModalProps) {
	const [openSection, setOpenSection] = useState('holter');
	const [holterFindings, setHolterFindings] = useState('');

	const saveHolter = () => {
		localStorage.setItem('ecmedical-holter-arritmias', holterFindings);
	};

	if (!isOpen) return null;

	return (
		<div className="clinical-studies-overlay" onClick={onClose} role="presentation">
			<div className="clinical-studies-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="clinical-studies-title">
				<header className="clinical-studies-header">
					<div>
						<h2 id="clinical-studies-title">Agregar Estudios</h2>
						<div className="clinical-studies-context">
							<span><UserRound size={14} />{patientName}</span>
							<i aria-hidden="true" />
							<span><CalendarDays size={15} />13 de Julio de 2026</span>
						</div>
					</div>
					<button type="button" className="clinical-studies-close" aria-label="Cerrar agregar estudios" onClick={onClose}><X size={21} /></button>
				</header>

				<div className="clinical-studies-body">
					{studySections.map(({ id, title, icon: Icon, placeholder }) => {
						const isExpanded = openSection === id;
						return (
							<section key={id} className={`study-accordion ${isExpanded ? 'expanded' : ''}`}>
								<button type="button" className="study-accordion-trigger" aria-expanded={isExpanded} onClick={() => setOpenSection(isExpanded ? '' : id)}>
									<span className="study-accordion-icon"><Icon size={21} /></span>
									<strong>{title}</strong>
									{isExpanded ? <ChevronUp size={19} /> : <ChevronDown size={19} />}
								</button>
								{isExpanded ? (
									<div className="study-accordion-content">
										{id === 'echocardiogram' ? <EchocardiogramForm /> : id === 'mapa' ? <MapaForm /> : <><textarea aria-label={`Resultado de ${title}`} placeholder={placeholder} value={holterFindings} onChange={(event) => setHolterFindings(event.target.value)} /><div className="study-actions"><button type="button" className="study-outline-button" onClick={saveHolter}><Save size={16} />Guardar</button><button type="button" className="study-outline-button" onClick={() => window.print()}><Printer size={17} />Imprimir</button></div></>}
									</div>
								) : null}
							</section>
						);
					})}
				</div>
			</div>
		</div>
	);
}

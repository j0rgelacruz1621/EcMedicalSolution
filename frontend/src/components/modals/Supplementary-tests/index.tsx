import { FlaskConical, Microscope, Plus, X } from 'lucide-react';
import './style.scss';

interface SupplementaryTestsModalProps {
	isOpen: boolean;
	patientName: string;
	onClose: () => void;
	onAddTest?: () => void;
}

const testsByYear = [
	{
		year: '2026',
		tests: [{ month: 'SEP', day: '12', title: 'QUÍMICA', detail: 'Hemoglobina Glicosilada (HbA1c)', value: '5.8%', status: 'ALTO' }],
	},
	{
		year: '2025',
		tests: [{ month: 'AGO', day: '28', title: 'HEMATOLOGÍA', detail: 'Hematología completa', value: 'Creat. 0.9', status: 'ALTO' }],
	},
];

export default function SupplementaryTestsModal({ isOpen, patientName, onClose, onAddTest }: SupplementaryTestsModalProps) {
	if (!isOpen) return null;

	return (
		<div className="supplementary-tests-overlay" onClick={onClose} role="presentation">
			<div className="supplementary-tests-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="supplementary-tests-title">
				<header className="supplementary-tests-header">
					<div className="supplementary-tests-heading">
						<div className="supplementary-tests-icon"><Microscope size={21} /></div>
						<div>
							<h2 id="supplementary-tests-title">Historial de Paraclínicos</h2>
							<p>Paciente: <strong>{patientName}</strong></p>
						</div>
					</div>
					<button type="button" className="supplementary-tests-close" aria-label="Cerrar historial de paraclínicos" onClick={onClose}><X size={21} /></button>
				</header>

				<div className="supplementary-tests-body">
					<p className="supplementary-tests-section-label">HISTORIAL CRONOLÓGICO</p>
					{testsByYear.map(({ year, tests }) => (
						<section key={year} className="supplementary-tests-year">
							<h3>{year}</h3>
							{tests.map((test) => (
								<article key={`${year}-${test.title}`} className="supplementary-test-card">
									<div className="supplementary-test-date"><span>{test.month}</span><strong>{test.day}</strong></div>
									<div className="supplementary-test-info"><div className="supplementary-test-title"><FlaskConical size={17} /><strong>{test.title}</strong></div><span>{test.detail}</span></div>
									<div className="supplementary-test-result"><strong>{test.value}</strong><b>{test.status}</b><button type="button">Observaciones clínicas</button></div>
								</article>
							))}
						</section>
					))}
				</div>

				<footer className="supplementary-tests-footer"><button type="button" className="supplementary-tests-add" onClick={onAddTest}><Plus size={19} />Agregar paraclínicos</button></footer>
			</div>
		</div>
	);
}

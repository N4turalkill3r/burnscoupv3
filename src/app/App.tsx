import { BurnsStep } from '@/features/body-model/BurnsStep';
import { FindingsStep } from '@/features/findings/FindingsStep';
import { HistoryView } from '@/features/history/HistoryView';
import { useAutosave } from '@/features/history/useAutosave';
import { PatientStep } from '@/features/patient/PatientStep';
import { TimingStep } from '@/features/patient/TimingStep';
import { ResultsStep } from '@/features/results/ResultsStep';
import { DISCLAIMER } from '@/features/results/summary';
import { Logo } from '@/shared/components/Logo';
import { STEPS, useAppStore, type StepId } from './store';

const STEP_VIEW: Record<StepId, () => React.JSX.Element> = {
  patient: PatientStep,
  timing: TimingStep,
  burns: BurnsStep,
  findings: FindingsStep,
  results: ResultsStep,
};

export function App() {
  const step = useAppStore((s) => s.step);
  const goTo = useAppStore((s) => s.goTo);
  const reset = useAppStore((s) => s.reset);
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const saveStatus = useAutosave();

  const index = STEPS.findIndex((s) => s.id === step);
  const previous = STEPS[index - 1];
  const next = STEPS[index + 1];
  const View = STEP_VIEW[step];

  const changeStep = (id: StepId) => {
    goTo(id);
    window.scrollTo({ top: 0 });
  };

  const newPatient = () => {
    // El caso actual ya está guardado en el historial (si tenía edad y peso válidos).
    if (window.confirm('¿Empezar con un paciente nuevo? El caso actual queda en el historial.')) {
      reset();
      window.scrollTo({ top: 0 });
    }
  };

  const inHistory = view === 'history';

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <Logo size={40} />
          <div>
            <h1 className="app__title">BurnScope</h1>
            <p className="app__subtitle">Parkland · SEM</p>
          </div>
        </div>
        <div className="app__actions">
          <button
            type="button"
            className={`btn btn--ghost ${inHistory ? 'is-active' : ''}`.trim()}
            aria-pressed={inHistory}
            onClick={() => setView(inHistory ? 'wizard' : 'history')}
          >
            Historial
          </button>
          <button type="button" className="btn btn--ghost" onClick={newPatient}>
            Paciente nuevo
          </button>
        </div>
        <nav className="steps" aria-label="Pasos">
          <ol>
            {STEPS.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`steps__item ${!inHistory && s.id === step ? 'is-current' : ''}`.trim()}
                  aria-current={!inHistory && s.id === step ? 'step' : undefined}
                  onClick={() => changeStep(s.id)}
                >
                  <span className="steps__number" aria-hidden>
                    {i + 1}
                  </span>
                  {s.label}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      <main className="app__main" id="contenido">
        {inHistory ? <HistoryView /> : <View />}
        {saveStatus === 'unavailable' && (
          <p className="field__error" role="alert">
            No se pudo guardar en el historial (almacenamiento lleno o bloqueado).
          </p>
        )}
      </main>

      <footer className="app__footer">
        {!inHistory && (
          <div className="pager">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={!previous}
              onClick={() => previous && changeStep(previous.id)}
            >
              Atrás
            </button>
            {next && (
              <button type="button" className="btn" onClick={() => changeStep(next.id)}>
                Siguiente: {next.label}
              </button>
            )}
          </div>
        )}
        <p className="disclaimer">{DISCLAIMER}</p>
      </footer>
    </div>
  );
}

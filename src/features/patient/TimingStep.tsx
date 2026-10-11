import { useAppStore } from '@/app/store';
import { useAssessment } from '@/app/useAssessment';
import { FIRST_BLOCK_HOURS, TOTAL_RESUSCITATION_HOURS } from '@/data/fluidProtocol';
import { Callout } from '@/shared/components/Callout';
import { Card } from '@/shared/components/Card';
import { formatHours, minusMinutes, nowLocalInputValue } from '@/shared/utils/time';

const PRESETS_MINUTES = [30, 60, 120, 180, 240, 360] as const;
const presetLabel = (m: number) => (m < 60 ? `${m} min` : `${m / 60} h`);

export function TimingStep() {
  const burnAt = useAppStore((s) => s.burnAt);
  const arrivalAt = useAppStore((s) => s.arrivalAt);
  const setBurnAt = useAppStore((s) => s.setBurnAt);
  const setArrivalAt = useAppStore((s) => s.setArrivalAt);
  const { elapsedHours } = useAssessment();

  return (
    <div className="stack">
      <Card
        title="Horas del evento"
        description="El volumen de 24 h se cuenta desde la hora exacta de la quemadura."
      >
        <div className="stack">
          <div className="field">
            <label className="field__label" htmlFor="arrival-at">
              Hora de llegada del equipo médico
            </label>
            <div className="inline">
              <input
                id="arrival-at"
                className="input"
                type="datetime-local"
                value={arrivalAt}
                onChange={(e) => setArrivalAt(e.target.value)}
              />
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setArrivalAt(nowLocalInputValue())}
              >
                Ahora
              </button>
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="burn-at">
              Hora en que se quemó el paciente
            </label>
            <input
              id="burn-at"
              className="input"
              type="datetime-local"
              value={burnAt}
              onChange={(e) => setBurnAt(e.target.value)}
            />
            <div className="chip-row" role="group" aria-label="Atajos: tiempo antes de la llegada">
              <span className="chip-row__label">Hace, antes de la llegada:</span>
              {PRESETS_MINUTES.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className="chip"
                  disabled={!arrivalAt}
                  onClick={() => setBurnAt(minusMinutes(arrivalAt, minutes))}
                >
                  {presetLabel(minutes)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <ElapsedSummary elapsedHours={elapsedHours} />
    </div>
  );
}

function ElapsedSummary({ elapsedHours }: { elapsedHours: number | null }) {
  if (elapsedHours === null) {
    return (
      <Callout tone="info" title="Falta una hora">
        Ingresa la hora de la quemadura y la de llegada para ajustar la velocidad de infusión.
      </Callout>
    );
  }
  if (elapsedHours < 0) {
    return (
      <Callout tone="danger" title="Las horas no concuerdan">
        La hora de llegada es anterior a la hora de la quemadura. Revisa ambas.
      </Callout>
    );
  }
  if (elapsedHours >= TOTAL_RESUSCITATION_HOURS) {
    return (
      <Callout tone="danger" title={`Han pasado ${formatHours(elapsedHours)} desde la quemadura`}>
        Ya pasaron {TOTAL_RESUSCITATION_HOURS} h o más: está fuera del esquema del protocolo y
        requiere valoración médica.
      </Callout>
    );
  }
  if (elapsedHours >= FIRST_BLOCK_HOURS) {
    return (
      <Callout tone="warning" title={`Han pasado ${formatHours(elapsedHours)} desde la quemadura`}>
        Ya pasaron las primeras {FIRST_BLOCK_HOURS} h. El 100 % del volumen se administra en las{' '}
        {formatHours(TOTAL_RESUSCITATION_HOURS - elapsedHours)} que quedan hasta completar las{' '}
        {TOTAL_RESUSCITATION_HOURS} h.
      </Callout>
    );
  }
  return (
    <Callout tone="success" title={`Han pasado ${formatHours(elapsedHours)} desde la quemadura`}>
      {elapsedHours === 0
        ? 'El primer 50 % del volumen se administra en las primeras 8 h.'
        : `El primer 50 % del volumen se administra en las ${formatHours(
            FIRST_BLOCK_HOURS - elapsedHours,
          )} que quedan del primer bloque de ${FIRST_BLOCK_HOURS} h.`}
    </Callout>
  );
}

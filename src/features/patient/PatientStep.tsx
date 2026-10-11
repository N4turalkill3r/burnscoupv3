import { useAppStore } from '@/app/store';
import { isValidWeight, MAX_WEIGHT_KG, useAssessment } from '@/app/useAssessment';
import { BODY_MODEL_LABEL, BODY_MODELS, isValidAge } from '@/features/burn-calculation/age';
import { Callout } from '@/shared/components/Callout';
import { Card } from '@/shared/components/Card';
import { NumberField } from '@/shared/components/NumberField';
import { Segmented } from '@/shared/components/Segmented';
import { BURN_TYPE_OPTIONS, CHEMICAL_AGENT_OPTIONS, PATIENT_TYPE_OPTIONS } from './labels';

export function PatientStep() {
  const patientType = useAppStore((s) => s.patientType);
  const age = useAppStore((s) => s.age);
  const weightKg = useAppStore((s) => s.weightKg);
  const burnType = useAppStore((s) => s.burnType);
  const chemicalAgent = useAppStore((s) => s.chemicalAgent);
  const modelOverride = useAppStore((s) => s.modelOverride);
  const patientLabel = useAppStore((s) => s.patientLabel);
  const setPatientLabel = useAppStore((s) => s.setPatientLabel);
  const setPatientType = useAppStore((s) => s.setPatientType);
  const setAge = useAppStore((s) => s.setAge);
  const setWeightKg = useAppStore((s) => s.setWeightKg);
  const setBurnType = useAppStore((s) => s.setBurnType);
  const setChemicalAgent = useAppStore((s) => s.setChemicalAgent);
  const setModelOverride = useAppStore((s) => s.setModelOverride);
  const { resolution } = useAssessment();

  const weightError =
    weightKg !== null && !isValidWeight(weightKg)
      ? `El peso debe estar entre 0 y ${MAX_WEIGHT_KG} kg.`
      : null;

  return (
    <div className="stack">
      <Card title="Datos del paciente">
        <div className="stack">
          <div className="field">
            <label className="field__label" htmlFor="patient-label">
              Nombre o identificador (opcional)
            </label>
            <div className="field__control">
              <input
                id="patient-label"
                type="text"
                value={patientLabel}
                maxLength={120}
                autoComplete="off"
                placeholder="Ej.: Paciente 3, o iniciales"
                onChange={(e) => setPatientLabel(e.target.value)}
              />
            </div>
            <p className="field__hint">Sirve para encontrarlo en el historial.</p>
          </div>
          <Segmented
            legend="Tipo de paciente"
            name="patient-type"
            value={patientType}
            options={PATIENT_TYPE_OPTIONS}
            onChange={setPatientType}
          />
          <div className="grid-2">
            <NumberField
              label="Edad"
              unit="años"
              integer
              value={age}
              onChange={setAge}
              hint="Años cumplidos. Escribe 0 si es menor de 1 año."
              error={
                age !== null && !isValidAge(age) ? 'Escribe una edad entre 0 y 120 años.' : null
              }
            />
            <NumberField
              label="Peso"
              unit="kg"
              value={weightKg}
              onChange={setWeightKg}
              hint="Peso actual o estimado."
              error={weightError}
            />
          </div>
        </div>
      </Card>

      <Card
        title="Tipo de quemadura"
        description="Define la constante de reanimación que propone la app."
      >
        <div className="stack">
          <Segmented
            legend="Mecanismo"
            name="burn-type"
            value={burnType}
            options={BURN_TYPE_OPTIONS}
            onChange={setBurnType}
          />
          {burnType === 'chemical' && (
            <Segmented
              legend="Agente químico"
              name="chemical-agent"
              value={chemicalAgent}
              options={CHEMICAL_AGENT_OPTIONS}
              onChange={setChemicalAgent}
            />
          )}
        </div>
      </Card>

      <Card
        title="Modelo corporal"
        description="El modelo 3D y la tabla de superficie dependen de la edad del paciente."
      >
        {resolution.status === 'ok' ? (
          <p className="model-current">
            <strong>{BODY_MODEL_LABEL[resolution.model]}</strong>
            {resolution.source === 'override' ? ' (elegido manualmente)' : ' (según la edad)'}
          </p>
        ) : (
          <Callout tone="warning" title="Elige el modelo corporal">
            {resolution.reason}
          </Callout>
        )}

        <div className="model-picker" role="group" aria-label="Modelos corporales disponibles">
          {BODY_MODELS.map((model) => (
            <button
              key={model}
              type="button"
              className={`chip ${
                resolution.status === 'ok' && resolution.model === model ? 'is-selected' : ''
              }`.trim()}
              aria-pressed={resolution.status === 'ok' && resolution.model === model}
              onClick={() => setModelOverride(model)}
            >
              {BODY_MODEL_LABEL[model]}
            </button>
          ))}
        </div>
        {modelOverride && (
          <button type="button" className="link-button" onClick={() => setModelOverride(null)}>
            Volver al modelo que corresponde a la edad
          </button>
        )}
        {modelOverride && age !== null && isValidAge(age) && (
          <Callout tone="info">
            Las dosis, umbrales y metas siguen usando la edad real ({age} años). Sólo cambian el
            modelo 3D y la tabla de superficie.
          </Callout>
        )}
      </Card>
    </div>
  );
}

import { useAppStore } from '@/app/store';
import { useAssessment } from '@/app/useAssessment';
import { FINDING_GROUP_LABEL, FINDINGS, type FindingGroupId } from '@/data/findings';
import { Callout } from '@/shared/components/Callout';
import { Card } from '@/shared/components/Card';

const GROUP_ORDER: readonly FindingGroupId[] = [
  'airway',
  'pediatric_airway',
  'circulation',
  'context',
  'special_areas',
];

/** Hallazgos clínicos que activan recomendaciones y criterios de derivación del protocolo. */
export function FindingsStep() {
  const findings = useAppStore((s) => s.findings);
  const burnType = useAppStore((s) => s.burnType);
  const setFinding = useAppStore((s) => s.setFinding);
  const { assessment } = useAssessment();

  const isPediatric = assessment?.isPediatric ?? false;
  const auto = assessment?.autoSpecialAreas;

  return (
    <div className="stack">
      <Callout tone="info" title="Marca sólo lo que observes">
        Estos datos no cambian el cálculo de líquidos: activan las recomendaciones y los criterios
        de derivación del protocolo.
      </Callout>

      {GROUP_ORDER.map((group) => {
        const items = FINDINGS.filter(
          (f) =>
            f.group === group &&
            (!f.pediatricOnly || isPediatric) &&
            (!f.electricOnly || burnType === 'electric_high_voltage'),
        );
        if (items.length === 0) return null;
        return (
          <Card key={group} title={FINDING_GROUP_LABEL[group]}>
            <ul className="check-list">
              {items.map((item) => {
                const autoDetected =
                  (item.id === 'face_involved' && auto?.head) ||
                  (item.id === 'hands_involved' && auto?.hands) ||
                  (item.id === 'feet_involved' && auto?.feet) ||
                  (item.id === 'genitals_involved' && auto?.genitals);
                return (
                  <li key={item.id}>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={Boolean(findings[item.id]) || Boolean(autoDetected)}
                        disabled={Boolean(autoDetected)}
                        onChange={(e) => setFinding(item.id, e.target.checked)}
                      />
                      <span>
                        {item.label}
                        {autoDetected && <small> · detectado en las zonas pintadas</small>}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

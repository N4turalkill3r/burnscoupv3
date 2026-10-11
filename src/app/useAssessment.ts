import { useMemo } from 'react';
import {
  computeAssessmentView,
  type AssessmentView,
} from '@/features/burn-calculation/assessmentView';
import { useAppStore } from './store';

export { isValidWeight, MAX_WEIGHT_KG } from '@/features/burn-calculation/assessmentView';
export type { AssessmentView } from '@/features/burn-calculation/assessmentView';

/** Une el estado de la app con los cálculos clínicos (que son funciones puras). */
export function useAssessment(): AssessmentView {
  const patientType = useAppStore((s) => s.patientType);
  const age = useAppStore((s) => s.age);
  const weightKg = useAppStore((s) => s.weightKg);
  const burnType = useAppStore((s) => s.burnType);
  const chemicalAgent = useAppStore((s) => s.chemicalAgent);
  const modelOverride = useAppStore((s) => s.modelOverride);
  const burnAt = useAppStore((s) => s.burnAt);
  const arrivalAt = useAppStore((s) => s.arrivalAt);
  const method = useAppStore((s) => s.method);
  const burns = useAppStore((s) => s.burnsByMethod[s.method]);
  const findings = useAppStore((s) => s.findings);
  const doseConstantOverride = useAppStore((s) => s.doseConstantOverride);

  return useMemo(
    () =>
      computeAssessmentView({
        patientType,
        age,
        weightKg,
        burnType,
        chemicalAgent,
        modelOverride,
        burnAt,
        arrivalAt,
        method,
        burns,
        findings,
        doseConstantOverride,
      }),
    [
      patientType,
      age,
      weightKg,
      burnType,
      chemicalAgent,
      modelOverride,
      burnAt,
      arrivalAt,
      method,
      burns,
      findings,
      doseConstantOverride,
    ],
  );
}

import type { Findings } from '@/data/findings';
import type { BurnType } from '@/shared/types/clinical';

export interface DerivationContext {
  burnType: BurnType;
  isPediatric: boolean;
  /** SCQ de 2.º grado (superficial + profundo), en %. */
  secondDegreePercent: number;
  /** Hay alguna zona con quemadura de 3.er grado. */
  hasThirdDegree: boolean;
  findings: Findings;
  /** Áreas especiales detectadas automáticamente en las zonas pintadas (2.º o 3.er grado). */
  autoSpecialAreas: { head: boolean; hands: boolean; feet: boolean; genitals: boolean };
}

export interface DerivationCriterion {
  id: number;
  text: string;
  detail?: string;
}

/**
 * Criterios absolutos de transferencia a Unidad de Cuidados Críticos de Quemados (cap. 6.2).
 * Devuelve los criterios que se cumplen con los datos ingresados.
 */
export function evaluateDerivationCriteria(ctx: DerivationContext): DerivationCriterion[] {
  const f = ctx.findings;
  const met: DerivationCriterion[] = [];

  if (ctx.secondDegreePercent > 10) {
    met.push({
      id: 1,
      text: 'Quemaduras de segundo grado (espesor parcial) que superan el 10 % de la SCQ.',
      detail: `2.º grado: ${ctx.secondDegreePercent.toFixed(1)} % SCQ.`,
    });
  }

  const specialAreas: string[] = [];
  if (f.face_involved) specialAreas.push('cara');
  if (f.hands_involved || ctx.autoSpecialAreas.hands) specialAreas.push('manos');
  if (f.feet_involved || ctx.autoSpecialAreas.feet) specialAreas.push('pies');
  if (f.genitals_involved || ctx.autoSpecialAreas.genitals) specialAreas.push('genitales/periné');
  if (f.major_joints_involved) specialAreas.push('articulaciones mayores');
  if (specialAreas.length > 0) {
    met.push({
      id: 2,
      text: 'Quemaduras que afectan áreas especiales: cara, manos, pies, genitales, periné y articulaciones mayores.',
      detail: `Afectadas: ${specialAreas.join(', ')}.`,
    });
  }

  if (ctx.hasThirdDegree) {
    met.push({
      id: 3,
      text: 'Quemaduras de tercer grado en cualquier porcentaje de extensión y edad.',
    });
  }

  if (ctx.burnType === 'electric_high_voltage' || f.low_voltage_or_lightning) {
    met.push({
      id: 4,
      text: 'Injuria eléctrica (alta o baja tensión) o lesiones por impacto de rayo.',
    });
  }

  if (ctx.burnType === 'chemical') {
    met.push({ id: 5, text: 'Injuria química por ácidos o álcalis potentes.' });
  }

  if (f.inhalation_signs || f.stridor_dysphonia || f.pharyngeal_edema || f.ped_hoarseness_stridor) {
    met.push({
      id: 6,
      text: 'Lesión demostrada o fuerte sospecha de lesión por inhalación de humo.',
    });
  }

  if (f.comorbidities) {
    met.push({
      id: 7,
      text: 'Paciente quemado con comorbilidades de impacto sistémico (diabetes, IRC, cardiopatías).',
    });
  }

  if (f.severe_trauma) {
    met.push({
      id: 8,
      text: 'Quemaduras asociadas a trauma concomitante severo donde la quemadura sea la lesión de mayor riesgo vital.',
      detail:
        'Si el trauma asociado pone en riesgo inmediato la vida, se estabiliza primero en la sala de choque/trauma general antes de la transferencia.',
    });
  }

  if (ctx.isPediatric && f.no_pediatric_resources) {
    met.push({
      id: 9,
      text: 'Población pediátrica quemada si el centro de origen carece de recursos calificados.',
    });
  }

  if (
    f.limb_circumferential ||
    f.chest_circumferential_full_thickness ||
    f.neck_circumferential_deep
  ) {
    met.push({
      id: 10,
      text: 'Quemaduras de carácter circunferencial en extremidades, tórax o cuello (riesgo de compromiso vascular y respiratorio).',
    });
  }

  return met;
}

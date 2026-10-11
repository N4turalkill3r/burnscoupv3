import type { Findings, FindingId } from '@/data/findings';
import { FINDINGS } from '@/data/findings';
import type { DerivationCriterion } from '@/features/recommendations/derivation';
import type { BurnType, ChemicalAgent } from '@/shared/types/clinical';

/**
 * Reglas de recomendación basadas en el protocolo SEM (ABLS 2023).
 * Para agregar o modificar una recomendación basta con editar este archivo.
 */

export type RecommendationCategory =
  | 'airway'
  | 'breathing'
  | 'circulation'
  | 'disability'
  | 'exposure'
  | 'fluids'
  | 'pediatric'
  | 'electrical'
  | 'chemical'
  | 'inhalation'
  | 'transfer'
  | 'monitoring';

export type RecommendationSeverity = 'critical' | 'important' | 'info';

export const RECOMMENDATION_CATEGORY_LABEL: Record<RecommendationCategory, string> = {
  airway: 'A — Vía aérea',
  breathing: 'B — Ventilación',
  circulation: 'C — Circulación',
  disability: 'D — Neurológico',
  exposure: 'E — Exposición y ambiente',
  fluids: 'Fluidoterapia y diuresis',
  pediatric: 'Paciente pediátrico',
  electrical: 'Quemadura eléctrica',
  chemical: 'Quemadura química',
  inhalation: 'Inhalación de humo y gases',
  transfer: 'Traslado y derivación',
  monitoring: 'Registro durante el transporte',
};

export interface RecommendationContext {
  age: number;
  weightKg: number;
  isPediatric: boolean;
  burnType: BurnType;
  chemicalAgent: ChemicalAgent | null;
  findings: Findings;
  /** SCQ de fluidoterapia (2.º + 3.er grado), %. */
  scqTotal: number;
  scqThresholdPercent: number;
  scqThresholdLabel: string;
  thresholdExceeded: boolean;
  /** Criterios de derivación cumplidos. */
  derivation: DerivationCriterion[];
}

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  severity: RecommendationSeverity;
  title: string;
  details: string[];
  source: string;
}

export interface RecommendationRule {
  id: string;
  category: RecommendationCategory;
  severity: RecommendationSeverity;
  title: string;
  details: string[] | ((ctx: RecommendationContext) => string[]);
  /** Capítulo del protocolo de donde proviene. */
  source: string;
  appliesWhen: (ctx: RecommendationContext) => boolean;
}

const labelOf = (id: FindingId) => FINDINGS.find((f) => f.id === id)?.label ?? id;
const anyFinding = (ctx: RecommendationContext, ids: FindingId[]) =>
  ids.some((id) => ctx.findings[id]);

const ADULT_AIRWAY: FindingId[] = [
  'stridor_dysphonia',
  'respiratory_distress',
  'neck_circumferential_deep',
  'pharyngeal_edema',
  'gcs_le_8',
];
const PEDIATRIC_AIRWAY: FindingId[] = [
  'ped_hoarseness_stridor',
  'ped_abnormal_respiratory_rate',
  'ped_sternal_retraction',
];

export const recommendationRules: readonly RecommendationRule[] = [
  // ---------------------------------------------------------------- A: vía aérea
  {
    id: 'airway-intubation',
    category: 'airway',
    severity: 'critical',
    title: 'Intubación endotraqueal temprana',
    source: 'Cap. 2 A.3 y cap. 4.5',
    appliesWhen: (c) =>
      anyFinding(c, ADULT_AIRWAY) || (c.isPediatric && anyFinding(c, PEDIATRIC_AIRWAY)),
    details: (c) => {
      const triggers = [...ADULT_AIRWAY, ...(c.isPediatric ? PEDIATRIC_AIRWAY : [])]
        .filter((id) => c.findings[id])
        .map(labelOf);
      const out = [
        'Asegurar la vía aérea mediante secuencia de intubación rápida antes de que el edema la ocluya por completo.',
        `Criterio(s) presente(s): ${triggers.join('; ')}.`,
      ];
      if (c.isPediatric) {
        out.push(
          'Pediatría: usar tubos con neumotaponamiento (cuff) de baja presión si están disponibles y monitorizar la presión del manguito (la zona subglótica es la más estrecha).',
        );
      }
      out.push(
        'Si no es posible intubar, el protocolo describe la cricotiroidotomía quirúrgica (cap. 2, A.4).',
      );
      return out;
    },
  },
  {
    id: 'airway-assess',
    category: 'airway',
    severity: 'info',
    title: 'Evaluar la permeabilidad de la vía aérea',
    source: 'Cap. 2 A.1',
    appliesWhen: () => true,
    details: [
      'Buscar signos de compromiso obstructivo: esputo carbonáceo, vibrisas nasales quemadas, hollín en orofaringe, eritema o edema de la úvula y de la mucosa oral.',
    ],
  },
  {
    id: 'airway-cervical',
    category: 'airway',
    severity: 'critical',
    title: 'Inmovilización cervical estricta',
    source: 'Cap. 2 A.2',
    appliesWhen: (c) => Boolean(c.findings.trauma_mechanism),
    details: [
      'Aplicar inmovilización cervical: el mecanismo incluye trauma asociado (explosión, colisión, caída) o lesión eléctrica de alto voltaje con pérdida de conciencia.',
    ],
  },
  // ---------------------------------------------------------------- B: ventilación
  {
    id: 'breathing-oxygen',
    category: 'breathing',
    severity: 'important',
    title: 'Oxígeno al 100 % con máscara de no reinhalación',
    source: 'Cap. 2 B.2',
    appliesWhen: () => true,
    details: [
      'Administrar oxígeno de alto flujo a 15 L/min al 100 % con máscara de no reinhalación con reservorio a todo paciente con quemaduras graves o sospecha de inhalación.',
      'Evaluar inspección, palpación (enfisema subcutáneo), percusión y auscultación (sibilancias o crépitos).',
    ],
  },
  {
    id: 'breathing-escharotomy',
    category: 'breathing',
    severity: 'critical',
    title: 'Tórax restrictivo: coordinar escarotomía torácica',
    source: 'Cap. 2 B.2',
    appliesWhen: (c) => Boolean(c.findings.chest_circumferential_full_thickness),
    details: [
      'Coordinar de inmediato la escarotomía torácica de urgencia en el centro receptor (quemadura circunferencial de espesor total que limita la ventilación).',
    ],
  },
  // ---------------------------------------------------------------- C: circulación
  {
    id: 'circulation-access',
    category: 'circulation',
    severity: 'important',
    title: 'Accesos vasculares y Ringer Lactato',
    source: 'Cap. 2 C.2 y C.3',
    appliesWhen: () => true,
    details: [
      'Instalar de inmediato dos vías intravenosas de gran calibre (≥ 16G), de preferencia en piel no quemada.',
      'Si la cateterización periférica falla tras dos intentos, colocar un acceso intraóseo (humeral o tibial).',
      'Cristaloide de elección: Ringer Lactato.',
    ],
  },
  {
    id: 'circulation-hemodynamics',
    category: 'circulation',
    severity: 'info',
    title: 'Evaluación hemodinámica',
    source: 'Cap. 2 C.1',
    appliesWhen: () => true,
    details: [
      'Evaluar pulsos distales, llenado capilar, presión arterial y frecuencia cardíaca.',
      'Taquicardia de 100–120 lpm es la respuesta esperada al SIRS; frecuencias mayores obligan a descartar hipovolemia oculta por trauma, dolor severo o hipoxia. Menos de 100 lpm indica bradicardia relativa y disfunción miocárdica.',
    ],
  },
  {
    id: 'circulation-limb',
    category: 'circulation',
    severity: 'important',
    title: 'Quemadura circunferencial en extremidades',
    source: 'Cap. 7.3 y cap. 6.2',
    appliesWhen: (c) => Boolean(c.findings.limb_circumferential),
    details: [
      'Evaluar manualmente los pulsos distales de forma obligatoria para descartar síndrome compartimental o compromiso isquémico, y registrar el llenado capilar.',
    ],
  },
  // ---------------------------------------------------------------- D: neurológico
  {
    id: 'disability-assess',
    category: 'disability',
    severity: 'info',
    title: 'Estado neurológico',
    source: 'Cap. 2 D',
    appliesWhen: () => true,
    details: [
      'Determinar el estado de alerta con la escala de coma de Glasgow y la reactividad pupilar.',
    ],
  },
  {
    id: 'disability-differential',
    category: 'disability',
    severity: 'critical',
    title: 'Alteración neurológica aguda: diagnóstico diferencial obligatorio',
    source: 'Cap. 2 D',
    appliesWhen: (c) => Boolean(c.findings.gcs_le_8),
    details: [
      'Descartar de inmediato: hipoxia severa, choque profundo, trauma craneoencefálico concomitante e intoxicación sistémica por monóxido de carbono (CO) o cianuro (HCN) si el evento ocurrió en un espacio cerrado.',
    ],
  },
  // ---------------------------------------------------------------- E: exposición
  {
    id: 'exposure-control',
    category: 'exposure',
    severity: 'important',
    title: 'Detener la quemadura y prevenir la hipotermia',
    source: 'Cap. 2 E.1 y E.2',
    appliesWhen: () => true,
    details: [
      'Retirar al paciente de la fuente de calor. Cortar y retirar la ropa removible, dejando la ropa adherida a la piel.',
      'Remover de inmediato anillos, pulseras, relojes y cinturones (efecto torniquete por el edema).',
      'Cubrir con sábanas limpias y secas y mantener la cabina de la ambulancia climatizada a un ambiente cálido. Mantener temperatura central > 36,0 °C.',
    ],
  },
  {
    id: 'exposure-prohibitions',
    category: 'exposure',
    severity: 'critical',
    title: 'Prohibiciones estrictas',
    source: 'Cap. 2 E.3 y cap. 6.1',
    appliesWhen: () => true,
    details: [
      'NO aplicar agua fría, hielo ni compresas húmedas sobre quemaduras extensas (profundiza la estasis y precipita hipotermia grave con coagulopatía).',
      'NO aplicar cremas, ungüentos, antibióticos tópicos (como sulfadiazina de plata) ni soluciones colorantes en la fase prehospitalaria.',
      'Cubrir las quemaduras exclusivamente con sábanas limpias, secas y estériles.',
    ],
  },
  // ---------------------------------------------------------------- Fluidoterapia
  {
    id: 'fluids-massive',
    category: 'fluids',
    severity: 'critical',
    title: 'Activar el protocolo de reanimación hídrica masiva (SIRS)',
    source: 'Cap. 1.3',
    appliesWhen: (c) => c.thresholdExceeded,
    details: (c) => [
      `La SCQ (${c.scqTotal.toFixed(1)} %) supera el umbral de ${c.scqThresholdPercent} % para el grupo "${c.scqThresholdLabel}".`,
    ],
  },
  {
    id: 'fluids-below-threshold',
    category: 'fluids',
    severity: 'info',
    title: 'SCQ por debajo del umbral de reanimación masiva',
    source: 'Cap. 1.3',
    appliesWhen: (c) => c.scqTotal > 0 && !c.thresholdExceeded,
    details: (c) => [
      `La SCQ (${c.scqTotal.toFixed(1)} %) no supera el umbral de ${c.scqThresholdPercent} % del grupo "${c.scqThresholdLabel}". Valorar clínicamente la necesidad de fluidoterapia.`,
    ],
  },
  {
    id: 'fluids-titration',
    category: 'fluids',
    severity: 'important',
    title: 'Titular por diuresis horaria',
    source: 'Cap. 3.2',
    appliesWhen: () => true,
    details: [
      'La diuresis horaria es el estándar de oro: instalar sonda vesical (Foley) para un conteo exacto y titular la infusión hora por hora.',
      'Si la diuresis cae por debajo de la meta en una hora, aumentar la velocidad del Ringer Lactato 20–25 %. Si sobrepasa significativamente la meta, disminuirla para evitar edema pulmonar o síndrome compartimental.',
    ],
  },
  // ---------------------------------------------------------------- Pediatría
  {
    id: 'pediatric-metabolic',
    category: 'pediatric',
    severity: 'important',
    title: 'Control metabólico y térmico pediátrico',
    source: 'Cap. 4.1 y 4.4',
    appliesWhen: (c) => c.isPediatric,
    details: [
      'Hemoglucotest cada hora durante el traslado prehospitalario largo o el manejo hospitalario temprano. Si la glucemia desciende de 70 mg/dL, ajustar el aporte de dextrosa.',
      'Medir la temperatura axilar cada 5–15 minutos. Ante valores por debajo de 36,0 °C, activar calentamiento externo (manta térmica, calentar la cabina).',
      'Mantenimiento basal obligatorio simultáneo con la reanimación (dextrosa 5 % en Ringer Lactato o SS 0,45 %, regla de Holliday-Segar).',
    ],
  },
  // ---------------------------------------------------------------- Eléctrica
  {
    id: 'electrical-ekg',
    category: 'electrical',
    severity: 'critical',
    title: 'Monitoreo EKG continuo',
    source: 'Cap. 5.2',
    appliesWhen: (c) =>
      c.burnType === 'electric_high_voltage' || Boolean(c.findings.low_voltage_or_lightning),
    details: [
      'Confirmar la desenergización de la fuente por las autoridades competentes antes de ingresar al perímetro.',
      'Monitoreo EKG continuo durante todo el transporte: riesgo de arritmias malignas letales (FV, TV, asistolia) y bloqueos cardíacos.',
    ],
  },
  {
    id: 'electrical-myoglobinuria',
    category: 'electrical',
    severity: 'critical',
    title: 'Prevención de necrosis tubular aguda (mioglobinuria)',
    source: 'Cap. 3.2 y 5.2',
    appliesWhen: (c) =>
      c.burnType === 'electric_high_voltage' && Boolean(c.findings.pigmented_urine),
    details: [
      'Orina macroscópicamente oscura: incrementar la fluidoterapia con la constante de 4 ml para mantener la diuresis en 1,0–1,5 ml/kg/h en adultos (1,5–2,0 ml/kg/h en niños) hasta que la orina aclare.',
    ],
  },
  // ---------------------------------------------------------------- Química
  {
    id: 'chemical-general',
    category: 'chemical',
    severity: 'critical',
    title: 'Quemadura química',
    source: 'Cap. 5.1',
    appliesWhen: (c) => c.burnType === 'chemical',
    details: (c) => {
      const out = [
        'Seguridad personal: no tocar al paciente sin guantes de nitrilo y trajes de protección si el agente está activo.',
      ];
      const agent: ChemicalAgent | null = c.chemicalAgent;
      if (agent === 'dry_powder') {
        out.push(
          'Polvo seco (p. ej. cal viva): cepillar y retirar mecánicamente de la piel de forma enérgica ANTES de aplicar agua (el agua sobre polvo seco genera reacción exotérmica). Luego irrigar.',
        );
      }
      if (agent === 'acid')
        out.push(
          'Ácidos: irrigación continua con agua limpia o solución salina a baja presión durante 20–30 minutos.',
        );
      if (agent === 'alkali')
        out.push(
          'Álcalis (bases): irrigación continua con agua limpia o solución salina a baja presión durante un mínimo de 60 minutos (necrosis por licuefacción).',
        );
      if (agent === 'unknown_liquid' || agent === null) {
        out.push(
          'Químico líquido: irrigar de inmediato con abundante agua limpia o solución salina a baja presión: 20–30 minutos para ácidos; mínimo 60 minutos para álcalis.',
        );
      }
      out.push(
        'Afectación ocular: irrigar el ojo de forma continua con solución salina mediante un equipo de venoclisis abierto durante todo el traslado y retirar lentes de contacto.',
        'PROHIBIDO aplicar agentes neutralizantes (vinagre, bicarbonato) sobre la piel: generan calor y daño térmico secundario.',
      );
      return out;
    },
  },
  // ---------------------------------------------------------------- Inhalación
  {
    id: 'inhalation-co',
    category: 'inhalation',
    severity: 'critical',
    title: 'Sospecha de lesión por inhalación / intoxicación por CO',
    source: 'Cap. 5.3',
    appliesWhen: (c) => anyFinding(c, ['inhalation_signs', 'enclosed_space']),
    details: [
      'Administrar oxígeno al 100 % con reservorio de forma mandatoria (reduce la vida media del CO de 4 horas a 40 minutos).',
      'El pulsioxímetro estándar NO diferencia la carboxihemoglobina de la oxihemoglobina: puede mostrar lecturas falsas de 98–100 %.',
    ],
  },
  {
    id: 'inhalation-cyanide',
    category: 'inhalation',
    severity: 'critical',
    title: 'Sospecha de intoxicación por cianuro (HCN)',
    source: 'Cap. 5.3',
    appliesWhen: (c) => Boolean(c.findings.cardiovascular_collapse),
    details: [
      'Colapso cardiovascular inexplicado o acidosis láctica refractaria en paciente rescatado de espacio cerrado con combustión de plásticos o espumas: administrar soporte ventilatorio y hemodinámico avanzado de inmediato.',
    ],
  },
  // ---------------------------------------------------------------- Traslado
  {
    id: 'transfer-criteria',
    category: 'transfer',
    severity: 'critical',
    title: 'Derivar a Unidad de Cuidados Críticos de Quemados',
    source: 'Cap. 6.2',
    appliesWhen: (c) => c.derivation.length > 0,
    details: (c) => [
      'Coordinar a través del CCSEM el traslado directo a un centro con Unidad de Cuidados Críticos de Quemados. Criterios cumplidos:',
      ...c.derivation.map((d) => `${d.id}. ${d.text}${d.detail ? ` ${d.detail}` : ''}`),
    ],
  },
  {
    id: 'transfer-none',
    category: 'transfer',
    severity: 'info',
    title: 'Criterios de derivación',
    source: 'Cap. 6.2',
    appliesWhen: (c) => c.derivation.length === 0,
    details: [
      'Con los datos ingresados no se cumple ningún criterio absoluto de derivación a Unidad de Quemados. Revisar los hallazgos marcados y las zonas pintadas.',
    ],
  },
  // ---------------------------------------------------------------- Monitoreo
  {
    id: 'monitoring-record',
    category: 'monitoring',
    severity: 'info',
    title: 'Registro durante el transporte',
    source: 'Cap. 7',
    appliesWhen: () => true,
    details: [
      'Documentar de forma obligatoria cada 15 minutos (cada 5 minutos en pacientes críticos): reevaluación ABCDE, PA y PAM, FC (100–120 lpm esperado), FR, temperatura central (> 36,0 °C), trazado ECG, pulsos distales, llenado capilar, volumen total infundido, velocidad de infusión (ml/h) y diuresis horaria por sonda Foley.',
    ],
  },
];

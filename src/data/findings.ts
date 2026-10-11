/**
 * Hallazgos clínicos que el médico/paramédico marca y que activan recomendaciones del protocolo.
 * Fuente: cap. 2 (ABCDE), 4.5, 5 y 6.2 del protocolo.
 */
export type FindingId =
  // Vía aérea / inhalación
  | 'stridor_dysphonia'
  | 'respiratory_distress'
  | 'neck_circumferential_deep'
  | 'pharyngeal_edema'
  | 'gcs_le_8'
  | 'inhalation_signs'
  | 'enclosed_space'
  | 'cardiovascular_collapse'
  // Pediatría (vía aérea)
  | 'ped_hoarseness_stridor'
  | 'ped_abnormal_respiratory_rate'
  | 'ped_sternal_retraction'
  // Circulación / compartimental
  | 'chest_circumferential_full_thickness'
  | 'limb_circumferential'
  // Mecanismo y contexto
  | 'trauma_mechanism'
  | 'severe_trauma'
  | 'comorbidities'
  | 'low_voltage_or_lightning'
  | 'pigmented_urine'
  | 'no_pediatric_resources'
  // Áreas especiales
  | 'face_involved'
  | 'hands_involved'
  | 'feet_involved'
  | 'genitals_involved'
  | 'major_joints_involved';

export type FindingGroupId =
  'airway' | 'pediatric_airway' | 'circulation' | 'context' | 'special_areas';

export interface FindingDefinition {
  id: FindingId;
  group: FindingGroupId;
  label: string;
  /** Solo se muestra a pacientes pediátricos. */
  pediatricOnly?: boolean;
  /** Solo se muestra con quemadura eléctrica. */
  electricOnly?: boolean;
}

export const FINDING_GROUP_LABEL: Record<FindingGroupId, string> = {
  airway: 'A/B — Vía aérea e inhalación',
  pediatric_airway: 'Vía aérea pediátrica',
  circulation: 'C — Circulación y compartimental',
  context: 'Mecanismo y contexto',
  special_areas: 'Áreas especiales afectadas',
};

export const FINDINGS: readonly FindingDefinition[] = [
  {
    id: 'stridor_dysphonia',
    group: 'airway',
    label: 'Estridor laríngeo, sibilancias audibles a distancia o disfonía (voz ronca)',
  },
  {
    id: 'respiratory_distress',
    group: 'airway',
    label: 'Dificultad respiratoria manifiesta (taquipnea severa, tiraje intercostal)',
  },
  {
    id: 'neck_circumferential_deep',
    group: 'airway',
    label: 'Quemadura circunferencial profunda de cuello',
  },
  {
    id: 'pharyngeal_edema',
    group: 'airway',
    label: 'Edema faríngeo severo o ampollas visibles en la mucosa oral',
  },
  { id: 'gcs_le_8', group: 'airway', label: 'Alteración del estado neurológico: Glasgow ≤ 8' },
  {
    id: 'inhalation_signs',
    group: 'airway',
    label:
      'Esputo carbonáceo, vibrisas nasales quemadas, hollín en orofaringe o edema/eritema de úvula',
  },
  {
    id: 'enclosed_space',
    group: 'airway',
    label: 'Evento en espacio cerrado / confinamiento en incendio',
  },
  {
    id: 'cardiovascular_collapse',
    group: 'airway',
    label:
      'Colapso cardiovascular inexplicado o acidosis láctica refractaria (rescatado de espacio cerrado)',
  },
  {
    id: 'ped_hoarseness_stridor',
    group: 'pediatric_airway',
    pediatricOnly: true,
    label: 'Ronquera, llanto apagado o estridor inspiratorio',
  },
  {
    id: 'ped_abnormal_respiratory_rate',
    group: 'pediatric_airway',
    pediatricOnly: true,
    label:
      'Frecuencia respiratoria fuera de rango para su edad (taquipnea extrema, fatiga o apnea)',
  },
  {
    id: 'ped_sternal_retraction',
    group: 'pediatric_airway',
    pediatricOnly: true,
    label: 'Hundimiento esternal severo o disociación tóraco-abdominal',
  },
  {
    id: 'chest_circumferential_full_thickness',
    group: 'circulation',
    label: 'Quemadura circunferencial de espesor total en tórax (tórax restrictivo)',
  },
  {
    id: 'limb_circumferential',
    group: 'circulation',
    label: 'Quemadura circunferencial en extremidades',
  },
  {
    id: 'trauma_mechanism',
    group: 'context',
    label:
      'Mecanismo con trauma asociado (explosión, colisión, caída) o eléctrica de alto voltaje con pérdida de conciencia',
  },
  { id: 'severe_trauma', group: 'context', label: 'Trauma concomitante severo' },
  {
    id: 'comorbidities',
    group: 'context',
    label: 'Comorbilidad de impacto sistémico (diabetes, IRC, cardiopatía)',
  },
  {
    id: 'low_voltage_or_lightning',
    group: 'context',
    electricOnly: false,
    label: 'Injuria eléctrica de baja tensión o impacto de rayo',
  },
  {
    id: 'pigmented_urine',
    group: 'context',
    electricOnly: true,
    label: 'Orina oscura "en refresco de cola" (mioglobinuria)',
  },
  {
    id: 'no_pediatric_resources',
    group: 'context',
    pediatricOnly: true,
    label: 'Centro de origen sin recursos calificados para el niño quemado',
  },
  { id: 'face_involved', group: 'special_areas', label: 'Cara' },
  { id: 'hands_involved', group: 'special_areas', label: 'Manos' },
  { id: 'feet_involved', group: 'special_areas', label: 'Pies' },
  { id: 'genitals_involved', group: 'special_areas', label: 'Genitales / periné' },
  { id: 'major_joints_involved', group: 'special_areas', label: 'Articulaciones mayores' },
];

export type Findings = Partial<Record<FindingId, boolean>>;

import type { BurnType, ChemicalAgent, PatientType } from '@/shared/types/clinical';

export const PATIENT_TYPE_OPTIONS: readonly {
  value: PatientType;
  label: string;
  description: string;
}[] = [
  { value: 'adult', label: 'Adulto', description: '15 años o más' },
  { value: 'pediatric', label: 'Pediátrico', description: 'Hasta 14 años' },
];

export const BURN_TYPE_OPTIONS: readonly { value: BurnType; label: string; description: string }[] =
  [
    { value: 'thermal', label: 'Térmica', description: 'Fuego, líquidos, contacto' },
    { value: 'chemical', label: 'Química', description: 'Ácidos, álcalis, otros' },
    { value: 'electric_high_voltage', label: 'Eléctrica', description: 'Alto voltaje' },
  ];

export const CHEMICAL_AGENT_OPTIONS: readonly { value: ChemicalAgent; label: string }[] = [
  { value: 'dry_powder', label: 'Polvo seco' },
  { value: 'acid', label: 'Ácido' },
  { value: 'alkali', label: 'Álcali' },
  { value: 'unknown_liquid', label: 'Líquido no identificado' },
];

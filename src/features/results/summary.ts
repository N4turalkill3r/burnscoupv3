import type { Assessment } from '@/features/burn-calculation/assessment';
import type { DiuresisEntry } from '@/features/history/types';
import { formatMl, formatNumber, formatPercent } from '@/shared/utils/format';
import { formatHours } from '@/shared/utils/time';

export interface SummaryInput {
  patientLabel?: string;
  diuresisLog?: readonly DiuresisEntry[];
  age: number;
  weightKg: number;
  burnTypeLabel: string;
  modelLabel: string;
  methodLabel: string;
  assessment: Assessment;
}

export const DISCLAIMER =
  'Herramienta de apoyo. No sustituye el criterio médico ni el protocolo vigente.';

/** Resumen en texto plano para copiar al reporte de traspaso o al expediente. */
export function buildSummaryText(input: SummaryInput): string {
  const { assessment: a } = input;
  const lines: string[] = [];

  lines.push(
    `Paciente: ${input.patientLabel?.trim() ? `${input.patientLabel.trim()}, ` : ''}${input.age} años, ${formatNumber(input.weightKg, 1)} kg. Quemadura: ${input.burnTypeLabel}.`,
  );
  lines.push(
    `SCQ (2.º + 3.er grado): ${formatPercent(a.scq.total)} — 2.º ${formatPercent(a.scq.second)}, 3.º ${formatPercent(
      a.scq.third,
    )}; 1.er grado ${formatPercent(a.scq.first)} (no suma). Método: ${input.methodLabel}. Modelo: ${input.modelLabel}.`,
  );
  lines.push(
    `Umbral de SCQ: > ${a.threshold.percent} % (${a.threshold.label}) → ${a.threshold.exceeded ? 'lo supera' : 'no lo supera'}.`,
  );
  lines.push(
    `Constante: ${a.constant.value} ml/kg/%SCQ (${a.constant.isDefault ? 'del protocolo' : `editada; el protocolo propone ${a.constant.defaultValue}`}). Volumen de 24 h: ${formatMl(
      a.volume24hMl,
    )} de Ringer Lactato.`,
  );

  if (a.schedule) {
    lines.push(`Tiempo desde la quemadura: ${formatHours(a.schedule.elapsedHours)}.`);
    for (const block of a.schedule.blocks) {
      lines.push(
        `- ${block.label}: ${formatMl(block.volumeMl)} en ${formatHours(block.durationHours)} = ${formatNumber(
          block.rateMlPerHour,
          0,
        )} ml/h.`,
      );
    }
    for (const warning of a.schedule.warnings) lines.push(`Aviso: ${warning}`);
  }

  if (a.maintenance.applies) {
    lines.push(
      `Mantenimiento basal simultáneo: ${formatNumber(a.maintenance.mlPerHour, 0)} ml/h${
        a.maintenance.specialCriterion ? ' (criterio especial fuera de protocolo: 14 años)' : ''
      }.`,
    );
  }

  lines.push(
    `Diuresis esperada: ${a.diuresisTarget.description} (${formatNumber(a.diuresisTarget.minMlPerHour, 0)} ml/h o más).`,
  );
  if (input.diuresisLog && input.diuresisLog.length > 0) {
    const names = { red: 'rojo', green: 'verde', yellow: 'amarillo' } as const;
    lines.push('Diuresis registrada:');
    for (const e of input.diuresisLog) {
      const d = new Date(e.at);
      const time = Number.isNaN(d.getTime())
        ? ''
        : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} `;
      lines.push(
        `- ${time}${formatNumber(e.mlPerHour, 0)} ml/h (${formatNumber(e.mlPerKgH, 2)} ml/kg/h) · ${names[e.light]}`,
      );
    }
  }
  lines.push(
    a.derivation.length > 0
      ? `Derivación a unidad de quemados: cumple ${a.derivation.length} criterio(s): ${a.derivation
          .map((c) => c.text)
          .join(' | ')}`
      : 'Derivación a unidad de quemados: ningún criterio absoluto cumplido con los datos ingresados.',
  );
  lines.push(DISCLAIMER);
  return lines.join('\n');
}

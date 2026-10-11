import { useRef, useState } from 'react';
import { useAppStore } from '@/app/store';
import { BODY_MODEL_LABEL, resolveBodyModel } from '@/features/burn-calculation/age';
import { Callout } from '@/shared/components/Callout';
import { Card } from '@/shared/components/Card';
import { formatMl, formatPercent } from '@/shared/utils/format';
import { getHistoryRepository } from './repository';
import type { PatientRecord } from './types';

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('es-SV', { dateStyle: 'short', timeStyle: 'short' });
}

function title(record: PatientRecord): string {
  const { patientLabel, age, weightKg } = record.fields;
  const name = patientLabel.trim() || 'Paciente sin nombre';
  return `${name} · ${age ?? '?'} años · ${weightKg ?? '?'} kg`;
}

function modelOf(record: PatientRecord): string | null {
  const { patientType, age, modelOverride } = record.fields;
  const r = resolveBodyModel({ patientType, age, override: modelOverride });
  return r.status === 'ok' ? BODY_MODEL_LABEL[r.model] : null;
}

/** Lista de pacientes guardados: abrir, borrar, exportar e importar. */
export function HistoryView() {
  const repo = getHistoryRepository();
  const caseId = useAppStore((s) => s.caseId);
  const loadCase = useAppStore((s) => s.loadCase);
  const reset = useAppStore((s) => s.reset);
  const [records, setRecords] = useState<PatientRecord[]>(() => repo.list());
  const [message, setMessage] = useState<{ tone: 'info' | 'warning'; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = () => setRecords(repo.list());

  const open = (record: PatientRecord) => {
    loadCase(record.id, record.fields);
    window.scrollTo({ top: 0 });
  };

  const remove = (record: PatientRecord) => {
    if (!window.confirm(`¿Borrar «${title(record)}» del historial? No se puede deshacer.`)) return;
    repo.remove(record.id);
    // Si era el caso abierto, se sigue con uno nuevo para que no se vuelva a guardar solo.
    if (record.id === caseId) reset();
    useAppStore.getState().setView('history');
    refresh();
  };

  const clearAll = () => {
    if (!window.confirm('¿Borrar TODO el historial de este dispositivo? No se puede deshacer.')) {
      return;
    }
    repo.clear();
    reset();
    useAppStore.getState().setView('history');
    refresh();
  };

  const download = () => {
    const blob = new Blob([repo.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `burnscope-historial-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const result = repo.importJson(await file.text());
    if (result.error) {
      setMessage({ tone: 'warning', text: result.error });
    } else {
      setMessage({
        tone: 'info',
        text: `Importados: ${result.imported}. Omitidos (inválidos o ya existentes más recientes): ${result.skipped}.`,
      });
    }
    refresh();
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <div className="stack">
      <Card
        title="Historial de pacientes"
        description="Los casos se guardan solos en este dispositivo (sin conexión y sin enviarse a ningún servidor)."
      >
        <div className="stack">
          {!repo.isAvailable() && (
            <Callout tone="warning" title="No se puede guardar en este navegador">
              El almacenamiento está bloqueado (¿modo privado?). Los casos no se conservarán al
              cerrar la app.
            </Callout>
          )}
          {message && <Callout tone={message.tone}>{message.text}</Callout>}

          {records.length === 0 ? (
            <p className="muted">
              Aún no hay pacientes guardados. Un caso se guarda cuando tiene edad y peso válidos.
            </p>
          ) : (
            <ul className="history-list">
              {records.map((record) => {
                const s = record.summary;
                const model = modelOf(record);
                return (
                  <li
                    key={record.id}
                    className={`history-item ${record.id === caseId ? 'is-current' : ''}`.trim()}
                  >
                    <div className="history-item__main">
                      <p className="history-item__title">{title(record)}</p>
                      <p className="history-item__meta">
                        Actualizado {formatWhen(record.updatedAt)}
                        {model ? ` · ${model}` : ''}
                        {record.id === caseId ? ' · abierto ahora' : ''}
                      </p>
                      {s ? (
                        <p className="history-item__summary">
                          SCQ <strong>{formatPercent(s.scqTotal)}</strong> · 24 h{' '}
                          <strong>{formatMl(s.volume24hMl)}</strong>
                          {s.thresholdExceeded ? ' · supera el umbral' : ''}
                          {s.derivationCount > 0 ? ` · derivación (${s.derivationCount})` : ''}
                        </p>
                      ) : (
                        <p className="history-item__summary muted">
                          Sin cálculo (falta el modelo).
                        </p>
                      )}
                    </div>
                    <div className="history-item__actions">
                      <button type="button" className="btn" onClick={() => open(record)}>
                        Abrir
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        aria-label={`Borrar ${title(record)}`}
                        onClick={() => remove(record)}
                      >
                        Borrar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>

      <Card
        title="Copia de seguridad"
        description="Exporta el historial a un archivo para pasarlo a otro dispositivo o guardarlo."
      >
        <div className="history-tools">
          <button type="button" className="btn" onClick={download} disabled={records.length === 0}>
            Exportar (.json)
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => fileInput.current?.click()}
          >
            Importar
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={clearAll}
            disabled={records.length === 0}
          >
            Borrar todo
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            data-testid="import-file"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </div>
        <p className="muted history-note">
          Los datos de pacientes quedan en este dispositivo sin cifrar. Exporta y borra si el equipo
          es compartido.
        </p>
      </Card>
    </div>
  );
}

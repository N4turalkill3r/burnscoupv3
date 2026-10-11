import { useEffect, useState } from 'react';
import { useAppStore } from '@/app/store';
import { buildRecord, caseFieldsChanged, isSaveable, pickCaseFields } from './record';
import { getHistoryRepository } from './repository';
import type { CaseFields } from './types';

export type SaveStatus = 'idle' | 'saved' | 'unavailable';

const DEBOUNCE_MS = 600;

/**
 * Guarda el caso abierto en el historial cada vez que cambia (con una pequeña espera para
 * no escribir en cada tecla) y al cerrar o ocultar la app. No guarda hasta que haya edad
 * y peso válidos, ni si no cambió nada respecto a lo ya guardado.
 */
export function useAutosave(): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    const repo = getHistoryRepository();
    let timer: number | undefined;
    let last: CaseFields = pickCaseFields(useAppStore.getState());
    let lastId = useAppStore.getState().caseId;
    let dirty = false;

    const persist = (id: string, fields: CaseFields) => {
      if (!isSaveable(fields)) return;
      const record = buildRecord(id, fields, repo.get(id), new Date());
      if (!record) return;
      setStatus(repo.save(record) ? 'saved' : 'unavailable');
    };

    const flush = () => {
      window.clearTimeout(timer);
      timer = undefined;
      if (!dirty) return;
      dirty = false;
      persist(lastId, last);
    };

    const unsubscribe = useAppStore.subscribe((state) => {
      // Al cambiar de caso, lo pendiente del anterior se guarda antes de seguir.
      if (state.caseId !== lastId) {
        flush();
        lastId = state.caseId;
        last = pickCaseFields(state);
        setStatus('idle');
        return;
      }
      const fields = pickCaseFields(state);
      if (!caseFieldsChanged(last, fields)) return;
      last = fields;
      dirty = true;
      window.clearTimeout(timer);
      timer = window.setTimeout(flush, DEBOUNCE_MS);
    });

    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);

    return () => {
      flush();
      unsubscribe();
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
    };
  }, []);

  return status;
}

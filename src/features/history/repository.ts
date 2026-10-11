import { parsePatientRecord } from './sanitize';
import { RECORD_SCHEMA, type PatientRecord } from './types';

/**
 * Historial de pacientes. La interfaz `HistoryRepository` es lo único que usa el resto de la
 * app: para guardar en IndexedDB o en un servidor basta con escribir otra implementación.
 *
 * La implementación incluida guarda en localStorage, sólo en este dispositivo y sin cifrar.
 */

export const HISTORY_STORAGE_KEY = 'burnscope.history.v1';

/** Subconjunto de la API Storage que necesitamos (facilita las pruebas). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  /** Mensaje si el archivo no se pudo leer. */
  error?: string;
}

export interface HistoryRepository {
  /** false si el navegador no permite guardar (modo privado, almacenamiento bloqueado). */
  isAvailable(): boolean;
  /** Más recientes primero. */
  list(): PatientRecord[];
  get(id: string): PatientRecord | null;
  /** true si se guardó. */
  save(record: PatientRecord): boolean;
  remove(id: string): void;
  clear(): void;
  exportJson(now?: Date): string;
  importJson(text: string): ImportResult;
}

const byNewest = (a: PatientRecord, b: PatientRecord) => b.updatedAt.localeCompare(a.updatedAt);

export function createStorageRepository(
  storage: StorageLike | null,
  key: string = HISTORY_STORAGE_KEY,
): HistoryRepository {
  function readAll(): PatientRecord[] {
    if (!storage) return [];
    try {
      const raw = storage.getItem(key);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map(parsePatientRecord)
        .filter((r): r is PatientRecord => r !== null)
        .sort(byNewest);
    } catch {
      return [];
    }
  }

  function writeAll(records: PatientRecord[]): boolean {
    if (!storage) return false;
    try {
      storage.setItem(key, JSON.stringify(records));
      return true;
    } catch {
      return false; // cuota llena o almacenamiento bloqueado
    }
  }

  return {
    isAvailable() {
      if (!storage) return false;
      try {
        const probe = `${key}.probe`;
        storage.setItem(probe, '1');
        storage.removeItem(probe);
        return true;
      } catch {
        return false;
      }
    },

    list: readAll,

    get(id) {
      return readAll().find((r) => r.id === id) ?? null;
    },

    save(record) {
      const others = readAll().filter((r) => r.id !== record.id);
      return writeAll([record, ...others]);
    },

    remove(id) {
      writeAll(readAll().filter((r) => r.id !== id));
    },

    clear() {
      if (!storage) return;
      try {
        storage.removeItem(key);
      } catch {
        /* sin almacenamiento: nada que borrar */
      }
    },

    exportJson(now = new Date()) {
      return JSON.stringify(
        {
          app: 'BurnScope',
          schema: RECORD_SCHEMA,
          exportedAt: now.toISOString(),
          records: readAll(),
        },
        null,
        2,
      );
    },

    importJson(text) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return { imported: 0, skipped: 0, error: 'El archivo no es un JSON válido.' };
      }
      const list: unknown = Array.isArray(parsed)
        ? parsed
        : typeof parsed === 'object' && parsed !== null
          ? (parsed as { records?: unknown }).records
          : undefined;
      if (!Array.isArray(list)) {
        return {
          imported: 0,
          skipped: 0,
          error: 'El archivo no contiene un historial de BurnScope.',
        };
      }

      const current = new Map(readAll().map((r) => [r.id, r]));
      let imported = 0;
      let skipped = 0;
      for (const item of list) {
        const record = parsePatientRecord(item);
        if (!record) {
          skipped += 1;
          continue;
        }
        const existing = current.get(record.id);
        // Si ya existe, se conserva el más reciente.
        if (existing && existing.updatedAt >= record.updatedAt) {
          skipped += 1;
          continue;
        }
        current.set(record.id, record);
        imported += 1;
      }
      if (imported > 0 && !writeAll([...current.values()].sort(byNewest))) {
        return {
          imported: 0,
          skipped,
          error: 'No se pudo guardar: el almacenamiento está lleno o bloqueado.',
        };
      }
      return { imported, skipped };
    },
  };
}

function browserStorage(): StorageLike | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null; // el acceso puede lanzar error con cookies/almacenamiento bloqueados
  }
}

let shared: HistoryRepository | null = null;

/** Historial de la app (localStorage del navegador). */
export function getHistoryRepository(): HistoryRepository {
  shared ??= createStorageRepository(browserStorage());
  return shared;
}

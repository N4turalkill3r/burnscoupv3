import { describe, expect, it } from 'vitest';
import { computeAssessmentView } from '@/features/burn-calculation/assessmentView';
import { buildRecord, isSaveable, summarize } from '@/features/history/record';
import { createStorageRepository, type StorageLike } from '@/features/history/repository';
import { parsePatientRecord, sanitizeCaseFields } from '@/features/history/sanitize';
import { emptyCaseFields, type CaseFields } from '@/features/history/types';

class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

const ARRIVAL = '2026-10-09T12:00';

function adultCase(over: Partial<CaseFields> = {}): CaseFields {
  return {
    ...emptyCaseFields(ARRIVAL),
    patientLabel: 'Paciente 1',
    age: 30,
    weightKg: 70,
    burnAt: '2026-10-09T10:00',
    burnsByMethod: {
      lund_browder: { trunk_anterior: { depth: 'second_deep', coverage: { kind: 'full' } } },
      rule_of_nine: {},
    },
    ...over,
  };
}

describe('computeAssessmentView', () => {
  it('no calcula sin edad o peso', () => {
    const v = computeAssessmentView({
      ...adultCase(),
      age: null,
      burns: {},
    });
    expect(v.assessment).toBeNull();
    expect(v.missing).toContain('la edad del paciente');
  });

  it('calcula con datos válidos', () => {
    const f = adultCase();
    const v = computeAssessmentView({ ...f, burns: f.burnsByMethod.lund_browder });
    expect(v.assessment?.scq.total).toBe(13);
    expect(v.assessment?.volume24hMl).toBe(2 * 70 * 13);
  });
});

describe('record', () => {
  it('se puede guardar sólo con edad y peso válidos', () => {
    expect(isSaveable(adultCase())).toBe(true);
    expect(isSaveable(adultCase({ weightKg: null }))).toBe(false);
    expect(isSaveable(adultCase({ weightKg: 500 }))).toBe(false);
  });

  it('resume los resultados clave', () => {
    expect(summarize(adultCase())).toMatchObject({ scqTotal: 13, volume24hMl: 1820 });
  });

  it('no construye registro si no hay cambios y conserva createdAt', () => {
    const fields = adultCase();
    const first = buildRecord('a', fields, null, new Date('2026-10-09T12:00:00Z'));
    expect(first).not.toBeNull();
    expect(buildRecord('a', fields, first, new Date('2026-10-09T13:00:00Z'))).toBeNull();
    const changed = buildRecord(
      'a',
      adultCase({ weightKg: 80 }),
      first,
      new Date('2026-10-09T13:00:00Z'),
    );
    expect(changed?.createdAt).toBe(first?.createdAt);
    expect(changed?.updatedAt).toBe('2026-10-09T13:00:00.000Z');
  });

  it('no construye registro de un caso incompleto', () => {
    expect(buildRecord('a', adultCase({ age: null }), null, new Date())).toBeNull();
  });
});

describe('sanitize', () => {
  it('descarta valores inválidos y rellena por defecto', () => {
    const f = sanitizeCaseFields(
      {
        patientType: 'alien',
        age: -3,
        weightKg: 'x',
        burnType: 'chemical',
        chemicalAgent: 'bogus',
        burnsByMethod: {
          lund_browder: {
            head: { depth: 'third', coverage: { kind: 'fraction', value: 5 } },
            neck: { depth: 'third', coverage: { kind: 'full' } },
            nope: { depth: 'third', coverage: { kind: 'full' } },
          },
        },
        findings: { foo: true },
        diuresisLog: [{ id: 1 }],
      },
      ARRIVAL,
    );
    expect(f.patientType).toBe('adult');
    expect(f.age).toBeNull();
    expect(f.weightKg).toBeNull();
    expect(f.chemicalAgent).toBe('unknown_liquid');
    expect(Object.keys(f.burnsByMethod.lund_browder)).toEqual(['neck']);
    expect(f.findings).toEqual({});
    expect(f.diuresisLog).toEqual([]);
  });

  it('rechaza registros inválidos', () => {
    expect(parsePatientRecord(null)).toBeNull();
    expect(parsePatientRecord({ schema: 99 })).toBeNull();
    expect(parsePatientRecord({ schema: 1, id: 'x', createdAt: 'no', updatedAt: 'no' })).toBeNull();
  });
});

describe('repository', () => {
  const make = (id: string, at: string, label = id) => {
    const r = buildRecord(id, adultCase({ patientLabel: label }), null, new Date(at));
    if (!r) throw new Error('registro nulo');
    return r;
  };

  it('guarda, lista (recientes primero), obtiene y borra', () => {
    const repo = createStorageRepository(new MemoryStorage());
    expect(repo.save(make('a', '2026-10-09T10:00:00Z'))).toBe(true);
    expect(repo.save(make('b', '2026-10-09T11:00:00Z'))).toBe(true);
    expect(repo.list().map((r) => r.id)).toEqual(['b', 'a']);
    expect(repo.get('a')?.fields.patientLabel).toBe('a');
    repo.remove('a');
    expect(repo.list().map((r) => r.id)).toEqual(['b']);
    repo.clear();
    expect(repo.list()).toEqual([]);
  });

  it('sobrevive a datos corruptos', () => {
    const storage = new MemoryStorage();
    storage.setItem('k', '{no json');
    expect(createStorageRepository(storage, 'k').list()).toEqual([]);
    storage.setItem('k', JSON.stringify({ a: 1 }));
    expect(createStorageRepository(storage, 'k').list()).toEqual([]);
  });

  it('sin almacenamiento no falla', () => {
    const repo = createStorageRepository(null);
    expect(repo.isAvailable()).toBe(false);
    expect(repo.save(make('a', '2026-10-09T10:00:00Z'))).toBe(false);
    expect(repo.list()).toEqual([]);
  });

  it('informa si el almacenamiento falla al escribir', () => {
    const full: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('cuota');
      },
      removeItem: () => undefined,
    };
    const repo = createStorageRepository(full);
    expect(repo.save(make('a', '2026-10-09T10:00:00Z'))).toBe(false);
    expect(repo.isAvailable()).toBe(false);
  });

  it('exporta e importa conservando el más reciente', () => {
    const src = createStorageRepository(new MemoryStorage());
    src.save(make('a', '2026-10-09T10:00:00Z', 'nuevo'));
    src.save(make('b', '2026-10-09T09:00:00Z'));
    const json = src.exportJson(new Date('2026-10-10T00:00:00Z'));

    const dst = createStorageRepository(new MemoryStorage());
    dst.save(make('a', '2026-10-09T12:00:00Z', 'más reciente'));
    const result = dst.importJson(json);
    expect(result).toEqual({ imported: 1, skipped: 1 });
    expect(dst.get('a')?.fields.patientLabel).toBe('más reciente');
    expect(dst.get('b')).not.toBeNull();
  });

  it('rechaza archivos inválidos', () => {
    const repo = createStorageRepository(new MemoryStorage());
    expect(repo.importJson('no json').error).toBeDefined();
    expect(repo.importJson('{"x":1}').error).toBeDefined();
    expect(repo.importJson(JSON.stringify([{ basura: true }]))).toEqual({
      imported: 0,
      skipped: 1,
    });
  });
});

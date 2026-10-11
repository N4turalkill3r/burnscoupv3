import type { BodyModelId, SegmentId } from '@/shared/types/clinical';

/**
 * Geometría del cuerpo, generada por código y sin archivos externos.
 *
 * El cuerpo mira hacia +Z. El lado DERECHO del paciente queda en −X (a la izquierda de
 * quien lo mira de frente). Las unidades son metros de un adulto; cada modelo se escala al
 * dibujarlo (ver `scale`). Cada segmento es una o más primitivas con el mismo id de zona.
 */

export type Vec3 = readonly [number, number, number];

export interface EllipsoidPrimitive {
  shape: 'ellipsoid';
  position: Vec3;
  radii: Vec3;
}

/** Cilindro cónico, completo o sólo un arco (medias cañas para separar frente y espalda). */
export interface TubePrimitive {
  shape: 'tube';
  position: Vec3;
  radiusTop: number;
  radiusBottom: number;
  height: number;
  /** Aplana el eje Z (el tronco es más ancho que profundo). */
  scaleZ: number;
  /** Ángulo inicial y longitud del arco, en radianes (0 = frente, +π/2 = lado izquierdo). */
  arcStart: number;
  arcLength: number;
}

export type Primitive = EllipsoidPrimitive | TubePrimitive;

export interface SegmentSpec {
  id: SegmentId;
  primitives: Primitive[];
}

export interface BodyLayout {
  model: BodyModelId;
  segments: SegmentSpec[];
  /** Factor de escala del modelo completo (niños más pequeños). */
  scale: number;
  /** Altura del modelo ya escalado, en metros. */
  height: number;
}

type Arc = readonly [start: number, length: number];
const FULL: Arc = [0, Math.PI * 2];
const FRONT: Arc = [-Math.PI / 2, Math.PI];
const BACK: Arc = [Math.PI / 2, Math.PI];
/** Cuarto posterior derecho (−X) e izquierdo (+X) del paciente: glúteos. */
const BACK_RIGHT: Arc = [Math.PI, Math.PI / 2];
const BACK_LEFT: Arc = [Math.PI / 2, Math.PI / 2];

interface Proportions {
  /** Escala global respecto al adulto. */
  scale: number;
  /** Tamaño relativo de la cabeza (la cabeza del lactante es proporcionalmente mayor). */
  head: number;
  /** Longitud relativa de las extremidades. */
  limb: number;
  /** Grosor relativo del cuerpo. */
  girth: number;
}

export const BODY_PROPORTIONS: Record<BodyModelId, Proportions> = {
  adult: { scale: 1, head: 1, limb: 1, girth: 1 },
  child_10_14: { scale: 0.84, head: 1.12, limb: 0.96, girth: 1 },
  child_5_9: { scale: 0.66, head: 1.28, limb: 0.9, girth: 1.04 },
  child_1_4: { scale: 0.5, head: 1.5, limb: 0.82, girth: 1.1 },
  infant: { scale: 0.36, head: 1.8, limb: 0.66, girth: 1.2 },
};

function tube(
  x: number,
  yBottom: number,
  yTop: number,
  radiusTop: number,
  radiusBottom: number,
  options: { z?: number; scaleZ?: number; arc?: Arc } = {},
): TubePrimitive {
  const arc = options.arc ?? FULL;
  return {
    shape: 'tube',
    position: [x, (yBottom + yTop) / 2, options.z ?? 0],
    radiusTop,
    radiusBottom,
    height: yTop - yBottom,
    scaleZ: options.scaleZ ?? 1,
    arcStart: arc[0],
    arcLength: arc[1],
  };
}

function ellipsoid(position: Vec3, radii: Vec3): EllipsoidPrimitive {
  return { shape: 'ellipsoid', position, radii };
}

/** Construye todos los segmentos del cuerpo para un modelo. Función pura. */
export function buildBodyLayout(model: BodyModelId): BodyLayout {
  const p = BODY_PROPORTIONS[model];
  const g = p.girth;
  const TORSO_DEPTH = 0.65;

  // Alturas (de abajo hacia arriba).
  const footH = 0.08;
  const ankleY = footH;
  const kneeY = ankleY + 0.4 * p.limb;
  const hipY = kneeY + 0.42 * p.limb;
  const lowerTorsoTop = hipY + 0.32;
  const shoulderLine = hipY + 0.58;
  const neckTop = shoulderLine + 0.08;
  const headRy = 0.11 * p.head;
  const headCenterY = neckTop + headRy * 0.8;

  const segments: SegmentSpec[] = [];
  const add = (id: SegmentId, ...primitives: Primitive[]) => segments.push({ id, primitives });

  // Cabeza y cuello.
  add('head', ellipsoid([0, headCenterY, 0.005], [0.085 * p.head, headRy, 0.1 * p.head]));
  add('neck', tube(0, shoulderLine - 0.02, neckTop, 0.048 * g, 0.056 * g));

  // Tronco: frente (tórax + abdomen) y espalda (dorso superior + región lumbosacra).
  add(
    'thorax_front',
    tube(0, lowerTorsoTop, shoulderLine, 0.17 * g, 0.146 * g, { scaleZ: 0.62, arc: FRONT }),
  );
  add(
    'abdomen_front',
    tube(0, hipY - 0.02, lowerTorsoTop, 0.146 * g, 0.152 * g, { scaleZ: TORSO_DEPTH, arc: FRONT }),
  );
  add(
    'upper_back',
    tube(0, lowerTorsoTop, shoulderLine, 0.17 * g, 0.146 * g, { scaleZ: 0.62, arc: BACK }),
  );
  add(
    'lower_back',
    tube(0, hipY + 0.12, lowerTorsoTop, 0.146 * g, 0.149 * g, { scaleZ: TORSO_DEPTH, arc: BACK }),
  );
  add('genitals', ellipsoid([0, hipY - 0.025, 0.1 * g], [0.034 * g, 0.042, 0.03 * g]));

  // Glúteos: cuarto posterior de la pelvis + un abultamiento.
  for (const side of ['r', 'l'] as const) {
    const sign = side === 'r' ? -1 : 1;
    add(
      side === 'r' ? 'glute_r' : 'glute_l',
      tube(0, hipY - 0.02, hipY + 0.12, 0.149 * g, 0.153 * g, {
        scaleZ: TORSO_DEPTH,
        arc: side === 'r' ? BACK_RIGHT : BACK_LEFT,
      }),
      ellipsoid([sign * 0.065 * g, hipY + 0.03, -0.075 * g], [0.075 * g, 0.075, 0.045 * g]),
    );
  }

  // Extremidades, lado derecho (−X) e izquierdo (+X).
  const shoulderY = shoulderLine - 0.04;
  const upperArmBottom = shoulderY - 0.28 * p.limb;
  const forearmBottom = upperArmBottom - 0.26 * p.limb;

  for (const side of ['r', 'l'] as const) {
    const sign = side === 'r' ? -1 : 1;
    const armX = sign * 0.225 * g;
    const legX = sign * 0.085 * g;

    add(
      side === 'r' ? 'arm_r' : 'arm_l',
      tube(armX, upperArmBottom, shoulderY, 0.05 * g, 0.043 * g),
      ellipsoid([armX, shoulderY, 0], [0.056 * g, 0.056 * g, 0.056 * g]),
    );
    add(
      side === 'r' ? 'forearm_r' : 'forearm_l',
      tube(armX, forearmBottom, upperArmBottom, 0.043 * g, 0.033 * g),
    );
    add(
      side === 'r' ? 'hand_r' : 'hand_l',
      ellipsoid([armX, forearmBottom - 0.06, 0], [0.03 * g, 0.075, 0.02 * g]),
    );
    add(
      side === 'r' ? 'thigh_r' : 'thigh_l',
      tube(sign * 0.095 * g, kneeY, hipY, 0.088 * g, 0.06 * g),
    );
    add(side === 'r' ? 'leg_r' : 'leg_l', tube(legX, ankleY, kneeY, 0.058 * g, 0.04 * g));
    add(
      side === 'r' ? 'foot_r' : 'foot_l',
      ellipsoid([legX, footH / 2, 0.05], [0.04 * g, 0.04, 0.11]),
    );
  }

  return {
    model,
    segments,
    scale: p.scale,
    height: (headCenterY + headRy) * p.scale,
  };
}

/** Todos los segmentos que debe tener un modelo (para validar la geometría). */
export const ALL_SEGMENT_IDS: readonly SegmentId[] = [
  'head',
  'neck',
  'thorax_front',
  'abdomen_front',
  'upper_back',
  'lower_back',
  'glute_r',
  'glute_l',
  'genitals',
  'arm_r',
  'arm_l',
  'forearm_r',
  'forearm_l',
  'hand_r',
  'hand_l',
  'thigh_r',
  'thigh_l',
  'leg_r',
  'leg_l',
  'foot_r',
  'foot_l',
];

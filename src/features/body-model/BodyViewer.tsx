import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { memo, useEffect, useMemo, useRef, type ComponentRef } from 'react';
import { DoubleSide } from 'three';
import { zoneOfSegment } from '@/data/zones';
import type { BodyModelId, BurnMap, ScqMethod, SegmentId, ZoneId } from '@/shared/types/clinical';
import { buildBodyLayout, type Primitive, type SegmentSpec } from './bodyLayout';
import { zoneColor } from './zoneColor';

export type ViewerMode = 'paint' | 'rotate';
export type ViewName = 'front' | 'back';
export interface ViewRequest {
  view: ViewName;
  /** Cambia en cada petición para volver a aplicar la misma vista. */
  nonce: number;
}

export interface BodyViewerProps {
  model: BodyModelId;
  method: ScqMethod;
  burns: BurnMap;
  /** % de SC de cada zona del método activo (para atenuar el color en cobertura parcial). */
  zoneValues: Record<string, number>;
  mode: ViewerMode;
  viewRequest: ViewRequest;
  hoveredZone: ZoneId | null;
  onHoverZone: (zone: ZoneId | null) => void;
  /** Se llama al pulsar sobre una zona o al arrastrar sobre ella con el botón presionado. */
  onPaintZone: (zone: ZoneId) => void;
}

const FOV = 35;

function PrimitiveMesh({
  primitive,
  color,
  highlighted,
  handlers,
}: {
  primitive: Primitive;
  color: string;
  highlighted: boolean;
  handlers: {
    onPointerDown: (e: { stopPropagation: () => void }) => void;
    onPointerOver: (e: { stopPropagation: () => void }) => void;
    onPointerOut: () => void;
  };
}) {
  const material = (
    <meshStandardMaterial
      color={color}
      roughness={0.75}
      metalness={0}
      side={DoubleSide}
      emissive={highlighted ? '#2f6fd0' : '#000000'}
      emissiveIntensity={highlighted ? 0.45 : 0}
    />
  );

  if (primitive.shape === 'ellipsoid') {
    return (
      <mesh position={primitive.position} scale={primitive.radii} {...handlers}>
        <sphereGeometry args={[1, 28, 20]} />
        {material}
      </mesh>
    );
  }
  return (
    <mesh position={primitive.position} scale={[1, 1, primitive.scaleZ]} {...handlers}>
      <cylinderGeometry
        args={[
          primitive.radiusTop,
          primitive.radiusBottom,
          primitive.height,
          36,
          1,
          true,
          primitive.arcStart,
          primitive.arcLength,
        ]}
      />
      {material}
    </mesh>
  );
}

function CameraRig({
  controls,
  targetY,
  distance,
  request,
}: {
  controls: React.RefObject<ComponentRef<typeof OrbitControls> | null>;
  targetY: number;
  distance: number;
  request: ViewRequest;
}) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const azimuth = request.view === 'back' ? Math.PI : 0;
    camera.position.set(Math.sin(azimuth) * distance, targetY, Math.cos(azimuth) * distance);
    camera.lookAt(0, targetY, 0);
    controls.current?.target.set(0, targetY, 0);
    controls.current?.update();
    invalidate();
  }, [request, camera, controls, targetY, distance, invalidate]);

  return null;
}

function BodyViewerImpl({
  model,
  method,
  burns,
  zoneValues,
  mode,
  viewRequest,
  hoveredZone,
  onHoverZone,
  onPaintZone,
}: BodyViewerProps) {
  const layout = useMemo(() => buildBodyLayout(model), [model]);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const painting = useRef(false);

  useEffect(() => {
    const stop = () => {
      painting.current = false;
    };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, []);

  const targetY = layout.height / 2;
  const distance = Math.max(1.5, layout.height * 1.9);

  const handlersFor = (segment: SegmentSpec) => {
    const zone = zoneOfSegment(method, segment.id as SegmentId);
    return {
      onPointerDown: (e: { stopPropagation: () => void }) => {
        if (mode !== 'paint') return;
        e.stopPropagation();
        painting.current = true;
        onPaintZone(zone);
      },
      onPointerOver: (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        onHoverZone(zone);
        if (mode === 'paint' && painting.current) onPaintZone(zone);
      },
      onPointerOut: () => onHoverZone(null),
    };
  };

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ fov: FOV, near: 0.1, far: 50, position: [0, targetY, distance] }}
      style={{ touchAction: mode === 'paint' ? 'none' : 'pan-y' }}
      aria-hidden
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[2, 3, 4]} intensity={1.3} />
      <directionalLight position={[-3, 2, -4]} intensity={0.8} />
      <CameraRig controls={controls} targetY={targetY} distance={distance} request={viewRequest} />
      <group scale={layout.scale}>
        {layout.segments.map((segment) => {
          const zone = zoneOfSegment(method, segment.id);
          const color = zoneColor(burns[zone], zoneValues[zone] ?? 0);
          const handlers = handlersFor(segment);
          return (
            <group key={segment.id}>
              {segment.primitives.map((primitive, index) => (
                <PrimitiveMesh
                  key={index}
                  primitive={primitive}
                  color={color}
                  highlighted={hoveredZone === zone}
                  handlers={handlers}
                />
              ))}
            </group>
          );
        })}
      </group>
      <OrbitControls
        ref={controls}
        enabled={mode === 'rotate'}
        enablePan={false}
        minDistance={distance * 0.5}
        maxDistance={distance * 1.8}
        target={[0, targetY, 0]}
      />
    </Canvas>
  );
}

/** Visor 3D del cuerpo. Memoizado para no redibujar si no cambian sus propiedades. */
export const BodyViewer = memo(BodyViewerImpl);
export default BodyViewer;

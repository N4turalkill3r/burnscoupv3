import { DEPTH_BY_ID } from '@/data/depths';
import { ZONE_LABEL, ZONES_BY_METHOD } from '@/data/zones';
import { coverageFraction } from '@/features/burn-calculation/scq';
import type { BurnMap, ScqMethod, ZoneId } from '@/shared/types/clinical';
import { formatNumber } from '@/shared/utils/format';
import { coverageLabel } from './painting';

interface ZoneListProps {
  method: ScqMethod;
  burns: BurnMap;
  zoneValues: Record<string, number>;
  hoveredZone: ZoneId | null;
  onHoverZone: (zone: ZoneId | null) => void;
  onPaintZone: (zone: ZoneId) => void;
  onClearZone: (zone: ZoneId) => void;
}

/**
 * Lista de zonas del método activo. Es la alternativa accesible al modelo 3D: permite
 * marcar cada zona con el pincel actual sin tocar el cuerpo.
 */
export function ZoneList({
  method,
  burns,
  zoneValues,
  hoveredZone,
  onHoverZone,
  onPaintZone,
  onClearZone,
}: ZoneListProps) {
  return (
    <ul className="zone-list">
      {ZONES_BY_METHOD[method].map((zone) => {
        const burn = burns[zone];
        const value = zoneValues[zone] ?? 0;
        const burnedPercent = burn ? value * coverageFraction(burn.coverage, value) : 0;
        return (
          <li
            key={zone}
            className={`zone-row ${burn ? 'is-burned' : ''} ${hoveredZone === zone ? 'is-hovered' : ''}`.trim()}
            onMouseEnter={() => onHoverZone(zone)}
            onMouseLeave={() => onHoverZone(null)}
          >
            <button
              type="button"
              className="zone-row__paint"
              onClick={() => onPaintZone(zone)}
              aria-label={`Marcar ${ZONE_LABEL[zone]} con el pincel actual`}
            >
              <span className="zone-row__name">{ZONE_LABEL[zone]}</span>
              <span className="zone-row__value">{formatNumber(value, 2)} %</span>
              {burn && (
                <span className="zone-row__state">
                  <span
                    className="swatch swatch--small"
                    style={{ background: DEPTH_BY_ID[burn.depth].color }}
                    aria-hidden
                  />
                  {DEPTH_BY_ID[burn.depth].label} · {coverageLabel(burn.coverage)} ={' '}
                  <strong>{formatNumber(burnedPercent, 2)} %</strong>
                  {!DEPTH_BY_ID[burn.depth].countsForScq && ' (no suma)'}
                </span>
              )}
            </button>
            {burn && (
              <button
                type="button"
                className="zone-row__clear"
                onClick={() => onClearZone(zone)}
                aria-label={`Quitar la marca de ${ZONE_LABEL[zone]}`}
              >
                ✕
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

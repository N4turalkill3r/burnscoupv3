import type { ReactNode } from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  description?: string;
  disabled?: boolean;
}

interface SegmentedProps<T extends string> {
  legend: string;
  name: string;
  value: T | null;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  /** Muestra las opciones como tarjetas apiladas con descripción. */
  stacked?: boolean;
}

/** Grupo de opciones excluyentes (radio) con aspecto de botones grandes. */
export function Segmented<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  stacked = false,
}: SegmentedProps<T>) {
  return (
    <fieldset className={`segmented ${stacked ? 'segmented--stacked' : ''}`.trim()}>
      <legend className="field__label">{legend}</legend>
      <div className="segmented__options">
        {options.map((option) => (
          <label
            key={option.value}
            className={`segmented__option ${value === option.value ? 'is-selected' : ''} ${
              option.disabled ? 'is-disabled' : ''
            }`.trim()}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              disabled={option.disabled}
              onChange={() => onChange(option.value)}
            />
            <span className="segmented__label">{option.label}</span>
            {option.description && (
              <span className="segmented__description">{option.description}</span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

import { useId, useRef, useState } from 'react';
import { parseDecimal } from '@/shared/utils/format';

interface NumberFieldProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  unit?: string;
  hint?: string;
  error?: string | null;
  /** Sólo enteros (p. ej. la edad en años cumplidos). */
  integer?: boolean;
  placeholder?: string;
}

/**
 * Campo numérico que acepta coma o punto decimal. Conserva lo que el usuario escribe
 * mientras teclea (p. ej. "7,") y sólo vuelve al valor externo si éste cambia desde fuera.
 */
export function NumberField({
  label,
  value,
  onChange,
  unit,
  hint,
  error,
  integer = false,
  placeholder,
}: NumberFieldProps) {
  const id = useId();
  const [text, setText] = useState(value === null ? '' : String(value).replace('.', ','));
  const lastEmitted = useRef<number | null>(value);

  // Si el valor cambió desde fuera (p. ej. botón "Usar valor del protocolo"), se refleja.
  if (value !== lastEmitted.current) {
    lastEmitted.current = value;
    setText(value === null ? '' : String(value).replace('.', ','));
  }

  const handleChange = (raw: string) => {
    setText(raw);
    let parsed = parseDecimal(raw);
    if (parsed !== null && integer && !Number.isInteger(parsed)) parsed = null;
    lastEmitted.current = parsed;
    onChange(parsed);
  };

  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className={`field__control ${error ? 'has-error' : ''}`.trim()}>
        <input
          id={id}
          type="text"
          inputMode={integer ? 'numeric' : 'decimal'}
          autoComplete="off"
          value={text}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          onChange={(e) => handleChange(e.target.value)}
        />
        {unit && <span className="field__unit">{unit}</span>}
      </div>
      {hint && !error && (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

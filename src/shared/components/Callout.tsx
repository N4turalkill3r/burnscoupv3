import type { ReactNode } from 'react';

export type CalloutTone = 'info' | 'warning' | 'danger' | 'success';

const ICON: Record<CalloutTone, string> = {
  info: 'ℹ',
  warning: '⚠',
  danger: '⛔',
  success: '✔',
};

interface CalloutProps {
  tone?: CalloutTone;
  title?: ReactNode;
  children?: ReactNode;
}

/** Aviso destacado. El icono y el texto transmiten el tipo, no sólo el color. */
export function Callout({ tone = 'info', title, children }: CalloutProps) {
  return (
    <div className={`callout callout--${tone}`} role={tone === 'danger' ? 'alert' : 'note'}>
      <span className="callout__icon" aria-hidden>
        {ICON[tone]}
      </span>
      <div className="callout__body">
        {title && <strong className="callout__title">{title}</strong>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}

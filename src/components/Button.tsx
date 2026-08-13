import type { ButtonHTMLAttributes, CSSProperties } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Face colour. */
  bg?: string;
  /** Label colour. */
  fg?: string;
  /** Colour of the solid ledge under the button. */
  ledge?: string;
  /** Ledge depth in px — also how far the button sinks when pressed. */
  ledgeH?: number;
  /** Drop the ledge entirely (used for secondary, inset controls). */
  flat?: boolean;
}

/**
 * The game's one button shape: a solid face sitting on a coloured ledge that it
 * sinks into on press.
 */
export function Button({
  bg,
  fg,
  ledge,
  ledgeH,
  flat,
  className,
  style,
  ...rest
}: ButtonProps) {
  const vars = {
    '--btn-bg': bg,
    '--btn-fg': fg,
    '--ledge': ledge,
    '--ledge-h': ledgeH != null ? `${ledgeH}px` : undefined,
    ...style,
  } as CSSProperties;

  return (
    <button
      type="button"
      className={['btn', flat ? 'btn-flat' : '', className].filter(Boolean).join(' ')}
      style={vars}
      {...rest}
    />
  );
}

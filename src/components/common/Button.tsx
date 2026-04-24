import React from 'react';

export type ButtonProps = {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

export const Button = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
}: ButtonProps) => {
  const styles: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 6,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    backgroundColor: variant === 'primary' ? '#3b82f6' : '#e5e7eb',
    color: variant === 'primary' ? '#ffffff' : '#111827',
    opacity: disabled ? 0.5 : 1,
    fontWeight: 500,
  };

  return (
    <button type="button" style={styles} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};

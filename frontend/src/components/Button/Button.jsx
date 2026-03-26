import React from 'react';
import styles from './Button.module.css';

function Button({
  variant = 'primary',
  size,
  disabled = false,
  onClick,
  children,
  className = '',
  type = 'button',
  ...rest
}) {
  const classes = [
    styles.btn,
    styles[variant],
    size ? styles[size] : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;

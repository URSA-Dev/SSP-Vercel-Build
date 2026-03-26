import React from 'react';
import styles from './Toast.module.css';

function Toast({ message, type = 'info', onDismiss, exiting }) {
  const classes = [
    styles.toast,
    styles[type],
    exiting ? styles.toastExit : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} role={type === 'error' ? 'alert' : 'status'}>
      <span>{message}</span>
      <button className={styles.toastClose} onClick={onDismiss} aria-label="Dismiss">&times;</button>
    </div>
  );
}

export function ToastTray({ children }) {
  return <div className={styles.toastTray} aria-live="polite" aria-atomic="true">{children}</div>;
}

export default Toast;

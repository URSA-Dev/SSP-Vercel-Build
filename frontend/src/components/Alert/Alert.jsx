import React from 'react';
import styles from './Alert.module.css';

function Alert({ variant = 'blue', icon, title, children }) {
  const classes = [styles.alert, styles[variant]].filter(Boolean).join(' ');

  return (
    <div className={classes} role="alert">
      {icon && <span className={styles.alertIcon}>{icon}</span>}
      <div className={styles.alertContent}>
        {title && <div className={styles.alertTitle}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

export default Alert;

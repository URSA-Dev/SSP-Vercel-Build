import React from 'react';
import styles from './Badge.module.css';

function Badge({ variant = 'gray', children, className = '' }) {
  const classes = [styles.badge, styles[variant], className].filter(Boolean).join(' ');

  return <span className={classes}>{children}</span>;
}

export default Badge;

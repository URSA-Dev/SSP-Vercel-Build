import React from 'react';
import styles from './Spinner.module.css';

function Spinner({ size = 'sm', className = '', label = 'Loading' }) {
  const classes = [styles.spinner, styles[size], className].filter(Boolean).join(' ');
  return <div className={classes} role="status" aria-label={label} />;
}

export default Spinner;

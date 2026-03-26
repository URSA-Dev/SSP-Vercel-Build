import React from 'react';
import styles from './FormControls.module.css';

const colMap = { 2: styles.g2, 3: styles.g3, 4: styles.g4 };

function FormGrid({ columns = 2, children, className = '' }) {
  const classes = [styles.formGrid, colMap[columns] || styles.g2, className].filter(Boolean).join(' ');

  return <div className={classes}>{children}</div>;
}

export default FormGrid;

import React from 'react';
import styles from './KpiCard.module.css';

function KpiCard({ value, label, trend, color, className = '' }) {
  const classes = [styles.kpi, className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {color && <div className={styles.kpiStripe} style={{ background: color }} />}
      <div className={styles.kpiNum}>{value}</div>
      <div className={styles.kpiLabel}>{label}</div>
      {trend && <div className={styles.kpiTrend}>{trend}</div>}
    </div>
  );
}

export default KpiCard;

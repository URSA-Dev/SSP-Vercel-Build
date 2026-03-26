import React from 'react';
import styles from './StatCard.module.css';

function StatCard({ value, label, color }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statNum} style={color ? { color } : undefined}>{value}</div>
      <div className={styles.statLbl}>{label}</div>
    </div>
  );
}

export default StatCard;

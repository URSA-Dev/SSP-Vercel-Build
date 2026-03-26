import React from 'react';
import styles from './SlaRing.module.css';

function SlaRing({ label, timeDisplay, subtitle, percentage = 0, status = 'ok' }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={[styles.slaCard, styles[status]].join(' ')}>
      <div className={styles.slaRingWrap}>
        <svg className={styles.slaRing} width="90" height="90" viewBox="0 0 90 90">
          <circle className={styles.slaBg} cx="45" cy="45" r={radius} />
          <circle
            className={styles.slaFill}
            cx="45"
            cy="45"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
      </div>
      <div className={styles.slaTime}>{timeDisplay}</div>
      <div className={styles.slaLabel}>{label}</div>
      {subtitle && <div className={styles.slaSubtitle}>{subtitle}</div>}
    </div>
  );
}

export default SlaRing;

import React from 'react';
import styles from './ConfidenceBar.module.css';

function ConfidenceBar({ confidence }) {
  if (confidence == null) {
    return <span className={styles.na}>N/A</span>;
  }

  const pct = Math.round(confidence * 100);
  const level = pct >= 80 ? 'high' : pct >= 50 ? 'mid' : 'low';

  return (
    <div className={styles.confBarRow}>
      <div className={styles.confBarTrack}>
        <div
          className={[styles.confBarFill, styles[level]].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={styles.confPct}>{pct}%</span>
    </div>
  );
}

export default ConfidenceBar;

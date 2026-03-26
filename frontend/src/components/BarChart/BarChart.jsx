import React from 'react';
import styles from './BarChart.module.css';

function BarChart({ data = [] }) {
  const maxVal = Math.max(...data.map((d) => d.maxValue || d.value), 1);

  return (
    <div className={styles.barChart}>
      {data.map((d, i) => (
        <div key={i} className={styles.barRow}>
          <span className={styles.barName}>{d.name}</span>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{
                width: `${(d.value / maxVal) * 100}%`,
                background: d.color || undefined,
              }}
            />
          </div>
          <span className={styles.barNum}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}

export default BarChart;

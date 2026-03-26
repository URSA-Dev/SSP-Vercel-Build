import React from 'react';
import styles from './Timeline.module.css';

function Timeline({ items = [] }) {
  return (
    <div className={styles.timeline}>
      {items.map((item, i) => (
        <div key={i} className={styles.tlItem}>
          <div className={[styles.tlDot, styles[item.status] || styles.pending].join(' ')} />
          <div className={styles.tlTitle}>{item.title}</div>
          {item.meta && <div className={styles.tlMeta}>{item.meta}</div>}
        </div>
      ))}
    </div>
  );
}

export default Timeline;

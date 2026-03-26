import React from 'react';
import styles from './AiPanel.module.css';

function AiPanel({ title, chipLabel, note, children }) {
  return (
    <div className={styles.aiPanel}>
      <div className={styles.aiPanelHead}>
        <span className={styles.aiPanelTitle}>{title}</span>
        {chipLabel && <span className={styles.aiChip}>{chipLabel}</span>}
      </div>
      <div className={styles.aiPanelBody}>
        {children}
        {note && <div className={styles.aiNote}>{note}</div>}
      </div>
    </div>
  );
}

export default AiPanel;

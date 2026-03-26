import React from 'react';
import styles from './EmptyState.module.css';

function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className={styles.emptyState}>
      {icon && <div className={styles.emptyIcon}>{icon}</div>}
      {title && <div className={styles.emptyTitle}>{title}</div>}
      {subtitle && <div className={styles.emptySub}>{subtitle}</div>}
      {action && <div className={styles.emptyAction}>{action}</div>}
    </div>
  );
}

export default EmptyState;

import styles from './Skeleton.module.css';

export function Skeleton({ width, height, borderRadius, className }) {
  return (
    <div
      className={`${styles.skeleton} ${className || ''}`}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={`${styles.skeletonText} ${className || ''}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={styles.skeletonLine}
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonKpiRow() {
  return (
    <div className="kpi-row" aria-hidden="true">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={styles.skeletonCard}>
          <Skeleton width="60%" height="12px" borderRadius="4px" />
          <Skeleton width="80px" height="36px" borderRadius="4px" />
          <Skeleton width="80%" height="10px" borderRadius="4px" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className={styles.skeletonTableWrap} aria-hidden="true">
      <div className={styles.skeletonTableHeader}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width={`${60 + Math.random() * 40}px`} height="10px" borderRadius="4px" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={styles.skeletonTableRow}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={`${40 + Math.random() * 60}%`} height="14px" borderRadius="4px" />
          ))}
        </div>
      ))}
    </div>
  );
}

import React from 'react';
import styles from './IssueCard.module.css';

function IssueCard({
  category,
  subcategory,
  severity = 'MODERATE',
  guideline,
  description,
  mitigation,
  inMemo = false,
  onDelete,
  onToggleMemo,
}) {
  const sevClass = styles[`sev${severity}`] || styles.sevMODERATE;

  return (
    <div className={styles.issueCard}>
      <div className={[styles.issueSevBar, sevClass].join(' ')} />
      <div className={styles.issueBody}>
        <div className={styles.issueHeader}>
          <div>
            <div className={styles.issueCategory}>{category}</div>
            {subcategory && <div className={styles.issueSubcategory}>{subcategory}</div>}
          </div>
        </div>
        {guideline && <div className={styles.issueGuideline}>{guideline}</div>}
        {description && <div className={styles.issueDesc}>{description}</div>}
        {mitigation && <div className={styles.issueMitigation}>{mitigation}</div>}
        <div className={styles.issueActions}>
          {onToggleMemo && (
            <button
              className={[styles.issueBtn, inMemo ? styles.issueBtnActive : ''].filter(Boolean).join(' ')}
              onClick={onToggleMemo}
            >
              {inMemo ? 'In Memo' : 'Add to Memo'}
            </button>
          )}
          {onDelete && (
            <button
              className={[styles.issueBtn, styles.issueBtnDanger].join(' ')}
              onClick={onDelete}
              aria-label="Delete issue"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default IssueCard;

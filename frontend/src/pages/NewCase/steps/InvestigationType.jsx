import { useState } from 'react';
import Button from '../../../components/Button/Button';
import Alert from '../../../components/Alert/Alert';
import { CASE_TYPES } from '../../../utils/constants';
import styles from '../NewCase.module.css';

function InvestigationType({ data, onChange, onNext, onBack }) {
  const [error, setError] = useState('');

  function handleSelect(code) {
    onChange('caseType', code);
    setError('');
  }

  function handleNext() {
    if (!data.caseType) {
      setError('Please select an investigation type to continue.');
      return;
    }
    onNext();
  }

  return (
    <div className={styles.stepCard}>
      <div className={styles.sectionTitle}>Step 2 — Case Type</div>

      {error && (
        <Alert variant="red" title="Selection Required">
          {error}
        </Alert>
      )}

      <div className="type-grid">
        {CASE_TYPES.map((t) => {
          const selected = data.caseType === t.code;
          return (
            <div
              key={t.code}
              className={`type-card${selected ? ' selected' : ''}`}
              onClick={() => handleSelect(t.code)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(t.code);
                }
              }}
              aria-pressed={selected}
            >
              <div className="tc-name">{t.name}</div>
              {selected && (
                <div style={{ color: 'var(--uscg)', marginTop: 6, fontSize: 12, fontWeight: 600 }}>
                  &#10003; Selected
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.navRow}>
        <Button variant="secondary" onClick={onBack}>&larr; Back</Button>
        <Button variant="primary" onClick={handleNext}>Continue &rarr; Priority &amp; Assignment</Button>
      </div>
    </div>
  );
}

export default InvestigationType;

import { useState } from 'react';
import Button from '../../../components/Button/Button';
import Alert from '../../../components/Alert/Alert';
import { CASE_TYPES } from '../../../utils/constants';

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
    <div>
      {error && (
        <Alert variant="red" title="Selection Required">
          {error}
        </Alert>
      )}

      <div className="type-grid" style={{ marginTop: 16 }}>
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
              <div style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: 4 }}>
                {t.code}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>
                {t.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-light, #6b7280)' }}>
                {t.desc}
              </div>
              {selected && (
                <div style={{ marginTop: 8, color: 'var(--uscg, #4a5c2f)', fontWeight: 600, fontSize: '0.8rem' }}>
                  &#10003; Selected
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border, #e5e7eb)' }}>
        <Button variant="ghost" onClick={onBack}>&larr; Back</Button>
        <Button variant="primary" onClick={handleNext}>Continue &rarr;</Button>
      </div>
    </div>
  );
}

export default InvestigationType;

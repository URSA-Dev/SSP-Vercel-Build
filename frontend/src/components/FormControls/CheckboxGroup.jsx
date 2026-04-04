import { useId } from 'react';
import styles from './FormControls.module.css';

function CheckboxGroup({ label, required, hint, error, value = [], options = [], onChange, className = '' }) {
  const hintId = useId();
  const hasError = !!error;
  const hintText = hasError && typeof error === 'string' ? error : hint;

  function handleToggle(optionValue) {
    const next = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(next);
  }

  return (
    <div className={[styles.formGroup, className].filter(Boolean).join(' ')}>
      {label && (
        <label className={styles.formLabel}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div
        className={[styles.checkboxList, hasError ? styles.checkboxListError : ''].filter(Boolean).join(' ')}
        role="group"
        aria-label={label}
        aria-describedby={hintText ? hintId : undefined}
      >
        {options.map((opt) => {
          const checked = value.includes(opt);
          return (
            <label key={opt} className={[styles.checkboxItem, checked ? styles.checkboxItemChecked : ''].filter(Boolean).join(' ')}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => handleToggle(opt)}
                className={styles.checkboxInput}
              />
              <span className={styles.checkboxLabel}>{opt}</span>
            </label>
          );
        })}
      </div>
      {hintText && (
        <span id={hintId} className={[styles.formHint, hasError ? styles.formHintError : ''].filter(Boolean).join(' ')}>
          {hintText}
        </span>
      )}
    </div>
  );
}

export default CheckboxGroup;

import React, { useId } from 'react';
import styles from './FormControls.module.css';

function Select({ label, required, hint, error, value, onChange, options = [], className = '', ...rest }) {
  const hintId = useId();
  const hasError = !!error;
  const hintText = hasError && typeof error === 'string' ? error : hint;

  return (
    <div className={[styles.formGroup, className].filter(Boolean).join(' ')}>
      {label && (
        <label className={styles.formLabel}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <select
        className={[styles.formControl, hasError ? styles.formControlError : ''].filter(Boolean).join(' ')}
        value={value}
        onChange={onChange}
        required={required}
        aria-invalid={hasError || undefined}
        aria-describedby={hintText ? hintId : undefined}
        {...rest}
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {hintText && <span id={hintId} className={[styles.formHint, hasError ? styles.formHintError : ''].filter(Boolean).join(' ')}>{hintText}</span>}
    </div>
  );
}

export default Select;

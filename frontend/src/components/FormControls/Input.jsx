import React, { useId } from 'react';
import styles from './FormControls.module.css';

function Input({ label, required, hint, error, value, onChange, placeholder, type = 'text', maxLength, className = '', ...rest }) {
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
      <input
        className={[styles.formControl, hasError ? styles.formControlError : ''].filter(Boolean).join(' ')}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        aria-invalid={hasError || undefined}
        aria-describedby={hintText ? hintId : undefined}
        {...rest}
      />
      {hintText && <span id={hintId} className={[styles.formHint, hasError ? styles.formHintError : ''].filter(Boolean).join(' ')}>{hintText}</span>}
    </div>
  );
}

export default Input;

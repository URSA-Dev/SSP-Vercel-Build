import React from 'react';
import styles from './WizardStrip.module.css';

function WizardStrip({ steps = [], currentStep = 0, onStepClick }) {
  return (
    <div className={styles.wizardStrip}>
      {steps.map((step, i) => {
        const isActive = i === currentStep;
        const isDone = i < currentStep;
        const isFuture = i > currentStep;
        const stepClasses = [
          styles.wzStep,
          isActive ? styles.wzActive : '',
          isDone ? styles.wzDone : '',
        ].filter(Boolean).join(' ');

        return (
          <React.Fragment key={i}>
            {i > 0 && <div className={styles.wzConnector} />}
            <button
              className={stepClasses}
              onClick={() => onStepClick?.(i)}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Step ${i + 1}: ${step.label}${isDone ? ' (completed)' : isActive ? ' (current)' : ''}`}
              aria-disabled={isFuture ? 'true' : undefined}
            >
              <span className={styles.wzNum}>{isDone ? '\u2713' : i + 1}</span>
              {step.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default WizardStrip;

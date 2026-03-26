import React, { useEffect, useRef, useId } from 'react';
import styles from './Modal.module.css';

function Modal({ isOpen, onClose, title, subtitle, size, footer, children }) {
  const modalRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    const previouslyFocused = document.activeElement;

    const focusableSelectors = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusableElements = modal.querySelectorAll(focusableSelectors);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    firstFocusable?.focus();

    function handleTab(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    }

    modal.addEventListener('keydown', handleTab);
    return () => {
      modal.removeEventListener('keydown', handleTab);
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalClasses = [
    styles.modal,
    size ? styles[size] : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div ref={modalRef} className={modalClasses} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={styles.modalHead}>
          <div className={styles.modalHeadText}>
            <h3 id={titleId}>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className={styles.modalBody}>{children}</div>
        {footer && <div className={styles.modalFoot}>{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;

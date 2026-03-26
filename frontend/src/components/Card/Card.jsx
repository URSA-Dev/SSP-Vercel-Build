import React from 'react';
import styles from './Card.module.css';

function Card({ children, className = '' }) {
  return (
    <div className={[styles.card, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

function CardHead({ children, className = '' }) {
  return (
    <div className={[styles.cardHead, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

function CardTitle({ children, className = '' }) {
  return (
    <div className={[styles.cardTitle, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

function CardBody({ children, className = '' }) {
  return (
    <div className={[styles.cardBody, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

export { Card, CardHead, CardTitle, CardBody };
export default Card;

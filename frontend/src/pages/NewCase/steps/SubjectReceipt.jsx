import { useState } from 'react';
import Alert from '../../../components/Alert/Alert';
import Button from '../../../components/Button/Button';
import Input from '../../../components/FormControls/Input';
import Textarea from '../../../components/FormControls/Textarea';
import FormGrid from '../../../components/FormControls/FormGrid';
import styles from '../NewCase.module.css';

function SubjectReceipt({ data, onChange, onNext, onCancel }) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  function handleBlur(field) {
    setTouched(t => ({ ...t, [field]: true }));
  }

  const showError = (field) => touched[field] && !data[field]?.trim();

  function validate() {
    const errs = {};
    if (!data.subjectLastName.trim()) errs.subjectLastName = 'Last name is required';
    if (!data.subjectFirstInitial.trim()) errs.subjectFirstInitial = 'First initial is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validate()) onNext();
  }

  return (
    <div className={styles.stepCard}>
      <div className={styles.sectionTitle}>Step 1 — Subject &amp; Case Receipt</div>

      <Alert variant="blue" icon="&#8505;" title="Minimal PII Policy">
        This system stores <strong>minimal PII</strong>. Enter last name and first initial only.
        No SSNs, full names, or dates of birth.
      </Alert>

      <div className={styles.formSection}>
        <FormGrid columns={2}>
          <Input
            label="Subject Last Name"
            required
            value={data.subjectLastName}
            onChange={(e) => onChange('subjectLastName', e.target.value)}
            onBlur={() => handleBlur('subjectLastName')}
            placeholder="Last name only"
            error={showError('subjectLastName') ? 'Last name is required' : undefined}
            hint={errors.subjectLastName}
          />
          <Input
            label="First Initial"
            required
            value={data.subjectFirstInitial}
            onChange={(e) => onChange('subjectFirstInitial', e.target.value.toUpperCase().slice(0, 1))}
            onBlur={() => handleBlur('subjectFirstInitial')}
            placeholder="A"
            maxLength={1}
            style={{ maxWidth: 90, textTransform: 'uppercase' }}
            error={showError('subjectFirstInitial') ? 'First initial is required' : undefined}
            hint="One letter only"
          />
        </FormGrid>
      </div>

      <div className={styles.formSection}>
        <Input
          label="Date Materials Received"
          type="date"
          required
          value={data.receivedDate}
          onChange={(e) => onChange('receivedDate', e.target.value)}
          style={{ maxWidth: 240 }}
        />
      </div>

      <Textarea
        label="Initial Notes (Internal Only)"
        value={data.notes}
        onChange={(e) => onChange('notes', e.target.value)}
        placeholder="Any initial context about this intake…"
        rows={3}
      />

      <div className={styles.navRow}>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={handleNext}>Continue &rarr; Case Type</Button>
      </div>
    </div>
  );
}

export default SubjectReceipt;

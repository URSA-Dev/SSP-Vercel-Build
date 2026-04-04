import { useState, useEffect, useRef } from 'react';
import Alert from '../../../components/Alert/Alert';
import Button from '../../../components/Button/Button';
import Input from '../../../components/FormControls/Input';
import Textarea from '../../../components/FormControls/Textarea';
import FormGrid from '../../../components/FormControls/FormGrid';
import { searchSubjects } from '../../../services/subjects.service';
import styles from '../NewCase.module.css';

function SubjectReceipt({ data, onChange, onNext, onCancel }) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [subjectMatch, setSubjectMatch] = useState(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  // Debounced subject lookup when key identifiers change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const lastName = data.subjectLastName?.trim();
    const firstInit = data.subjectFirstInitial?.trim();

    if (!lastName || !firstInit) {
      setSubjectMatch(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchSubjects({
          lastName,
          init: firstInit,
          middleInit: data.middleInitial?.trim() || undefined,
          dobYear: data.dobYear || undefined,
        });
        if (results.length > 0) {
          const match = results[0];
          setSubjectMatch(match);
          onChange('subjectId', match.id);
        } else {
          setSubjectMatch(null);
          onChange('subjectId', null);
        }
      } catch {
        setSubjectMatch(null);
      }
      setSearching(false);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [data.subjectLastName, data.subjectFirstInitial, data.middleInitial, data.dobYear]);

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
        This system stores <strong>minimal PII</strong>. Enter last name, initials, and optional
        identifiers only. No SSNs, full names, or full dates of birth.
      </Alert>

      <div className={styles.formSection}>
        <FormGrid columns={3}>
          <Input
            label="Subject Last Name"
            required
            value={data.subjectLastName}
            onChange={(e) => onChange('subjectLastName', e.target.value)}
            onBlur={() => handleBlur('subjectLastName')}
            placeholder="Last name only"
            error={showError('subjectLastName') ? 'Last name is required' : undefined}
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
          <Input
            label="Middle Initial"
            value={data.middleInitial}
            onChange={(e) => onChange('middleInitial', e.target.value.toUpperCase().slice(0, 1))}
            placeholder="M"
            maxLength={1}
            style={{ maxWidth: 90, textTransform: 'uppercase' }}
            hint="Optional"
          />
        </FormGrid>
      </div>

      <div className={styles.formSection}>
        <FormGrid columns={3}>
          <Input
            label="DOB Year"
            type="number"
            value={data.dobYear}
            onChange={(e) => onChange('dobYear', e.target.value ? parseInt(e.target.value, 10) : '')}
            placeholder="1990"
            min={1900}
            max={new Date().getFullYear()}
            style={{ maxWidth: 120 }}
            hint="Year only — no full DOB"
          />
          <Input
            label="Case ID"
            value={subjectMatch?.case_id || 'Auto-generated'}
            readOnly
            disabled
            hint="System-generated on creation"
          />
          <Input
            label="Date Materials Received"
            type="date"
            required
            value={data.receivedDate}
            onChange={(e) => onChange('receivedDate', e.target.value)}
            style={{ maxWidth: 240 }}
          />
        </FormGrid>
      </div>

      {subjectMatch && (
        <Alert variant="olive" icon="&#128101;" title="Existing Subject Found">
          <strong>{subjectMatch.subject_last}, {subjectMatch.subject_init}.</strong>
          {subjectMatch.middle_init && ` ${subjectMatch.middle_init}.`}
          {subjectMatch.case_id && ` — Case ID: ${subjectMatch.case_id}`}
          <br />
          This subject has <strong>{subjectMatch.case_count}</strong> existing case(s).
          The new case will be linked to this subject record.
        </Alert>
      )}

      {!subjectMatch && data.subjectLastName?.trim() && data.subjectFirstInitial?.trim() && !searching && (
        <Alert variant="blue" icon="&#43;" title="New Subject">
          No existing subject found. A new subject record will be created on case submission.
        </Alert>
      )}

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

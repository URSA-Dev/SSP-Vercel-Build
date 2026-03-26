import { useState } from 'react';
import Alert from '../../../components/Alert/Alert';
import Button from '../../../components/Button/Button';
import Input from '../../../components/FormControls/Input';
import Textarea from '../../../components/FormControls/Textarea';
import FormGrid from '../../../components/FormControls/FormGrid';

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
    <div>
      <Alert variant="blue" icon="&#128274;" title="Minimal PII Policy">
        Enter only the subject's last name and first initial. Do not enter full names,
        SSNs, or other personally identifiable information in this form.
      </Alert>

      <FormGrid columns={2}>
        <Input
          label="Last Name"
          required
          value={data.subjectLastName}
          onChange={(e) => onChange('subjectLastName', e.target.value)}
          onBlur={() => handleBlur('subjectLastName')}
          placeholder="e.g. Anderson"
          error={showError('subjectLastName') ? 'Last name is required' : undefined}
          hint={errors.subjectLastName}
        />
        <Input
          label="First Initial"
          required
          value={data.subjectFirstInitial}
          onChange={(e) => onChange('subjectFirstInitial', e.target.value.toUpperCase().slice(0, 1))}
          onBlur={() => handleBlur('subjectFirstInitial')}
          placeholder="e.g. R"
          maxLength={1}
          error={showError('subjectFirstInitial') ? 'First initial is required' : undefined}
          hint={errors.subjectFirstInitial}
        />
      </FormGrid>

      <FormGrid columns={2}>
        <Input
          label="Date Materials Received"
          type="date"
          value={data.receivedDate}
          onChange={(e) => onChange('receivedDate', e.target.value)}
        />
        <div />
      </FormGrid>

      <Textarea
        label="Initial Notes"
        value={data.notes}
        onChange={(e) => onChange('notes', e.target.value)}
        placeholder="Optional notes about the intake..."
        rows={3}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border, #e5e7eb)' }}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={handleNext}>Continue &rarr;</Button>
      </div>
    </div>
  );
}

export default SubjectReceipt;

import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import Alert from '../Alert/Alert';
import Input from '../FormControls/Input';
import Select from '../FormControls/Select';
import Textarea from '../FormControls/Textarea';
import FormGrid from '../FormControls/FormGrid';
import { COMM_TYPES, COMM_DIRECTIONS } from '../../utils/constants';

const CLOCK_OPTIONS = [
  { value: 'NO_EFFECT', label: 'No Effect' },
  { value: 'STOPS_48HR', label: 'Stops 48-hr Clock' },
  { value: 'STARTS_CLOCK', label: 'Starts Clock' },
];

function LogCommModal({ isOpen, onClose, onSubmit, preselectedType }) {
  const [form, setForm] = useState({
    type: '',
    direction: '',
    subject: '',
    summary: '',
    clockEffect: 'NO_EFFECT',
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        type: preselectedType || '',
        direction: '',
        subject: '',
        summary: '',
        clockEffect: preselectedType === 'INITIAL_NOTIFICATION' ? 'STARTS_CLOCK' : 'NO_EFFECT',
      });
    }
  }, [isOpen, preselectedType]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const typeOptions = COMM_TYPES.map((t) => ({
    value: t,
    label: t.replace(/_/g, ' '),
  }));

  const directionOptions = COMM_DIRECTIONS.map((d) => ({
    value: d,
    label: d,
  }));

  const isValid = form.type && form.direction && form.subject.trim() && form.summary.trim();

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit?.(form);
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" disabled={!isValid} onClick={handleSubmit}>Log Communication</Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Communication"
      subtitle="Record a communication event for this case"
      footer={footer}
    >
      {form.type === 'INITIAL_NOTIFICATION' && (
        <Alert variant="amber" icon="!" title="48-Hour Notification">
          Initial notification starts the 48-hour suspense clock. Ensure all required parties are notified.
        </Alert>
      )}

      <FormGrid columns={2}>
        <Select
          label="Communication Type"
          required
          value={form.type}
          onChange={set('type')}
          options={typeOptions}
        />
        <Select
          label="Direction"
          required
          value={form.direction}
          onChange={set('direction')}
          options={directionOptions}
        />
      </FormGrid>

      <Input
        label="Subject"
        required
        value={form.subject}
        onChange={set('subject')}
        placeholder="Communication subject line"
      />

      <Textarea
        label="Summary"
        required
        value={form.summary}
        onChange={set('summary')}
        placeholder="Describe the communication..."
        rows={4}
      />

      <Select
        label="Suspense Clock Effect"
        value={form.clockEffect}
        onChange={set('clockEffect')}
        options={CLOCK_OPTIONS}
      />
    </Modal>
  );
}

export default LogCommModal;

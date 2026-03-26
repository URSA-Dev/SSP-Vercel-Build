import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import Alert from '../Alert/Alert';
import Input from '../FormControls/Input';
import Select from '../FormControls/Select';
import Textarea from '../FormControls/Textarea';
import FormGrid from '../FormControls/FormGrid';
import { ISSUE_CATEGORIES, SEVERITIES, MITIGATION_TYPES } from '../../utils/constants';

const GUIDELINE_REFS = {
  A: 'SEAD 4, Guideline A — Conditions that could raise concerns include acts of sabotage, espionage, treason, or sedition.',
  B: 'SEAD 4, Guideline B — Contact with foreign family members, business associates, or government officials who could create a risk of foreign influence.',
  C: 'SEAD 4, Guideline C — Preference for a foreign country demonstrated through actions such as possession of foreign passport or foreign military service.',
  D: 'SEAD 4, Guideline D — Sexual behavior that involves a criminal offense, reflects lack of judgment, or may subject the individual to coercion.',
  E: 'SEAD 4, Guideline E — Conduct involving dishonesty, rule violations, or other behavior indicating questionable judgment or trustworthiness.',
  F: 'SEAD 4, Guideline F — Failure to meet financial obligations, unexplained affluence, or financial irresponsibility.',
  G: 'SEAD 4, Guideline G — Excessive alcohol consumption leading to questionable judgment or failure to control impulses.',
  H: 'SEAD 4, Guideline H — Use of illegal drugs, misuse of prescription drugs, or diagnosis of substance use disorder.',
  I: 'SEAD 4, Guideline I — Certain psychological conditions that may impair judgment, reliability, or trustworthiness.',
  J: 'SEAD 4, Guideline J — Criminal conduct that creates doubt about judgment, reliability, and trustworthiness.',
  K: 'SEAD 4, Guideline K — Deliberate or negligent failure to comply with rules for protecting classified or sensitive information.',
  L: 'SEAD 4, Guideline L — Involvement in certain types of outside employment or activities that pose a conflict with security responsibilities.',
  M: 'SEAD 4, Guideline M — Misuse of information technology systems, including unauthorized access or modifications.',
};

const INITIAL_STATE = {
  category: '',
  severity: '',
  subcategory: '',
  guideline: '',
  description: '',
  mitigatingFactors: '',
  mitigationType: '',
  includeInMemo: 'Yes',
};

function AddIssueModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(INITIAL_STATE);

  useEffect(() => {
    if (isOpen) setForm(INITIAL_STATE);
  }, [isOpen]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const selectedCategory = ISSUE_CATEGORIES.find((c) => c.code === form.category);

  useEffect(() => {
    if (form.category && form.category !== 'OTHER') {
      const cat = ISSUE_CATEGORIES.find((c) => c.code === form.category);
      if (cat) {
        setForm((prev) => ({ ...prev, guideline: `Guideline ${cat.code} — ${cat.label}` }));
      }
    }
  }, [form.category]);

  const categoryOptions = [
    ...ISSUE_CATEGORIES.map((c) => ({ value: c.code, label: `${c.code} — ${c.label}` })),
    { value: 'OTHER', label: 'Other' },
  ];

  const severityOptions = SEVERITIES.map((s) => ({ value: s, label: s }));

  const mitigationOptions = MITIGATION_TYPES.map((m) => ({
    value: m,
    label: m.replace(/_/g, ' '),
  }));

  const memoOptions = [
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' },
  ];

  const isValid = form.category && form.severity && form.description.trim();

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit?.({
      ...form,
      categoryLabel: selectedCategory?.label || 'Other',
    });
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" disabled={!isValid} onClick={handleSubmit}>Add Issue</Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Adjudicative Issue"
      subtitle="Identify and classify a security concern for this case"
      size="lg"
      footer={footer}
    >
      <FormGrid columns={2}>
        <Select
          label="Issue Category"
          required
          value={form.category}
          onChange={set('category')}
          options={categoryOptions}
        />
        <Select
          label="Risk Severity"
          required
          value={form.severity}
          onChange={set('severity')}
          options={severityOptions}
        />
      </FormGrid>

      {form.category && form.category !== 'OTHER' && GUIDELINE_REFS[form.category] && (
        <Alert variant="blue" icon="i" title="Guideline Reference">
          {GUIDELINE_REFS[form.category]}
        </Alert>
      )}

      <FormGrid columns={2}>
        <Input
          label="Subcategory"
          value={form.subcategory}
          onChange={set('subcategory')}
          placeholder="e.g., Delinquent Debts"
        />
        <Input
          label="Guideline"
          value={form.guideline}
          onChange={set('guideline')}
          placeholder="Auto-populated from category"
        />
      </FormGrid>

      <Textarea
        label="Description"
        required
        value={form.description}
        onChange={set('description')}
        placeholder="Describe the adjudicative issue..."
        rows={4}
      />

      <Textarea
        label="Mitigating Factors"
        value={form.mitigatingFactors}
        onChange={set('mitigatingFactors')}
        placeholder="Any mitigating circumstances..."
        rows={3}
      />

      <FormGrid columns={2}>
        <Select
          label="Mitigation Type"
          value={form.mitigationType}
          onChange={set('mitigationType')}
          options={mitigationOptions}
        />
        <Select
          label="Include in Memo?"
          value={form.includeInMemo}
          onChange={set('includeInMemo')}
          options={memoOptions}
        />
      </FormGrid>
    </Modal>
  );
}

export default AddIssueModal;

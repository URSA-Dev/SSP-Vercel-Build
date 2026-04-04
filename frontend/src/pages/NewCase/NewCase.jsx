import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStrip from '../../components/WizardStrip/WizardStrip';
import { createCase } from '../../services/cases.service';
import SubjectReceipt from './steps/SubjectReceipt';
import InvestigationType from './steps/InvestigationType';
import PriorityAssignment from './steps/PriorityAssignment';
import ReviewCreate from './steps/ReviewCreate';
import styles from './NewCase.module.css';

const STEPS = [
  { label: 'Subject & Receipt' },
  { label: 'Case Type' },
  { label: 'Priority & Assignment' },
  { label: 'Review & Create' },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function NewCase() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    subjectLastName: '',
    subjectFirstInitial: '',
    middleInitial: '',
    dobYear: '',
    employeeId: '',
    subjectId: null,
    receivedDate: todayISO(),
    notes: '',
    caseType: '',
    caseSubtypes: [],
    priority: 'NORMAL',
    assignedTo: 'Smith, A.',
    assignmentNotes: '',
  });

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function next() {
    setStep((s) => Math.min(s + 1, 3));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function cancel() {
    navigate('/cases');
  }

  async function handleCreate() {
    const payload = {
      subjectLastName: formData.subjectLastName,
      subjectFirstInitial: formData.subjectFirstInitial.toUpperCase(),
      middleInitial: formData.middleInitial?.toUpperCase() || '',
      dobYear: formData.dobYear || null,
      employeeId: formData.employeeId || null,
      subjectId: formData.subjectId,
      subjectName: `${formData.subjectLastName}, ${formData.subjectFirstInitial.toUpperCase()}.`,
      caseType: formData.caseType,
      caseSubtypes: formData.caseSubtypes,
      priority: formData.priority,
      assignedTo: formData.assignedTo,
      receivedDate: new Date(formData.receivedDate).toISOString(),
      notes: formData.notes,
      assignmentNotes: formData.assignmentNotes,
    };

    const created = await createCase(payload);
    navigate(`/cases/${created.id}`);
  }

  const stepComponents = [
    <SubjectReceipt
      key="s1"
      data={formData}
      onChange={handleChange}
      onNext={next}
      onCancel={cancel}
    />,
    <InvestigationType
      key="s2"
      data={formData}
      onChange={handleChange}
      onNext={next}
      onBack={back}
    />,
    <PriorityAssignment
      key="s3"
      data={formData}
      onChange={handleChange}
      onNext={next}
      onBack={back}
    />,
    <ReviewCreate
      key="s4"
      data={formData}
      onBack={back}
      onCreate={handleCreate}
    />,
  ];

  return (
    <div className={styles.newCase}>
      <div className={styles.pageHeader}>
        <h1>New Case Intake</h1>
        <p className={styles.subtitle}>
          Complete each step to create the case. Suspense dates set automatically on creation.
        </p>
      </div>

      <div className={styles.wizardWrap}>
        <WizardStrip
          steps={STEPS}
          currentStep={step}
          onStepClick={(i) => {
            if (i < step) setStep(i);
          }}
        />
      </div>

      <div className={styles.stepContent}>
        {stepComponents[step]}
      </div>
    </div>
  );
}

export default NewCase;

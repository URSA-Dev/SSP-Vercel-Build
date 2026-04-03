import { useState, useEffect } from 'react';
import { saveMemo, submitForQA } from '../../../services/cases.service';
import { DISPOSITIONS } from '../../../utils/constants';
import { fmtDT } from '../../../utils/dates';
import Badge from '../../../components/Badge/Badge';
import Button from '../../../components/Button/Button';
import { Card, CardHead, CardTitle, CardBody } from '../../../components/Card/Card';
import { useToast } from '../../../components/Toast/toast-context';

const QA_CHECKLIST = [
  { key: 'subject', label: 'Subject information complete' },
  { key: 'caseType', label: 'Case type specified' },
  { key: 'hasIssue', label: 'At least one issue documented' },
  { key: 'issueQuality', label: 'All issues have severity and description' },
  { key: 'hasComm', label: 'At least one communication logged' },
  { key: 'hasMemo', label: 'Case memo written' },
  { key: 'memoLength', label: 'Memo has substantive content (100+ characters)' },
  { key: 'docsConfirmed', label: 'All documents confirmed' },
];

const MEMO_GUIDE = [
  'Identify the subject and case type.',
  'State the adjudicative guidelines at issue.',
  'Summarize disqualifying conditions with evidence.',
  'Address mitigating conditions for each guideline.',
  'Apply the whole-person concept.',
  'State the proposed disposition and rationale.',
];

function Memo({ caseData, onRefresh }) {
  const memo = caseData.memo;
  const issues = caseData.issues || [];
  const comms = caseData.comms || [];
  const docs = caseData.docs || [];
  const toast = useToast();

  const [memoText, setMemoText] = useState('');
  const [disposition, setDisposition] = useState('FAVORABLE');
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savingDisposition, setSavingDisposition] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [qaResult, setQaResult] = useState(null);
  const [qaChecks, setQaChecks] = useState({});

  useEffect(() => {
    if (memo) {
      const text = memo.sections
        ? memo.sections.map((s) => `## ${s.heading}\n\n${s.content}`).join('\n\n')
        : memo.summary || '';
      setMemoText(text);
      setDisposition(memo.disposition || caseData.disposition || 'FAVORABLE');
      setLastSaved(memo.updatedAt);
    }
    setSelectedIssues(issues.map((i) => i.id));
  }, [memo, issues]);

  function toggleIssue(issueId) {
    setSelectedIssues((prev) =>
      prev.includes(issueId)
        ? prev.filter((id) => id !== issueId)
        : [...prev, issueId]
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveMemo(caseData.id, {
        type: disposition === 'FAVORABLE' || disposition === 'FAVORABLE_WITH_COMMENT' ? 'MEMO_FAVORABLE' : 'MEMO_INTENT_DENY',
        title: `Memo \u2014 ${caseData.subjectName}`,
        status: 'DRAFT',
        disposition,
        summary: memoText.slice(0, 300),
        sections: [{ heading: 'Full Memo', content: memoText }],
      });
      setLastSaved(new Date().toISOString());
      await onRefresh();
      toast('Memo saved', 'success');
    } catch {
      toast('Failed to save memo', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDisposition() {
    setSavingDisposition(true);
    try {
      await saveMemo(caseData.id, { disposition });
      await onRefresh();
      toast('Disposition saved', 'success');
    } catch {
      toast('Failed to save disposition', 'error');
    } finally {
      setSavingDisposition(false);
    }
  }

  function handleGenerateAI() {
    const issueBlocks = issues
      .filter((i) => selectedIssues.includes(i.id))
      .map(
        (i) =>
          `## Guideline ${i.category} \u2014 ${i.categoryLabel}\n\n${i.description}\n\n` +
          (i.mitigations?.length
            ? 'Mitigating factors: ' + i.mitigations.map((m) => m.description).join('; ')
            : 'No mitigating factors identified.')
      );

    const draft = [
      `## Subject\n\n${caseData.subjectName} \u2014 ${caseData.caseType} Investigation`,
      ...issueBlocks,
      `## Whole-Person Analysis\n\nConsidering the totality of the evidence and applying the whole-person concept...`,
      `## Disposition\n\nBased on the foregoing analysis, the proposed disposition is: ${disposition}.`,
    ].join('\n\n');

    setMemoText(draft);
  }

  function handleQACheck() {
    const allDocsConfirmed = docs.length === 0 || docs.every((d) => d.status === 'confirmed');
    const allIssuesValid = issues.length > 0 && issues.every((i) => i.severity && i.description);

    const checks = {
      subject: !!(caseData.subjectName && caseData.subjectName.trim()),
      caseType: !!(caseData.caseType && caseData.caseType.trim()),
      hasIssue: issues.length > 0,
      issueQuality: allIssuesValid,
      hasComm: comms.length > 0,
      hasMemo: !!(memoText && memoText.trim()),
      memoLength: memoText.length >= 100,
      docsConfirmed: allDocsConfirmed,
    };

    const allPassed = Object.values(checks).every(Boolean);
    setQaChecks(checks);
    setQaResult(allPassed ? 'PASS' : 'FAIL');
    toast('QA check complete', 'info');
  }

  const canSubmitQA = caseData.status === 'MEMO_DRAFT';

  async function handleSubmitQA() {
    setSaving(true);
    try {
      await submitForQA(caseData.id);
      await onRefresh();
      toast('Submitted for QA review', 'success');
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Failed to submit for QA';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px' }}>
      {/* Left column — Memo editor */}
      <div>
        <Card>
          <CardBody>
            {/* Toolbar */}
            <div className="memo-toolbar flex aic gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
              <Button variant="outline" size="sm" onClick={handleGenerateAI}>
                Generate AI Draft
              </Button>
              <Button variant="outline" size="sm" onClick={handleQACheck}>
                QA Check
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
              {memo?.status && (
                <Badge
                  variant={
                    memo.status === 'QA_REVIEW'
                      ? 'violet'
                      : memo.status === 'DRAFT'
                        ? 'blue'
                        : 'green'
                  }
                >
                  {memo.status}
                </Badge>
              )}
              {memo?.v > 0 && (
                <Badge variant="gray">v{memo.v}</Badge>
              )}
            </div>

            {/* Required sections hint */}
            <div className="text-xs text-muted mb-2">
              Required sections: Subject, Guidelines at Issue, Disqualifying Conditions, Mitigating Conditions, Whole-Person Analysis, Disposition
            </div>

            {/* Textarea */}
            <div className="memo-wrap">
              <textarea
                className="memo-area"
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder="Begin drafting the adjudicative memo here, or click Generate AI Draft to start from a template..."
                style={{
                  width: '100%',
                  minHeight: '380px',
                  fontFamily: 'var(--mono)',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  padding: '16px',
                  border: '1px solid var(--bdr)',
                  borderRadius: 'var(--r-sm)',
                  resize: 'vertical',
                  background: 'var(--surface)',
                  color: 'var(--ink)',
                }}
              />
            </div>

            {/* Footer */}
            <div
              className="memo-footer text-xs text-muted mt-2"
              style={{ display: 'flex', justifyContent: 'space-between' }}
            >
              <span>{memoText.length} characters</span>
              <span>{lastSaved ? `Last saved: ${fmtDT(lastSaved)}` : 'Not yet saved'}</span>
            </div>

            {/* QA Check Results */}
            {qaResult && (
              <div className="mt-4">
                <Card>
                  <CardHead>
                    <CardTitle>QA Check Results</CardTitle>
                    <Badge variant={qaResult === 'PASS' ? 'green' : 'red'}>
                      {qaResult === 'PASS' ? 'PASSED' : 'NEEDS REVISION'}
                    </Badge>
                  </CardHead>
                  <CardBody>
                    <div className="flex fcol gap-2">
                      {QA_CHECKLIST.map((item) => {
                        const passed = qaChecks[item.key];
                        return (
                          <div key={item.key} className="flex aic gap-2" style={{ fontSize: '13px' }}>
                            <span style={{ color: passed ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                              {passed ? '\u2713' : '\u2717'}
                            </span>
                            <span style={{ color: passed ? 'var(--ink-3)' : 'var(--ink)' }}>
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {qaResult === 'PASS' && (
                      <div className="mt-3">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSubmitQA}
                          disabled={saving || !canSubmitQA}
                        >
                          {saving ? 'Submitting...' : 'Submit for QA Review'}
                        </Button>
                        {!canSubmitQA && (
                          <div className="text-xs text-muted mt-1">
                            Case must be in Memo Draft status to submit for QA.
                          </div>
                        )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Right column — Sidebar */}
      <div className="flex fcol gap-3">
        {/* Issues to include */}
        <Card>
          <CardHead>
            <CardTitle>Issues to Include</CardTitle>
          </CardHead>
          <CardBody>
            {issues.length === 0 ? (
              <div className="text-sm text-muted">No issues identified for this case.</div>
            ) : (
              <div className="flex fcol gap-2">
                {issues.map((issue) => (
                  <label
                    key={issue.id}
                    className="flex aic gap-2"
                    style={{ fontSize: '13px', cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIssues.includes(issue.id)}
                      onChange={() => toggleIssue(issue.id)}
                    />
                    <span>
                      Guideline {issue.category} &mdash; {issue.categoryLabel || issue.categoryName}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Disposition */}
        <Card>
          <CardHead>
            <CardTitle>Proposed Disposition</CardTitle>
          </CardHead>
          <CardBody>
            <select
              value={disposition}
              onChange={(e) => setDisposition(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--bdr)',
                fontSize: '13px',
                fontFamily: 'var(--sans)',
              }}
            >
              {DISPOSITIONS.map((d) => (
                <option key={d} value={d}>
                  {d.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDisposition}
              disabled={savingDisposition}
              style={{ marginTop: 8, width: '100%' }}
            >
              {savingDisposition ? 'Saving...' : 'Save Disposition'}
            </Button>
          </CardBody>
        </Card>

        {/* Memo Guide */}
        <Card>
          <CardHead>
            <CardTitle>Memo Guide</CardTitle>
          </CardHead>
          <CardBody>
            <ol style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--ink-3)' }}>
              {MEMO_GUIDE.map((step, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  {step}
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default Memo;

import { useState, useEffect } from 'react';
import { addCommunication } from '../../../services/cases.service';
import { COMM_TYPES, COMM_DIRECTIONS } from '../../../utils/constants';
import { fmtDT } from '../../../utils/dates';
import Badge from '../../../components/Badge/Badge';
import Button from '../../../components/Button/Button';
import { Card, CardHead, CardTitle, CardBody } from '../../../components/Card/Card';
import Alert from '../../../components/Alert/Alert';
import EmptyState from '../../../components/EmptyState/EmptyState';
import { useToast } from '../../../components/Toast/toast-context';

const DIRECTION_VARIANT = {
  Outbound: 'blue',
  Inbound: 'green',
  Internal: 'gray',
};

const TYPE_VARIANT = {
  INITIAL_NOTIFICATION: 'blue',
  STATUS_UPDATE: 'blue',
  INFORMATION_REQUEST: 'amber',
  INFORMATION_RESPONSE: 'green',
  MEMO_TRANSMISSION: 'violet',
  ESCALATION_NOTICE: 'red',
  INTERNAL_NOTE: 'gray',
  OTHER: 'gray',
};

const SUSPENSE_EFFECTS = ['No Effect', 'Stops Suspense', 'Starts Clock'];

function typeLabel(type) {
  return (type || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function Communications({ caseData, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'STATUS_UPDATE',
    direction: 'Outbound',
    subject: '',
    body: '',
    suspenseEffect: 'No Effect',
  });
  const toast = useToast();

  const comms = caseData.comms || [];
  const sorted = [...comms].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  const has48hr = comms.some(
    (c) => c.type === 'INITIAL_NOTIFICATION' || c.type === '48HR_NOTIFICATION'
  );

  /* Auto-set suspense effect when type changes */
  useEffect(() => {
    if (form.type === 'INITIAL_NOTIFICATION') {
      setForm((prev) => ({ ...prev, suspenseEffect: 'Stops Suspense' }));
    }
  }, [form.type]);

  function deriveSuspenseEffect(comm) {
    if (comm.suspenseEffect) return comm.suspenseEffect;
    if (comm.type === 'INITIAL_NOTIFICATION' || comm.type === '48HR_NOTIFICATION') {
      return 'Stops Suspense';
    }
    return null;
  }

  function handleLog48hr() {
    setForm({
      type: 'INITIAL_NOTIFICATION',
      direction: 'Outbound',
      subject: '48-Hour Notification — ' + (caseData.subjectName || ''),
      body: '',
      suspenseEffect: 'Stops Suspense',
    });
    setShowForm(true);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.subject.trim()) return;
    setSaving(true);
    try {
      await addCommunication(caseData.id, {
        type: form.type,
        direction: form.direction,
        subject: form.subject.trim(),
        body: form.body.trim(),
        suspenseEffect: form.suspenseEffect,
      });
      setForm({ type: 'STATUS_UPDATE', direction: 'Outbound', subject: '', body: '', suspenseEffect: 'No Effect' });
      setShowForm(false);
      await onRefresh();
      toast('Communication logged', 'success');
    } catch {
      toast('Failed to log communication', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex jb aic mb-3">
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink-2)' }}>
          Communications ({comms.length})
        </h3>
        <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Log Communication'}
        </Button>
      </div>

      {/* 48-hr alert */}
      {!has48hr && (
        <Alert variant="amber" icon="&#9888;" title="48-Hour Notification Not Sent">
          The mandatory 48-hour notification has not been logged.{' '}
          <Button
            variant="amber"
            size="xs"
            onClick={handleLog48hr}
            style={{ marginLeft: 8 }}
          >
            Log 48-hr Notification Now
          </Button>
        </Alert>
      )}

      {/* Log form */}
      {showForm && (
        <Card className="mb-3 mt-3">
          <CardHead>
            <CardTitle>Log Communication</CardTitle>
          </CardHead>
          <CardBody>
            <form onSubmit={handleAdd} className="flex fcol gap-3">
              <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <label className="text-sm fw-6" style={{ display: 'block', marginBottom: 4 }}>
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--r-sm)',
                      border: '1px solid var(--bdr)',
                      fontSize: '13px',
                      fontFamily: 'var(--sans)',
                    }}
                  >
                    {COMM_TYPES.map((t) => (
                      <option key={t} value={t}>{typeLabel(t)}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 0, minWidth: 140 }}>
                  <label className="text-sm fw-6" style={{ display: 'block', marginBottom: 4 }}>
                    Direction
                  </label>
                  <select
                    value={form.direction}
                    onChange={(e) => setForm({ ...form, direction: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--r-sm)',
                      border: '1px solid var(--bdr)',
                      fontSize: '13px',
                      fontFamily: 'var(--sans)',
                    }}
                  >
                    {COMM_DIRECTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 0, minWidth: 160 }}>
                  <label className="text-sm fw-6" style={{ display: 'block', marginBottom: 4 }}>
                    Suspense Clock Effect
                  </label>
                  <select
                    value={form.suspenseEffect}
                    onChange={(e) => setForm({ ...form, suspenseEffect: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--r-sm)',
                      border: '1px solid var(--bdr)',
                      fontSize: '13px',
                      fontFamily: 'var(--sans)',
                    }}
                  >
                    {SUSPENSE_EFFECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm fw-6" style={{ display: 'block', marginBottom: 4 }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Communication subject..."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--r-sm)',
                    border: '1px solid var(--bdr)',
                    fontSize: '13px',
                    fontFamily: 'var(--sans)',
                  }}
                />
              </div>
              <div>
                <label className="text-sm fw-6" style={{ display: 'block', marginBottom: 4 }}>
                  Body
                </label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={3}
                  placeholder="Communication details..."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--r-sm)',
                    border: '1px solid var(--bdr)',
                    fontSize: '13px',
                    fontFamily: 'var(--sans)',
                    resize: 'vertical',
                  }}
                />
              </div>
              <div className="flex je">
                <Button variant="primary" size="sm" type="submit" disabled={saving}>
                  {saving ? 'Logging...' : 'Log Communication'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Communication cards */}
      {sorted.length === 0 && !showForm ? (
        <EmptyState
          icon={"\uD83D\uDCE8"}
          title="No communications logged"
          subtitle="Log communications to track correspondence for this case."
        />
      ) : (
        <div className="flex fcol gap-3 mt-3">
          {sorted.map((comm) => {
            const effect = deriveSuspenseEffect(comm);
            return (
              <Card key={comm.id}>
                <CardBody>
                  <div className="flex jb aic" style={{ flexWrap: 'wrap', gap: '8px', marginBottom: 8 }}>
                    <div className="flex aic gap-2">
                      <Badge variant={DIRECTION_VARIANT[comm.direction] || 'gray'}>
                        {comm.direction}
                      </Badge>
                      <Badge variant={TYPE_VARIANT[comm.type] || 'gray'}>
                        {typeLabel(comm.type)}
                      </Badge>
                      {effect && effect !== 'No Effect' && (
                        <Badge variant="teal">{effect}</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted">{fmtDT(comm.timestamp)}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)', marginBottom: 4 }}>
                    {comm.subject}
                  </div>
                  {comm.body && (
                    <div style={{ fontSize: '13px', color: 'var(--ink-3)', lineHeight: 1.5 }}>
                      {comm.body}
                    </div>
                  )}
                  <div className="text-xs text-muted mt-2">
                    Logged by: {comm.author}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Communications;

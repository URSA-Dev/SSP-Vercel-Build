import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getPolicy, createPolicy, updatePolicy } from '../../services/policies.service';
import Button from '../../components/Button/Button';
import { Card, CardHead, CardTitle, CardBody } from '../../components/Card/Card';
import Alert from '../../components/Alert/Alert';
import { Skeleton } from '../../components/Skeleton/Skeleton';
import styles from './PolicyEditor.module.css';

const CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];

function PolicyEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [form, setForm] = useState({
    title: '',
    category: '',
    summary: '',
    content: '',
  });
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editId) {
      setLoading(true);
      getPolicy(editId)
        .then((p) => {
          setForm({
            title: p.title || '',
            category: p.category || '',
            summary: p.summary || '',
            content: p.content || '',
          });
        })
        .catch((err) => setError(err.message || 'Failed to load policy'))
        .finally(() => setLoading(false));
    }
  }, [editId]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSaving(true);
    setError(null);
    try {
      if (editId) {
        await updatePolicy(editId, form);
      } else {
        await createPolicy(form);
      }
      navigate('/policies');
    } catch (err) {
      setError(err.message || 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <Skeleton width="240px" height="28px" borderRadius="8px" />
        <Skeleton width="100%" height="400px" borderRadius="var(--r-lg)" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className="page-title">{editId ? 'Edit Policy' : 'New Policy'}</div>
          <div className="page-sub">
            {editId ? 'Modify an existing policy document' : 'Create a new policy document'}
          </div>
        </div>
        <Button variant="ghost" onClick={() => navigate('/policies')}>
          &larr; Back to Policies
        </Button>
      </div>

      {error && (
        <Alert variant="red" icon="&#9888;" title="Error">{error}</Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHead>
            <CardTitle>Policy Details</CardTitle>
          </CardHead>
          <CardBody>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="title">
                  Title <span className={styles.required}>*</span>
                </label>
                <input
                  id="title"
                  className={styles.input}
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g., Guideline F — Financial Considerations"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="category">Category</label>
                <select
                  id="category"
                  className={styles.select}
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>Guideline {c}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="summary">Summary</label>
                <textarea
                  id="summary"
                  className={styles.textarea}
                  value={form.summary}
                  onChange={(e) => updateField('summary', e.target.value)}
                  placeholder="Brief description of the policy scope and purpose"
                  rows={3}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="content">Policy Content</label>
                <textarea
                  id="content"
                  className={`${styles.textarea} ${styles.contentArea}`}
                  value={form.content}
                  onChange={(e) => updateField('content', e.target.value)}
                  placeholder="Full policy text..."
                  rows={12}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <div className={styles.actions}>
          <Button variant="ghost" type="button" onClick={() => navigate('/policies')}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={saving || !form.title.trim()}>
            {saving ? 'Saving\u2026' : editId ? 'Update Policy' : 'Create Policy'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default PolicyEditor;

import { useState } from 'react';
import { addIssue, deleteIssue } from '../../../services/cases.service';
import { ISSUE_CATEGORIES } from '../../../utils/constants';
import Button from '../../../components/Button/Button';
import IssueCard from '../../../components/IssueCard/IssueCard';
import EmptyState from '../../../components/EmptyState/EmptyState';
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog';
import AddIssueModal from '../../../components/modals/AddIssueModal';
import { useToast } from '../../../components/Toast/toast-context';

function Issues({ caseData, onRefresh }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const issues = caseData.issues || [];

  async function handleDelete(issueId) {
    setConfirmDelete(issueId);
  }

  async function executeDelete() {
    const issueId = confirmDelete;
    setConfirmDelete(null);
    setDeleting(issueId);
    try {
      await deleteIssue(caseData.id, issueId);
      await onRefresh();
      toast('Issue deleted', 'success');
    } catch {
      toast('Failed to delete issue', 'error');
    } finally {
      setDeleting(null);
    }
  }

  async function handleAddFromModal(formData) {
    setSaving(true);
    try {
      const cat = ISSUE_CATEGORIES.find((c) => c.code === formData.category);
      await addIssue(caseData.id, {
        category: formData.category,
        categoryName: cat?.name || formData.category,
        categoryLabel: formData.categoryLabel || cat?.label || formData.category,
        subcategory: formData.subcategory || '',
        guideline: formData.guideline || '',
        severity: formData.severity,
        description: formData.description.trim(),
        mitigationType: formData.mitigationType || '',
        inMemo: formData.includeInMemo === 'Yes',
        mitigations: formData.mitigatingFactors
          ? [{ id: '_mit_' + Date.now(), type: formData.mitigationType || '', description: formData.mitigatingFactors, date: new Date().toISOString().slice(0, 10) }]
          : [],
      });
      setModalOpen(false);
      await onRefresh();
      toast('Issue added successfully', 'success');
    } catch {
      toast('Failed to add issue', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex jb aic mb-3">
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink-2)' }}>
          Adjudicative Issues ({issues.length})
        </h3>
        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
          Add Issue
        </Button>
      </div>

      {issues.length === 0 ? (
        <EmptyState
          icon={"\u26A0\uFE0F"}
          title="No issues identified"
          subtitle="Add adjudicative issues found during case review."
        />
      ) : (
        <div className="flex fcol gap-3">
          {issues.map((issue) => {
            const cat = ISSUE_CATEGORIES.find((c) => c.code === issue.category);
            const mitigationText = issue.mitigations?.length
              ? issue.mitigations.map((m) => m.description).join(' ')
              : null;

            return (
              <IssueCard
                key={issue.id}
                category={issue.categoryLabel || cat?.label || issue.category}
                subcategory={issue.subcategory || `Guideline ${issue.category}`}
                severity={issue.severity}
                guideline={issue.guideline || cat?.label}
                description={issue.description}
                mitigation={mitigationText}
                inMemo={issue.inMemo ?? true}
                onDelete={() => handleDelete(issue.id)}
              />
            );
          })}
        </div>
      )}

      <AddIssueModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddFromModal}
      />

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={executeDelete}
        title="Delete Issue"
        message="Are you sure you want to delete this adjudicative issue? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={!!deleting}
      />
    </div>
  );
}

export default Issues;

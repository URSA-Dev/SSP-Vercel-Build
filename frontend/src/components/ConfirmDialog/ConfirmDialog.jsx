import Modal from '../Modal/Modal';
import Button from '../Button/Button';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', confirmVariant = 'danger', loading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="default"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : confirmLabel}
          </Button>
        </>
      }>
      <p style={{ fontSize: '14px', color: 'var(--ink-3)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}

import React from 'react';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';

function NotificationsModal({ isOpen, onClose, notifications = [], onClear, onNotificationClick }) {
  const hasNotifications = notifications.length > 0;

  const footer = (
    <>
      {hasNotifications && (
        <Button variant="danger" size="sm" onClick={onClear}>Clear All</Button>
      )}
      <div style={{ flex: 1 }} />
      <Button variant="ghost" onClick={onClose}>Close</Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notifications"
      subtitle={hasNotifications ? `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}` : undefined}
      footer={footer}
    >
      {!hasNotifications ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--ink-light, #6b7280)',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>&#128276;</div>
          <div style={{ fontSize: '15px', fontWeight: 500 }}>No notifications</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>You're all caught up.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifications.map((n, i) => (
            <div
              key={n.id || i}
              onClick={() => onNotificationClick?.(n)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNotificationClick?.(n); }}
              style={{
                padding: '12px 16px',
                background: n.read ? 'var(--surface, #f9fafb)' : 'rgba(74, 92, 47, 0.06)',
                border: '1px solid var(--border, #e5e7eb)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px',
              }}>
                <span style={{
                  fontWeight: n.read ? 400 : 600,
                  fontSize: '14px',
                  color: 'var(--ink, #1f2937)',
                }}>
                  {n.title || 'Notification'}
                </span>
                <span style={{
                  fontSize: '12px',
                  color: 'var(--ink-light, #6b7280)',
                  whiteSpace: 'nowrap',
                  marginLeft: '12px',
                }}>
                  {n.time || ''}
                </span>
              </div>
              {n.message && (
                <div style={{
                  fontSize: '13px',
                  color: 'var(--ink-light, #6b7280)',
                  lineHeight: '1.4',
                }}>
                  {n.message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default NotificationsModal;

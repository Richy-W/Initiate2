import React, { useMemo, useState } from 'react';
import '../../styles/pages.css';
import { CampaignNotification, CampaignMembership } from '../../types';
import campaignService from '../../services/campaignService';
import { useNotification } from '../../contexts/NotificationContext';
import { getUserFriendlyErrorMessage } from '../../utils/errorHandling';

interface CampaignNotificationsProps {
  campaignId: string;
  notifications: CampaignNotification[];
  memberships: CampaignMembership[];
  isDM: boolean;
  onRefresh: () => Promise<void>;
}

const CampaignNotifications: React.FC<CampaignNotificationsProps> = ({
  campaignId,
  notifications,
  memberships,
  isDM,
  onRefresh,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState<CampaignNotification['notification_type']>('info');
  const [recipient, setRecipient] = useState('');
  const [sending, setSending] = useState(false);
  const { notifyError, notifySuccess } = useNotification();

  const activeMemberships = useMemo(
    () => memberships.filter((m) => m.status === 'active'),
    [memberships]
  );

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (notificationId: string) => {
    try {
      await campaignService.markNotificationRead(campaignId, notificationId);
      await onRefresh();
    } catch (error: unknown) {
      notifyError(getUserFriendlyErrorMessage(error, 'Failed to mark notification as read.'));
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !recipient) {
      return;
    }

    setSending(true);
    try {
      await campaignService.createNotification(campaignId, {
        recipient,
        notification_type: notificationType,
        title: title.trim(),
        message: message.trim(),
      });
      setTitle('');
      setMessage('');
      await onRefresh();
      notifySuccess('Campaign notification sent.');
    } catch (error: unknown) {
      notifyError(getUserFriendlyErrorMessage(error, 'Failed to send notification.'));
    } finally {
      setSending(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--app-bg-2)',
    border: '1px solid var(--app-border)',
    borderRadius: 7,
    padding: '7px 10px',
    fontSize: '0.85rem',
    color: 'var(--app-ink-0)',
    width: '100%',
  };

  return (
    <div className="pg-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="pg-card-title" style={{ margin: 0 }}>Campaign Notifications</p>
        <span className={`pg-badge ${unreadCount > 0 ? 'pg-badge--blue' : 'pg-badge--gray'}`}>
          {unreadCount} unread
        </span>
      </div>

      {isDM && (
        <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8 }}>
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            style={inputStyle}
            required
          >
            <option value="">Select recipient</option>
            {activeMemberships.map((membership) => (
              <option key={membership.id} value={membership.player}>
                {membership.player_username}
              </option>
            ))}
          </select>

          <select
            value={notificationType}
            onChange={(e) =>
              setNotificationType(e.target.value as CampaignNotification['notification_type'])
            }
            style={inputStyle}
          >
            <option value="info">Info</option>
            <option value="invite">Invite</option>
            <option value="join_request">Join Request</option>
            <option value="combat">Combat</option>
            <option value="session">Session</option>
          </select>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            style={inputStyle}
            required
          />

          <button type="submit" disabled={sending} className="pg-btn pg-btn--primary pg-btn--sm" style={{ whiteSpace: 'nowrap' }}>
            {sending ? 'Sending…' : 'Send'}
          </button>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message (optional)"
            style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }}
            rows={2}
          />
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
        {notifications.map((notification) => (
          <div
            key={notification.id}
            style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
              padding: '10px 14px',
              background: notification.is_read ? 'var(--app-bg-2)' : 'rgba(95,132,255,0.08)',
              border: `1px solid ${notification.is_read ? 'var(--app-border)' : 'rgba(95,132,255,0.3)'}`,
              borderRadius: 8,
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--app-ink-0)', fontSize: '0.875rem' }}>{notification.title}</p>
              {notification.message && (
                <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--app-ink-1)' }}>{notification.message}</p>
              )}
              <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: 'var(--app-ink-1)' }}>
                {notification.notification_type} &bull; {new Date(notification.created_at).toLocaleString()}
              </p>
            </div>
            {!notification.is_read && (
              <button
                onClick={() => handleMarkRead(notification.id)}
                className="pg-btn pg-btn--sm"
                style={{ flexShrink: 0, padding: '4px 10px' }}
              >
                Mark read
              </button>
            )}
          </div>
        ))}
        {notifications.length === 0 && (
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--app-ink-1)', padding: '8px 0' }}>No notifications yet.</p>
        )}
      </div>
    </div>
  );
};

export default CampaignNotifications;

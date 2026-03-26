import { useState, useEffect } from 'react';
import api, { USE_MOCK } from '../../services/api';
import Button from '../../components/Button/Button';
import { Card, CardHead, CardTitle, CardBody } from '../../components/Card/Card';
import Alert from '../../components/Alert/Alert';
import { Skeleton } from '../../components/Skeleton/Skeleton';
import styles from './Settings.module.css';

/* Mock settings */
const mockSettings = {
  tenant_name: { value: 'Department of War — Personnel Security', scope: 'tenant' },
  default_priority: { value: 'NORMAL', scope: 'tenant' },
  suspense_48hr_enabled: { value: true, scope: 'tenant' },
  suspense_3day_enabled: { value: true, scope: 'tenant' },
  ai_extraction_enabled: { value: true, scope: 'tenant' },
  email_notifications: { value: true, scope: 'user' },
  theme: { value: 'light', scope: 'user' },
  items_per_page: { value: 25, scope: 'user' },
};

function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      if (!USE_MOCK) {
        const { data } = await api.get('/settings');
        const entries = data.data || data;
        if (Array.isArray(entries)) {
          const map = {};
          entries.forEach((s) => { map[s.key] = { value: s.value, scope: s.scope }; });
          setSettings(map);
        } else {
          setSettings(entries || {});
        }
      } else {
        setSettings({ ...mockSettings });
      }
    } catch {
      setSettings({ ...mockSettings });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function updateSetting(key, value) {
    setSettings((prev) => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (!USE_MOCK) {
        for (const [key, { value }] of Object.entries(settings)) {
          await api.put(`/settings/${key}`, { value });
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // save failed silently
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <Skeleton width="140px" height="28px" borderRadius="8px" />
          <Skeleton width="200px" height="14px" borderRadius="4px" />
        </div>
        {[1, 2].map((i) => (
          <Skeleton key={i} width="100%" height="180px" borderRadius="var(--r-lg)" />
        ))}
      </div>
    );
  }

  const sv = (key) => settings[key]?.value;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className="page-title">Settings</div>
          <div className="page-sub">System and user preferences</div>
        </div>
        <div className={styles.headerActions}>
          {saved && <span className={styles.savedMsg}>Settings saved</span>}
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving\u2026' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="red" icon="&#9888;" title="Error">{error}</Alert>
      )}

      {/* Tenant Settings */}
      <Card>
        <CardHead><CardTitle>Organization Settings</CardTitle></CardHead>
        <CardBody>
          <div className={styles.settingsGrid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="tenant_name">Organization Name</label>
              <input
                id="tenant_name"
                className={styles.input}
                type="text"
                value={sv('tenant_name') || ''}
                onChange={(e) => updateSetting('tenant_name', e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="default_priority">Default Priority</label>
              <select
                id="default_priority"
                className={styles.select}
                value={sv('default_priority') || 'NORMAL'}
                onChange={(e) => updateSetting('default_priority', e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={sv('suspense_48hr_enabled') ?? true}
                  onChange={(e) => updateSetting('suspense_48hr_enabled', e.target.checked)}
                />
                Enable 48-hour suspense tracking
              </label>
            </div>
            <div className={styles.field}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={sv('suspense_3day_enabled') ?? true}
                  onChange={(e) => updateSetting('suspense_3day_enabled', e.target.checked)}
                />
                Enable 3-day suspense tracking
              </label>
            </div>
            <div className={styles.field}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={sv('ai_extraction_enabled') ?? true}
                  onChange={(e) => updateSetting('ai_extraction_enabled', e.target.checked)}
                />
                Enable AI document extraction
              </label>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* User Preferences */}
      <Card>
        <CardHead><CardTitle>User Preferences</CardTitle></CardHead>
        <CardBody>
          <div className={styles.settingsGrid}>
            <div className={styles.field}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={sv('email_notifications') ?? true}
                  onChange={(e) => updateSetting('email_notifications', e.target.checked)}
                />
                Email notifications
              </label>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="theme">Theme</label>
              <select
                id="theme"
                className={styles.select}
                value={sv('theme') || 'light'}
                onChange={(e) => updateSetting('theme', e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="items_per_page">Items Per Page</label>
              <select
                id="items_per_page"
                className={styles.select}
                value={sv('items_per_page') || 25}
                onChange={(e) => updateSetting('items_per_page', Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default Settings;

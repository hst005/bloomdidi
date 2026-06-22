import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { PlatformSettings } from '../lib/types';
import { PageHeader } from '../components/ui';

export function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [platformMsg, setPlatformMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .fetch<PlatformSettings>('/admin/settings')
      .then(setSettings)
      .catch((e) => setError(e.message));
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setPlatformMsg('');
    try {
      await api.fetch('/admin/settings', { method: 'PATCH', body: JSON.stringify(settings) });
      setPlatformMsg('Platform settings saved.');
    } catch (e) {
      setPlatformMsg(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    if (newPassword !== confirmPassword) {
      setPasswordMsg('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg('Password must be at least 8 characters');
      return;
    }
    try {
      await api.fetch('/auth/admin/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordMsg('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg(err instanceof Error ? err.message : 'Failed to update password');
    }
  };

  return (
    <div className="bd-rise" style={{ maxWidth: 560 }}>
      <PageHeader title="Settings" />
      {error && <div className="bd-error" style={{ marginBottom: 16 }}>{error}</div>}

      {settings && (
        <div className="bd-card bd-card-static" style={{ padding: 20, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0, color: 'var(--bd-ink)' }}>Platform</h3>
          <div style={{ marginBottom: 16 }}>
            <label className="bd-label">
              Discovery radius — {settings.globalDiscoveryRadiusKm} km
            </label>
            <input
              type="range"
              min={1}
              max={20}
              value={settings.globalDiscoveryRadiusKm}
              onChange={(e) =>
                setSettings({ ...settings, globalDiscoveryRadiusKm: +e.target.value })
              }
              style={{ width: '100%', accentColor: 'var(--bd-rose)' }}
            />
            <p style={{ fontSize: 12, color: 'var(--bd-ink-soft)', marginTop: 4 }}>
              Max distance customers see florists platform-wide.
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <label className="bd-label">Commission %</label>
              <input
                type="number"
                min={0}
                max={100}
                className="bd-input"
                value={settings.commissionPct}
                onChange={(e) => setSettings({ ...settings, commissionPct: +e.target.value })}
              />
            </div>
            <div>
              <label className="bd-label">Delivery fee (₹)</label>
              <input
                type="number"
                className="bd-input"
                value={settings.deliveryFeePaise / 100}
                onChange={(e) =>
                  setSettings({ ...settings, deliveryFeePaise: +e.target.value * 100 })
                }
              />
            </div>
          </div>
          {platformMsg && (
            <p
              style={{
                fontSize: 14,
                color: platformMsg.includes('saved') ? 'var(--bd-green)' : 'var(--bd-danger)',
              }}
            >
              {platformMsg}
            </p>
          )}
          <button type="button" className="bd-btn bd-btn-primary" onClick={saveSettings}>
            Save platform settings
          </button>
        </div>
      )}

      <div className="bd-card bd-card-static" style={{ padding: 20 }}>
        <h3 style={{ marginTop: 0, color: 'var(--bd-ink)' }}>Change password</h3>
        <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="bd-label">Current password</label>
            <input
              type="password"
              className="bd-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="bd-label">New password</label>
            <input
              type="password"
              className="bd-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="bd-label">Confirm new password</label>
            <input
              type="password"
              className="bd-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          {passwordMsg && (
            <p
              style={{
                fontSize: 14,
                color: passwordMsg.includes('success') ? 'var(--bd-green)' : 'var(--bd-danger)',
              }}
            >
              {passwordMsg}
            </p>
          )}
          <button type="submit" className="bd-btn">
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}

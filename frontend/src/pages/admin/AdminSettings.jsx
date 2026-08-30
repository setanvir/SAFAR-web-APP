import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';

export default function AdminSettings() {
  const [commissionRate, setCommissionRate] = useState('12.5');
  const [platformCurrency, setPlatformCurrency] = useState('USD ($)');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const list = await adminApi.getSettings();
        list.forEach(s => {
          if (s.key === 'commission_rate') setCommissionRate(s.value);
          if (s.key === 'system_currency') setPlatformCurrency(s.value);
        });
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      await Promise.all([
        adminApi.updateSetting('commission_rate', commissionRate),
        adminApi.updateSetting('system_currency', platformCurrency)
      ]);
      setNotice({ type: 'success', text: 'System settings saved and persisted to PostgreSQL!' });
    } catch (err) {
      setNotice({ type: 'error', text: 'Failed to save settings: ' + (err.response?.data?.detail || err.message) });
    } finally {
      setSaving(false);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '10px' }}></i>
        <p>Loading platform configuration...</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '35px', maxWidth: '700px' }}>
      <h2 style={{ margin: '0 0 10px' }}>Platform Commission & System Controls</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '25px', fontSize: '0.9rem' }}>
        Configure platform fees and currency preferences persisted in PostgreSQL.
      </p>

      {notice && (
        <div className={`alert alert-${notice.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: '20px' }}>
          {notice.text}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={{ marginBottom: '22px' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>
            DEFAULT PLATFORM COMMISSION RATE (%)
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            max="50"
            required
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
          />
          <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            Fee deducted from agency payouts on confirmed reservations.
          </small>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>
            PRIMARY SETTLEMENT CURRENCY
          </label>
          <select
            className="form-control"
            value={platformCurrency}
            onChange={(e) => setPlatformCurrency(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
          >
            <option value="USD ($)">USD - US Dollar ($)</option>
            <option value="EUR (€)">EUR - Euro (€)</option>
            <option value="GBP (£)">GBP - British Pound (£)</option>
            <option value="BDT (৳)">BDT - Bangladeshi Taka (৳)</option>
          </select>
        </div>

        <button type="submit" disabled={saving} className="btn" style={{ padding: '12px 28px', fontWeight: 700 }}>
          {saving ? 'Saving to Database...' : 'Save Configuration'}
        </button>
      </form>
    </div>
  );
}

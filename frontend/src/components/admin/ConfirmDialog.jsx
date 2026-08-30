import React from 'react';

/**
 * Reusable Confirmation Dialog for destructive or sensitive admin actions.
 */
export default function ConfirmDialog({ isOpen, title, message, confirmText = "Confirm", cancelText = "Cancel", isDanger = false, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 3000,
      padding: '20px'
    }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '30px', animation: 'fadeIn 0.2s ease-out' }}>
        <h3 style={{ margin: '0 0 12px', color: isDanger ? '#dc2626' : '#1e293b' }}>
          {isDanger && <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>}
          {title}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '25px' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="btn"
            style={{
              background: isDanger ? '#dc2626' : 'var(--primary)',
              padding: '8px 20px',
              fontSize: '0.9rem'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

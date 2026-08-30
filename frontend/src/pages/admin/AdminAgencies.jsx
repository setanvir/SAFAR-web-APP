import React, { useState } from 'react';
import StatusBadge from '../../components/admin/StatusBadge';
import DataTable from '../../components/admin/DataTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

export default function AdminAgencies({ agencies, loading, onVerifyAgency, onRefresh }) {
  const [confirmAction, setConfirmAction] = useState(null); // { agency, status }
  const [actionLoading, setActionLoading] = useState(false);

  const pendingAgencies = (agencies || []).filter(a => a.verification_status === 'pending');
  const verifiedAgencies = (agencies || []).filter(a => a.verification_status === 'verified');
  const rejectedAgencies = (agencies || []).filter(a => a.verification_status === 'rejected');

  const handleAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      await onVerifyAgency(confirmAction.agency.id, confirmAction.status);
      setConfirmAction(null);
    } catch (err) {
      alert('Verification action failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const pendingColumns = [
    { header: 'Company Name' },
    { header: 'Contact Person' },
    { header: 'Email' },
    { header: 'Phone' },
    { header: 'Status' },
    { header: 'Decision Actions', style: { width: '220px' } }
  ];

  const directoryColumns = [
    { header: 'Company Name' },
    { header: 'Contact Person' },
    { header: 'Email' },
    { header: 'Phone' },
    { header: 'Partner Status' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Pending Applications Queue */}
      <div className="card" style={{ padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0 }}>Pending Agency Applications ({pendingAgencies.length})</h2>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.85rem' }}>
              Requires administrator verification and license review
            </p>
          </div>
          {pendingAgencies.length > 0 && (
            <span className="badge badge-pending">Action Required</span>
          )}
        </div>

        <DataTable
          columns={pendingColumns}
          data={pendingAgencies}
          loading={loading}
          emptyMessage="All partner agency applications have been reviewed and processed."
          renderRow={(a) => (
            <tr key={a.id}>
              <td><strong>{a.company_name}</strong></td>
              <td>{a.contact_person || 'Representative'}</td>
              <td>{a.email}</td>
              <td>{a.phone || 'N/A'}</td>
              <td>
                <StatusBadge status={a.verification_status} />
              </td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setConfirmAction({ agency: a, status: 'verified' })}
                    className="btn"
                    style={{ background: '#10b981', padding: '6px 14px', fontSize: '0.85rem' }}
                  >
                    <i className="fas fa-check" style={{ marginRight: '4px' }}></i> Approve
                  </button>
                  <button
                    onClick={() => setConfirmAction({ agency: a, status: 'rejected' })}
                    className="btn btn-danger"
                    style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                  >
                    <i className="fas fa-times" style={{ marginRight: '4px' }}></i> Reject
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
      </div>

      {/* Verified Partner Directory */}
      <div className="card" style={{ padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Verified Partner Agencies ({verifiedAgencies.length})</h2>
          <span className="badge badge-approved">Active Network</span>
        </div>

        <DataTable
          columns={directoryColumns}
          data={verifiedAgencies}
          loading={loading}
          emptyMessage="No verified partner agencies found."
          renderRow={(a) => (
            <tr key={a.id}>
              <td><strong>{a.company_name}</strong></td>
              <td>{a.contact_person || 'Verified Representative'}</td>
              <td>{a.email}</td>
              <td>{a.phone || 'N/A'}</td>
              <td>
                <StatusBadge status={a.verification_status} />
              </td>
            </tr>
          )}
        />
      </div>

      {/* Rejection / Approval Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        title={confirmAction?.status === 'verified' ? 'Approve Partner Agency' : 'Reject Agency Application'}
        message={
          confirmAction?.status === 'verified'
            ? `Authorize "${confirmAction?.agency?.company_name}" to publish packages on SAFAR?`
            : `Reject application from "${confirmAction?.agency?.company_name}"?`
        }
        confirmText={confirmAction?.status === 'verified' ? 'Confirm Approval' : 'Confirm Rejection'}
        isDanger={confirmAction?.status === 'rejected'}
        onConfirm={handleAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}

import React, { useState } from 'react';
import StatusBadge from '../../components/admin/StatusBadge';
import DataTable from '../../components/admin/DataTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

export default function AdminBookings({ bookings, loading, onUpdateBookingStatus, onRefresh }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [confirmStatusAction, setConfirmStatusAction] = useState(null); // { booking, status }
  const [actionLoading, setActionLoading] = useState(false);

  const filteredBookings = (bookings || []).filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    return true;
  });

  const grossSum = filteredBookings
    .filter(b => b.status === 'approved')
    .reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);

  const handleStatusChange = async () => {
    if (!confirmStatusAction) return;
    setActionLoading(true);
    try {
      await onUpdateBookingStatus(confirmStatusAction.booking.id, confirmStatusAction.status);
      setConfirmStatusAction(null);
    } catch (err) {
      alert('Failed to update booking: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { header: 'Booking ID', style: { width: '100px' } },
    { header: 'Traveler Details' },
    { header: 'Experience / Listing' },
    { header: 'Agency' },
    { header: 'Date' },
    { header: 'Guests' },
    { header: 'Total Price' },
    { header: 'Status' },
    { header: 'Actions', style: { width: '130px' } }
  ];

  return (
    <div className="card" style={{ padding: '30px' }}>
      {/* Header with Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Global Bookings Ledger</h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.85rem' }}>
            Real-time transaction log from PostgreSQL
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '150px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span className="badge badge-approved" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            Approved Total: ${grossSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Bookings Table */}
      <DataTable
        columns={columns}
        data={filteredBookings}
        loading={loading}
        emptyMessage="No booking records match the selected filter."
        renderRow={(b) => (
          <tr key={b.id}>
            <td>
              <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                #{b.id}
              </code>
            </td>
            <td>
              <strong>{b.traveler_name}</strong><br />
              <small style={{ color: 'var(--text-muted)' }}>{b.traveler_email}</small>
            </td>
            <td><strong>{b.package_title}</strong></td>
            <td><span style={{ fontSize: '0.85rem' }}>{b.agency_name}</span></td>
            <td>{b.booking_date}</td>
            <td>{b.guests || 1}</td>
            <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
              ${parseFloat(b.price).toFixed(2)}
            </td>
            <td>
              <StatusBadge status={b.status} />
            </td>
            <td>
              <div style={{ display: 'flex', gap: '6px' }}>
                {b.status === 'pending' && (
                  <>
                    <button
                      onClick={() => setConfirmStatusAction({ booking: b, status: 'approved' })}
                      className="btn"
                      style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#10b981' }}
                      title="Approve"
                    >
                      <i className="fas fa-check"></i>
                    </button>
                    <button
                      onClick={() => setConfirmStatusAction({ booking: b, status: 'rejected' })}
                      className="btn btn-danger"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      title="Reject"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedReceipt(b)}
                  className="btn btn-outline"
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  title="View Receipt Invoice"
                >
                  <i className="fas fa-receipt"></i>
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      {/* Invoice Receipt Modal */}
      {selectedReceipt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '35px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--primary)' }}>SAFAR INVOICE</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Booking Reference #{selectedReceipt.id}</div>
              </div>
              <button onClick={() => setSelectedReceipt(null)} style={{ background: 'none', border: 'none', fontSize: '1.6rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem', marginBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Traveler Name:</span>
                <strong>{selectedReceipt.traveler_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Email Address:</span>
                <span>{selectedReceipt.traveler_email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Destination Experience:</span>
                <strong>{selectedReceipt.package_title}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Provider Agency:</span>
                <span>{selectedReceipt.agency_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Reservation Date:</span>
                <span>{selectedReceipt.booking_date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Guests / Travelers:</span>
                <span>{selectedReceipt.guests || 1} Person(s)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '12px', fontSize: '1.25rem', fontWeight: 800 }}>
                <span>Total Amount:</span>
                <span style={{ color: 'var(--primary)' }}>${parseFloat(selectedReceipt.price).toFixed(2)}</span>
              </div>
            </div>

            <button onClick={() => { window.print(); }} className="btn" style={{ width: '100%' }}>
              <i className="fas fa-print" style={{ marginRight: '8px' }}></i> Print Official Invoice
            </button>
          </div>
        </div>
      )}

      {/* Moderation Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmStatusAction}
        title={confirmStatusAction?.status === 'approved' ? 'Approve Reservation' : 'Reject Reservation'}
        message={`Are you sure you want to mark Booking #${confirmStatusAction?.booking?.id} as ${confirmStatusAction?.status.toUpperCase()}?`}
        confirmText={`Confirm ${confirmStatusAction?.status}`}
        isDanger={confirmStatusAction?.status === 'rejected'}
        onConfirm={handleStatusChange}
        onCancel={() => setConfirmStatusAction(null)}
      />
    </div>
  );
}

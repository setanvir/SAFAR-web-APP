import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/admin/StatusBadge';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import DataTable from '../../components/admin/DataTable';

export default function AdminPackages({
  packages,
  loading,
  onAddPackage,
  onUpdatePackage,
  onDeletePackage,
  onRefresh
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPkg, setEditPkg] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'tour',
    location: '',
    price: '',
    description: '',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70',
    duration_days: 6,
    room_type: 'Deluxe Suite'
  });

  const filteredPackages = (packages || []).filter(p => {
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) ||
             p.location.toLowerCase().includes(q) ||
             (p.agency && p.agency.toLowerCase().includes(q));
    }
    return true;
  });

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError(null);
    try {
      await onAddPackage({
        ...formData,
        price: parseFloat(formData.price) || 999.0
      });
      setShowAddModal(false);
      setFormData({
        title: '',
        type: 'tour',
        location: '',
        price: '',
        description: '',
        image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70',
        duration_days: 6,
        room_type: 'Deluxe Suite'
      });
    } catch (err) {
      setFormError(err.response?.data?.detail || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editPkg) return;
    setActionLoading(true);
    setFormError(null);
    try {
      await onUpdatePackage(editPkg.id, {
        title: editPkg.title,
        type: editPkg.type,
        location: editPkg.location,
        price: parseFloat(editPkg.price),
        description: editPkg.description,
        image_url: editPkg.image_url,
        duration_days: editPkg.duration_days,
        room_type: editPkg.room_type
      });
      setEditPkg(null);
    } catch (err) {
      setFormError(err.response?.data?.detail || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await onDeletePackage(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      alert('Failed to delete package: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { header: 'Cover', style: { width: '70px' } },
    { header: 'Title & Destination' },
    { header: 'Type' },
    { header: 'Price' },
    { header: 'Agency' },
    { header: 'Actions', style: { width: '130px' } }
  ];

  return (
    <div className="card" style={{ padding: '30px' }}>
      {/* Search & Filter Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
        <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by title, location, or agency..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
          <select
            className="form-control"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ width: '150px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          >
            <option value="all">All Types</option>
            <option value="tour">Tours Only</option>
            <option value="hotel">Hotels Only</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Showing {filteredPackages.length} listings
          </span>
          <button onClick={() => setShowAddModal(true)} className="btn" style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
            <i className="fas fa-plus" style={{ marginRight: '6px' }}></i> Add Listing
          </button>
        </div>
      </div>

      {/* Packages Table */}
      <DataTable
        columns={columns}
        data={filteredPackages}
        loading={loading}
        emptyMessage="No packages match your search filters."
        renderRow={(p) => (
          <tr key={p.id}>
            <td>
              <img
                src={p.image_url}
                alt={p.title}
                style={{ width: '55px', height: '42px', objectFit: 'cover', borderRadius: '6px' }}
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=70'; }}
              />
            </td>
            <td>
              <strong>{p.title}</strong><br />
              <small style={{ color: 'var(--text-muted)' }}>
                <i className="fas fa-map-marker-alt" style={{ marginRight: '4px' }}></i>{p.location}
              </small>
            </td>
            <td>
              <StatusBadge status={p.type} type={p.type} />
            </td>
            <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
              ${parseFloat(p.price).toFixed(2)}
            </td>
            <td>
              <span style={{ fontSize: '0.85rem' }}>{p.agency || 'SAFAR Verified'}</span>
            </td>
            <td>
              <div style={{ display: 'flex', gap: '6px' }}>
                <Link to={`/package/${p.id}`} className="btn btn-outline" style={{ padding: '5px 8px', fontSize: '0.8rem' }} title="Preview">
                  <i className="fas fa-eye"></i>
                </Link>
                <button onClick={() => setEditPkg({ ...p })} className="btn" style={{ background: '#0284c7', padding: '5px 8px', fontSize: '0.8rem' }} title="Edit">
                  <i className="fas fa-edit"></i>
                </button>
                <button onClick={() => setDeleteTarget(p)} className="btn btn-danger" style={{ padding: '5px 8px', fontSize: '0.8rem' }} title="Delete">
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      {/* Add Listing Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '650px', width: '100%', padding: '35px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Add New Tour or Hotel Listing</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.6rem', cursor: 'pointer' }}>&times;</button>
            </div>

            {formError && <div className="alert alert-error" style={{ marginBottom: '15px' }}>{formError}</div>}

            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Listing Category</label>
                  <select className="form-control" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="tour">Tour Package</option>
                    <option value="hotel">Luxury Hotel</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Price ($ USD)</label>
                  <input type="number" required placeholder="e.g. 1450" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Title</label>
                <input type="text" required placeholder="e.g. Mediterranean Coastal Escape" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Destination Location</label>
                <input type="text" required placeholder="e.g. Santorini, Greece" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Cover Photo URL</label>
                <input type="url" required value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                {formData.image_url && (
                  <div style={{ marginTop: '8px', height: '100px', borderRadius: '8px', overflow: 'hidden', background: '#e2e8f0' }}>
                    <img src={formData.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=70'; }} />
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Detailed Overview</label>
                <textarea rows="4" required placeholder="Provide an exciting description of the tour itinerary or hotel features..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn" style={{ flex: 1, background: '#dc2626' }}>
                  {actionLoading ? 'Publishing...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {editPkg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '650px', width: '100%', padding: '35px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Edit Listing #{editPkg.id}</h2>
              <button onClick={() => setEditPkg(null)} style={{ background: 'none', border: 'none', fontSize: '1.6rem', cursor: 'pointer' }}>&times;</button>
            </div>

            {formError && <div className="alert alert-error" style={{ marginBottom: '15px' }}>{formError}</div>}

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Listing Type</label>
                  <select className="form-control" value={editPkg.type} onChange={(e) => setEditPkg({ ...editPkg, type: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="tour">Tour Package</option>
                    <option value="hotel">Luxury Hotel</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Price ($ USD)</label>
                  <input type="number" required value={editPkg.price} onChange={(e) => setEditPkg({ ...editPkg, price: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Title</label>
                <input type="text" required value={editPkg.title} onChange={(e) => setEditPkg({ ...editPkg, title: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Location</label>
                <input type="text" required value={editPkg.location} onChange={(e) => setEditPkg({ ...editPkg, location: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Cover Image URL</label>
                <input type="url" required value={editPkg.image_url} onChange={(e) => setEditPkg({ ...editPkg, image_url: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '5px' }}>Description</label>
                <textarea rows="4" required value={editPkg.description} onChange={(e) => setEditPkg({ ...editPkg, description: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setEditPkg(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn" style={{ flex: 1 }}>
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Travel Listing"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Delete Listing"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

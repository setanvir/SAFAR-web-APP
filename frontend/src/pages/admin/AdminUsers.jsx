import React, { useState } from 'react';
import StatusBadge from '../../components/admin/StatusBadge';
import DataTable from '../../components/admin/DataTable';

export default function AdminUsers({ users, loading }) {
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = (users || []).filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const columns = [
    { header: 'User ID', style: { width: '80px' } },
    { header: 'Full Name' },
    { header: 'Email Address' },
    { header: 'Account Role' },
    { header: 'Status' },
    { header: 'Registered Date' }
  ];

  return (
    <div className="card" style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Registered Platform Users ({filteredUsers.length})</h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.85rem' }}>
            Database directory of Administrators, Agencies, and Travelers
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '220px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
          <select
            className="form-control"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: '140px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="agency">Agencies</option>
            <option value="traveler">Travelers</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        emptyMessage="No users match the search filters."
        renderRow={(u) => (
          <tr key={u.id}>
            <td>#{u.id}</td>
            <td><strong>{u.name}</strong></td>
            <td>{u.email}</td>
            <td>
              <StatusBadge status={u.role} />
            </td>
            <td>
              <span className="badge badge-approved">{u.status || 'ACTIVE'}</span>
            </td>
            <td>{u.created_at ? u.created_at.split('T')[0] : '2025-01-01'}</td>
          </tr>
        )}
      />
    </div>
  );
}

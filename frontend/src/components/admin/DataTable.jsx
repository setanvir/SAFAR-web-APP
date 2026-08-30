import React from 'react';

/**
 * Reusable Data Table component with loading spinner, empty state, and responsive wrapper.
 */
export default function DataTable({ columns, data, loading, emptyMessage = "No records found.", renderRow }) {
  if (loading) {
    return (
      <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '12px' }}></i>
        <div>Loading live records from database...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <i className="fas fa-inbox" style={{ fontSize: '2.5rem', marginBottom: '10px', opacity: 0.6 }}></i>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table" style={{ width: '100%' }}>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} style={col.style || {}}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => renderRow(item, index))}
        </tbody>
      </table>
    </div>
  );
}

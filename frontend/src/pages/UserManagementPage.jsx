import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Layout from '../components/common/Layout';
import { validateName, validateEmail } from '../utils/formValidator';
import '../styles/UserManagement.css';

const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // modal modes: 'add' | 'view'
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({ firstName: '', middleInitial: '', lastName: '', email: '', role: 'admin' });
  const [validationErrors, setValidationErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendingUserId, setResendingUserId] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [searchQuery, roleFilter, pagination.currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (roleFilter) params.append('role', roleFilter);
      params.append('page', pagination.currentPage);
      params.append('per_page', 10);

      const response = await api.get(`/users?${params.toString()}`);
      if (response.data.success) {
        setUsers(response.data.data);
        setPagination({
          currentPage: response.data.meta.current_page,
          lastPage: response.data.meta.last_page,
          total: response.data.meta.total,
        });
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/users/statistics');
      if (response.data.success) setStats(response.data.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormError('');
    setValidationErrors({});
  };

  // ── Add User (invitation) ────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setModalMode('add');
    setSelectedUser(null);
    setFormData({ firstName: '', middleInitial: '', lastName: '', email: '', role: 'admin' });
    setFormError('');
    setValidationErrors({});
    setShowModal(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setFormError('');
    const newErrors = {};

    const firstNameVal = validateName(formData.firstName.trim(), 'First name');
    if (!firstNameVal.valid) newErrors.firstName = firstNameVal.error;

    const lastNameVal = validateName(formData.lastName.trim(), 'Last name');
    if (!lastNameVal.valid) newErrors.lastName = lastNameVal.error;

    const emailVal = validateEmail(formData.email.trim());
    if (!emailVal.valid) newErrors.email = emailVal.error;

    if (!['admin', 'staff'].includes(formData.role)) {
      newErrors.role = 'Role must be Admin or Staff.';
    }

    if (Object.keys(newErrors).length > 0) { setValidationErrors(newErrors); return; }

    setIsSubmitting(true);
    try {
      const response = await api.post('/users/staff-invite', {
        first_name: formData.firstName.trim(),
        middle_initial: formData.middleInitial.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
      });
      if (response.data.success) {
        toast?.success('Invitation successfully sent!');
        handleCloseModal();
        loadUsers();
        loadStats();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'An error occurred';
      setFormError(errorMsg);
      toast?.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendInvitation = async (userId) => {
    setResendingUserId(userId);
    try {
      await api.post(`/users/${userId}/resend-invitation`);
      toast?.success('Invitation resent successfully!');
      loadUsers();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to resend invitation';
      toast?.error(errorMsg);
    } finally {
      setResendingUserId(null);
    }
  };

  // ── View User ───────────────────────────────────────────────
  const handleOpenView = (user) => {
    setModalMode('view');
    setSelectedUser(user);
    setShowModal(true);
  };

  // ── Helpers ─────────────────────────────────────────────────
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'badge-admin';
      case 'staff': return 'badge-staff';
      default: return 'badge-member';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'staff': return 'Staff';
      default: return 'Member';
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : 'N/A');

  // ── Render ───────────────────────────────────────────────────
  return (
    <Layout>
      <div className="user-management">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>User Management</h1>
            <p>View and manage system users</p>
          </div>
          <button className="btn-add-user" onClick={handleOpenAdd}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            Add New User
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.total || 0}</span>
              <span className="stat-label">Active Users</span>
            </div>
          </div>
          <div className="stat-card admins">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.admins || 0}</span>
              <span className="stat-label">Administrators</span>
            </div>
          </div>
          <div className="stat-card staff">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <polyline points="17 11 19 13 23 9"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.staff || 0}</span>
              <span className="stat-label">Staff Members</span>
            </div>
          </div>
          <div className="stat-card members">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.members || 0}</span>
              <span className="stat-label">Members</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPagination(p => ({ ...p, currentPage: 1 })); }}
            />
          </div>
          <div className="filter-dropdown">
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPagination(p => ({ ...p, currentPage: 1 })); }}>
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="member">Member</option>
            </select>
          </div>

        </div>

        {/* Users Table */}
        <div className="users-table-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading users...</p>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? users.map((user) => (
                  <tr key={user.id} className={user.is_pending_invitation ? 'row-pending' : ''}>
                    <td>
                      <div className="user-cell">
                        <div className={`user-avatar ${user.is_pending_invitation ? 'avatar-pending' : ''}`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="user-name">{user.name}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${getRoleBadgeClass(user.role)} ${user.is_pending_invitation ? 'badge-disabled' : ''}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.is_pending_invitation ? 'badge-pending' : 'badge-active'}`}>
                        {user.is_pending_invitation ? 'Pending' : 'Active'}
                      </span>
                    </td>
                    <td>{user.is_pending_invitation ? '' : formatDate(user.created_at)}</td>
                    <td>
                      <div className="action-buttons">
                        {user.is_pending_invitation ? (
                          <button
                            className="btn-resend"
                            onClick={() => handleResendInvitation(user.id)}
                            disabled={resendingUserId === user.id}
                            title="Resend invitation email"
                          >
                            {resendingUserId === user.id ? (
                              <span className="btn-spinner" style={{ width: '14px', height: '14px' }} />
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="23 4 23 10 17 10"/>
                                <path d="M20.49 15a9 9 0 1 1-2-8.83"/>
                              </svg>
                            )}
                          </button>
                        ) : (
                          <button className="btn-view" onClick={() => handleOpenView(user)} title="View details">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="empty-state">No users found</td></tr>
                )}
              </tbody>
            </table>
          )}

          {pagination.lastPage > 1 && (
            <div className="pagination">
              <button disabled={pagination.currentPage === 1} onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))}>Previous</button>
              <span>Page {pagination.currentPage} of {pagination.lastPage}</span>
              <button disabled={pagination.currentPage === pagination.lastPage} onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))}>Next</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ───────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* ── Add User (invitation) ── */}
            {modalMode === 'add' && (
              <>
                <h2>Invite New User</h2>
                <p style={{ margin: '-4px 0 16px', color: '#64748b', fontSize: '0.875rem' }}>
                  An invitation email will be sent. The account is created only after the invitation is accepted.
                </p>
                {formError && <div className="form-error">{formError}</div>}
                <form onSubmit={handleSubmitAdd}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: '0 1rem' }}>
                    <div className="form-group">
                      <label>First Name *</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => { setFormData({ ...formData, firstName: e.target.value }); const r = e.target.value.trim() ? validateName(e.target.value.trim(), 'First name') : { valid: true }; setValidationErrors(p => { const n = {...p}; if (!r.valid) { n.firstName = r.error; } else { delete n.firstName; } return n; }); }}
                        className={validationErrors.firstName ? 'error' : ''}
                        placeholder="e.g. Maria"
                        required
                      />
                      {validationErrors.firstName && <small className="error-message">{validationErrors.firstName}</small>}
                    </div>
                    <div className="form-group">
                      <label>M.I.</label>
                      <input
                        type="text"
                        value={formData.middleInitial}
                        onChange={(e) => { const val = e.target.value.slice(0, 2).toUpperCase(); setFormData({ ...formData, middleInitial: val }); }}
                        className={validationErrors.middleInitial ? 'error' : ''}
                        placeholder="A"
                        maxLength="2"
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name *</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => { setFormData({ ...formData, lastName: e.target.value }); const r = e.target.value.trim() ? validateName(e.target.value.trim(), 'Last name') : { valid: true }; setValidationErrors(p => { const n = {...p}; if (!r.valid) { n.lastName = r.error; } else { delete n.lastName; } return n; }); }}
                        className={validationErrors.lastName ? 'error' : ''}
                        placeholder="e.g. Santos"
                        required
                      />
                      {validationErrors.lastName && <small className="error-message">{validationErrors.lastName}</small>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => { setFormData({ ...formData, email: e.target.value }); const r = e.target.value.trim() ? validateEmail(e.target.value.trim()) : { valid: true }; setValidationErrors(p => { const n = {...p}; if (!r.valid) { n.email = r.error; } else { delete n.email; } return n; }); }}
                      className={validationErrors.email ? 'error' : ''}
                      placeholder="e.g. maria@example.com"
                      required
                    />
                    {validationErrors.email && <small className="error-message">{validationErrors.email}</small>}
                  </div>
                  <div className="form-group">
                    <label>Role *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => { setFormData({ ...formData, role: e.target.value }); setValidationErrors(p => { const n = {...p}; delete n.role; return n; }); }}
                      className={validationErrors.role ? 'error' : ''}
                      required
                    >
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                    </select>
                    {validationErrors.role && <small className="error-message">{validationErrors.role}</small>}
                  </div>
                  <div style={{ padding: '10px 14px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '6px', fontSize: '0.83rem', color: '#1e40af', marginBottom: '16px' }}>
                    ℹ️ A temporary password will be generated and sent via email. The invited user must change it on first login.
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={handleCloseModal} disabled={isSubmitting}>Cancel</button>
                    <button type="submit" className="btn-submit" disabled={Object.keys(validationErrors).length > 0 || isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="btn-spinner" style={{ marginRight: '6px' }} />
                          Sending...
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ marginRight: '6px' }}><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                          Send Invitation
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* ── View User ── */}
            {modalMode === 'view' && selectedUser && (
              <>
                <h2>User Details</h2>
                <div className="view-user-panel">
                  <div className="view-avatar">{selectedUser.name.charAt(0).toUpperCase()}</div>
                  <div className="view-fields">
                    <div className="view-field"><span className="view-label">Name</span><span className="view-value">{selectedUser.name}</span></div>
                    <div className="view-field"><span className="view-label">Email</span><span className="view-value">{selectedUser.email}</span></div>
                    <div className="view-field">
                      <span className="view-label">Role</span>
                      <span className={`role-badge ${getRoleBadgeClass(selectedUser.role)}`}>{getRoleLabel(selectedUser.role)}</span>
                    </div>
                    <div className="view-field">
                      <span className="view-label">Status</span>
                      <span className="status-badge badge-active">Active</span>
                    </div>
                    <div className="view-field"><span className="view-label">Date Joined</span><span className="view-value">{formatDate(selectedUser.created_at)}</span></div>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-submit" onClick={handleCloseModal}>Close</button>
                </div>
              </>
            )}


          </div>
        </div>
      )}
    </Layout>
  );
};

export default UserManagementPage;

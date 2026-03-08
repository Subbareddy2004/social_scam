import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/axios';
import {
    Users, Lock, Unlock, ShieldCheck, Building2, Search, X, Filter, ChevronDown
} from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter state
    const [filterType, setFilterType] = useState('all');      // all | personal | business
    const [filterRole, setFilterRole] = useState('all');      // all | user | admin
    const [filterStatus, setFilterStatus] = useState('all');  // all | active | blocked
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await API.get('/admin/users');
                setUsers(data.users);
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleToggleBlock = async (userId, isBlocked) => {
        setActionLoading(userId);
        try {
            const action = isBlocked ? 'unblock' : 'block';
            await API.put(`/admin/users/${userId}/${action}`);
            setUsers(users.map(u => u.id === userId ? { ...u, is_blocked: !isBlocked } : u));
        } catch {
            alert('Failed to update user.');
        } finally {
            setActionLoading(null);
        }
    };

    // Apply search + filters
    const q = searchQuery.toLowerCase().trim();
    const filteredUsers = users.filter(u => {
        // Search
        if (q && !(
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.aadhaar_uuid?.toLowerCase().includes(q) ||
            u.business_name?.toLowerCase().includes(q)
        )) return false;

        // Type filter
        if (filterType !== 'all' && u.account_type !== filterType) return false;

        // Role filter
        if (filterRole !== 'all' && u.role !== filterRole) return false;

        // Status filter
        if (filterStatus === 'active' && u.is_blocked) return false;
        if (filterStatus === 'blocked' && !u.is_blocked) return false;

        return true;
    });

    const activeFilterCount = [filterType, filterRole, filterStatus].filter(f => f !== 'all').length;

    const clearFilters = () => {
        setFilterType('all');
        setFilterRole('all');
        setFilterStatus('all');
    };

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div><div className="loading-text">Loading users...</div></div>;
    }

    const FilterChip = ({ label, value, current, onChange }) => (
        <button
            onClick={() => onChange(current === value ? 'all' : value)}
            style={{
                padding: '5px 14px',
                borderRadius: 'var(--r-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms',
                border: current === value
                    ? '1px solid var(--brand-500)'
                    : '1px solid var(--border-default)',
                background: current === value
                    ? 'rgba(88, 101, 242, 0.15)'
                    : 'transparent',
                color: current === value
                    ? 'var(--brand-400)'
                    : 'var(--text-secondary)',
            }}
        >
            {label}
        </button>
    );

    return (
        <div>
            {/* Header with Search */}
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}
            >
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users size={24} /> User Management
                    </h1>
                    <p>
                        {(q || activeFilterCount > 0)
                            ? <>{filteredUsers.length} of {users.length} users {q && <>matching "<strong>{searchQuery}</strong>"</>}</>
                            : <>Manage all {users.length} registered users</>
                        }
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="btn btn-ghost btn-sm"
                        style={{
                            borderColor: activeFilterCount > 0 ? 'var(--brand-500)' : undefined,
                            color: activeFilterCount > 0 ? 'var(--brand-400)' : undefined,
                        }}
                    >
                        <Filter size={14} />
                        Filters
                        {activeFilterCount > 0 && (
                            <span style={{
                                background: 'var(--brand-500)', color: 'white',
                                borderRadius: 'var(--r-full)', width: 18, height: 18,
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.6875rem', fontWeight: 700, marginLeft: 2,
                            }}>
                                {activeFilterCount}
                            </span>
                        )}
                        <ChevronDown size={13} style={{
                            transition: 'transform 150ms',
                            transform: showFilters ? 'rotate(180deg)' : 'rotate(0)',
                        }} />
                    </button>

                    {/* Search Bar */}
                    <div style={{ position: 'relative', width: '280px' }}>
                        <Search size={16} style={{
                            position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                            color: searchQuery ? 'var(--brand-400)' : 'var(--text-tertiary)',
                            transition: 'color 150ms', pointerEvents: 'none',
                        }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                paddingLeft: '40px',
                                paddingRight: searchQuery ? '40px' : '14px',
                                fontSize: '0.8125rem',
                                height: '36px',
                            }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{
                                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'var(--surface-overlay)', border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--r-sm)', width: 22, height: 22,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0,
                                }}
                            >
                                <X size={11} />
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Filter Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden', marginBottom: 'var(--sp-5)' }}
                    >
                        <div className="card" style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                {/* Account Type */}
                                <div>
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                        Account Type
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <FilterChip label="All" value="all" current={filterType} onChange={setFilterType} />
                                        <FilterChip label="Personal" value="personal" current={filterType} onChange={setFilterType} />
                                        <FilterChip label="Business" value="business" current={filterType} onChange={setFilterType} />
                                    </div>
                                </div>

                                {/* Role */}
                                <div>
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                        Role
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <FilterChip label="All" value="all" current={filterRole} onChange={setFilterRole} />
                                        <FilterChip label="User" value="user" current={filterRole} onChange={setFilterRole} />
                                        <FilterChip label="Admin" value="admin" current={filterRole} onChange={setFilterRole} />
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                        Status
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <FilterChip label="All" value="all" current={filterStatus} onChange={setFilterStatus} />
                                        <FilterChip label="Active" value="active" current={filterStatus} onChange={setFilterStatus} />
                                        <FilterChip label="Blocked" value="blocked" current={filterStatus} onChange={setFilterStatus} />
                                    </div>
                                </div>

                                {/* Clear */}
                                {activeFilterCount > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                                        <button
                                            onClick={clearFilters}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                fontSize: '0.75rem', fontWeight: 600,
                                                color: 'var(--rose-400)', fontFamily: 'inherit',
                                                display: 'flex', alignItems: 'center', gap: 4,
                                            }}
                                        >
                                            <X size={12} /> Clear all
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table */}
            <motion.div
                className="card table-wrapper"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Aadhaar UUID</th>
                            <th>Type</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                    {q || activeFilterCount > 0 ? 'No users match your filters' : 'No users found'}
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user, i) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.03 }}
                                >
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-cell-avatar">
                                                {user.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <div className="user-cell-info-name">{user.name}</div>
                                                <div className="user-cell-info-email">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <code className="font-mono" style={{
                                            fontSize: '0.75rem',
                                            background: 'var(--surface-input)',
                                            padding: '3px 8px',
                                            borderRadius: 'var(--r-sm)',
                                            color: 'var(--text-secondary)',
                                            border: '1px solid var(--border-subtle)',
                                        }}>
                                            {user.aadhaar_uuid}
                                        </code>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${user.account_type}`}>
                                            {user.account_type === 'business' && <Building2 size={10} />}
                                            {user.account_type}
                                        </span>
                                        {user.business_name && (
                                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                                {user.business_name}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {user.role === 'admin' ? (
                                            <span className="badge badge-admin">
                                                <ShieldCheck size={10} /> Admin
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>User</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${user.is_blocked ? 'rejected' : 'approved'}`}>
                                            {user.is_blocked ? 'Blocked' : 'Active'}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                                        {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {user.role !== 'admin' && (
                                            <button
                                                className={`btn btn-sm ${user.is_blocked ? 'btn-success' : 'btn-danger'}`}
                                                onClick={() => handleToggleBlock(user.id, user.is_blocked)}
                                                disabled={actionLoading === user.id}
                                            >
                                                {user.is_blocked ? <><Unlock size={13} /> Unblock</> : <><Lock size={13} /> Block</>}
                                            </button>
                                        )}
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </motion.div>
        </div>
    );
};

export default UserManagement;

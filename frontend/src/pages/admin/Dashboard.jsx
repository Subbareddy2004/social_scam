import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../../api/axios';
import { Clock, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    DashboardIcon, ModerationIcon, UsersGroupIcon, ScamShieldIcon
} from '../../components/BrandIcons';

const AdminLayout = () => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('adminSidebarCollapsed');
        return saved === 'true';
    });

    const toggleSidebar = () => {
        setSidebarCollapsed(prev => {
            localStorage.setItem('adminSidebarCollapsed', String(!prev));
            return !prev;
        });
    };

    const sidebarLinks = [
        { path: '/admin', icon: DashboardIcon, label: 'Dashboard' },
        { path: '/admin/pending', icon: ModerationIcon, label: 'Pending Posts' },
        { path: '/admin/rejected', icon: XCircle, label: 'Rejected Posts', isLucide: true },
        { path: '/admin/users', icon: UsersGroupIcon, label: 'User Management' },
    ];

    return (
        <div className={`admin-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <aside className="admin-sidebar">
                <div className="sidebar-toggle-wrapper">
                    <button
                        className="sidebar-toggle-btn"
                        onClick={toggleSidebar}
                        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                <div className="sidebar-section">
                    {!sidebarCollapsed && <div className="sidebar-label">Navigation</div>}
                    <nav className="sidebar-nav">
                        {sidebarLinks.map(({ path, icon: Icon, label, isLucide }) => (
                            <Link
                                key={path}
                                to={path}
                                className={`sidebar-link ${isActive(path) ? 'active' : ''}`}
                                title={sidebarCollapsed ? label : undefined}
                            >
                                {isLucide ? <Icon size={18} className="link-icon" /> : <Icon size={18} className="link-icon" />}
                                {!sidebarCollapsed && <span>{label}</span>}
                            </Link>
                        ))}
                    </nav>
                </div>

                {!sidebarCollapsed && (
                    <div className="sidebar-section">
                        <div className="sidebar-label">System</div>
                        <div style={{
                            padding: 'var(--sp-4)',
                            background: 'var(--surface-input)',
                            borderRadius: 'var(--r-lg)',
                            border: '1px solid var(--border-subtle)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <ScamShieldIcon size={18} />
                                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    Scam Detection
                                </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                                ML model: BERT
                                <br />
                                Threshold: 70%
                            </div>
                        </div>
                    </div>
                )}
            </aside>
            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
};

// ─── Dashboard ─────────────────────────────────────────────
export const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await API.get('/admin/stats');
                setStats(data.stats);
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div><div className="loading-text">Loading dashboard...</div></div>;
    }

    /* Custom stat icons as inline SVGs */
    const TrendUpIcon = ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
        </svg>
    );

    const UserBlockedIcon = ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="7" r="4" /><path d="M2 21c0-3.87 3.13-7 7-7s7 3.13 7 7" /><line x1="17" y1="8" x2="23" y2="14" /><line x1="23" y1="8" x2="17" y2="14" />
        </svg>
    );

    const FileTextIcon = ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    );

    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers, icon: UsersGroupIcon, theme: 'brand' },
        { label: 'Approved Posts', value: stats?.approvedPosts, icon: TrendUpIcon, theme: 'emerald' },
        { label: 'Pending Review', value: stats?.pendingPosts, icon: Clock, theme: 'amber' },
        { label: 'Rejected Posts', value: stats?.rejectedPosts, icon: XCircle, theme: 'rose' },
        { label: 'Total Posts', value: stats?.totalPosts, icon: FileTextIcon, theme: 'sky' },
        { label: 'Blocked Users', value: stats?.blockedUsers, icon: UserBlockedIcon, theme: 'rose' },
    ];

    // Chart data
    const totalPosts = stats?.totalPosts || 0;
    const approved = stats?.approvedPosts || 0;
    const pending = stats?.pendingPosts || 0;
    const rejected = stats?.rejectedPosts || 0;

    const donutData = [
        { label: 'Approved', value: approved, color: '#10b981' },
        { label: 'Pending', value: pending, color: '#f59e0b' },
        { label: 'Rejected', value: rejected, color: '#f43f5e' },
    ];

    // Calculate donut segments
    const donutTotal = donutData.reduce((sum, d) => sum + d.value, 0) || 1;
    let cumulativePercent = 0;
    const segments = donutData.map(d => {
        const percent = (d.value / donutTotal) * 100;
        const segment = { ...d, percent, offset: cumulativePercent };
        cumulativePercent += percent;
        return segment;
    });

    // Bar chart data
    const barMax = Math.max(approved, pending, rejected, 1);
    const barData = [
        { label: 'Approved', value: approved, color: '#10b981' },
        { label: 'Pending', value: pending, color: '#f59e0b' },
        { label: 'Rejected', value: rejected, color: '#f43f5e' },
    ];

    // Donut CSS gradient
    const donutGradient = segments.length > 0
        ? `conic-gradient(${segments.map(s => `${s.color} ${s.offset}% ${s.offset + s.percent}%`).join(', ')})`
        : 'conic-gradient(#333 0% 100%)';

    return (
        <div>
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>Dashboard</h1>
                <p>Platform overview and content moderation</p>
            </motion.div>

            <div className="stats-grid">
                {statCards.map(({ label, value, icon: Icon, theme }, i) => (
                    <motion.div
                        key={label}
                        className={`card stat-card ${theme}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                    >
                        <div className={`stat-icon ${theme}`}>
                            <Icon size={20} />
                        </div>
                        <div className="stat-value font-mono">{value || 0}</div>
                        <div className="stat-label">{label}</div>
                    </motion.div>
                ))}
            </div>

            {/* ── Charts Section ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '24px', alignItems: 'start' }}>
                {/* Donut Chart */}
                <motion.div
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{ padding: '24px' }}
                >
                    <h3 style={{ margin: '0 0 20px', color: 'var(--text-primary)', fontSize: '1rem' }}>
                        Post Status Distribution
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                        {/* Donut */}
                        <div style={{
                            width: '140px', height: '140px', borderRadius: '50%',
                            background: donutGradient,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: 'var(--surface-card)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexDirection: 'column',
                            }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                                    {totalPosts}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                                    Total
                                </div>
                            </div>
                        </div>
                        {/* Legend */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                            {donutData.map(d => (
                                <div key={d.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color }} />
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{d.label}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                                            {d.value}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                            ({donutTotal > 0 ? ((d.value / donutTotal) * 100).toFixed(0) : 0}%)
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Bar Chart */}
                <motion.div
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    style={{ padding: '24px' }}
                >
                    <h3 style={{ margin: '0 0 20px', color: 'var(--text-primary)', fontSize: '1rem' }}>
                        Content Moderation Overview
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {barData.map(d => (
                            <div key={d.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{d.label}</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                                        {d.value}
                                    </span>
                                </div>
                                <div style={{
                                    height: '28px', borderRadius: 'var(--r-md)',
                                    background: 'var(--surface-input)', overflow: 'hidden',
                                    border: '1px solid var(--border-subtle)',
                                }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(d.value / barMax) * 100}%` }}
                                        transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                                        style={{
                                            height: '100%', background: d.color, borderRadius: 'var(--r-md)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                                            paddingRight: '8px', minWidth: d.value > 0 ? '30px' : '0px',
                                        }}
                                    >
                                        {d.value > 0 && (
                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#fff' }}>
                                                {((d.value / donutTotal) * 100).toFixed(0)}%
                                            </span>
                                        )}
                                    </motion.div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div style={{
                        marginTop: '20px', padding: '12px', borderRadius: 'var(--r-lg)',
                        background: 'var(--surface-input)', border: '1px solid var(--border-subtle)',
                    }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                            Detection Rate
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                            {totalPosts > 0 ? (((pending + rejected) / totalPosts) * 100).toFixed(1) : 0}%
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            of all posts flagged by scam detection
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminLayout;

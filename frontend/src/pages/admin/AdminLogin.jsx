import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, ShieldAlert } from 'lucide-react';
import { BrandLogo, AadhaarIcon } from '../../components/BrandIcons';

const AdminLogin = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [aadhaarUuid, setAadhaarUuid] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [requiresEmail, setRequiresEmail] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await login(aadhaarUuid, password, email || null);
            // Verify the logged-in user is actually admin
            if (data.user.role !== 'admin') {
                setError('Access denied. This portal is for administrators only.');
                // Logout non-admin user who tried to log in here
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.reload();
                return;
            }
            navigate('/admin');
        } catch (err) {
            const errorData = err.response?.data;
            if (errorData?.requires_email) {
                setRequiresEmail(true);
                setAccounts(errorData.accounts || []);
                setError('Multiple accounts found. Select your account below.');
            } else {
                setError(errorData?.error || 'Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container" style={{ background: 'var(--surface-ground)' }}>
            <motion.div
                className="auth-card card"
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ maxWidth: 440 }}
            >
                <div className="card-body" style={{ padding: '40px' }}>
                    {/* Back to Home */}
                    <Link to="/" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>
                        <ArrowLeft size={15} /> Back to Home
                    </Link>

                    {/* Header */}
                    <div className="auth-header">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                            style={{
                                width: 72, height: 72, borderRadius: 'var(--r-xl)',
                                background: 'rgba(237, 66, 69, 0.1)', border: '2px solid rgba(237, 66, 69, 0.25)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 16px',
                            }}
                        >
                            <ShieldAlert size={36} style={{ color: '#ed4245' }} />
                        </motion.div>
                        <h1>Admin Portal</h1>
                        <p>Restricted access · <span style={{ color: 'var(--brand-400)', fontWeight: 600 }}>SocialGuard</span></p>
                    </div>

                    {/* Admin badge */}
                    <div style={{
                        background: 'rgba(237, 66, 69, 0.08)',
                        border: '1px solid rgba(237, 66, 69, 0.2)',
                        borderRadius: 'var(--r-lg)',
                        padding: '10px 14px',
                        fontSize: '0.75rem',
                        color: '#ed4245',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 'var(--sp-5)',
                        fontWeight: 500,
                    }}>
                        <ShieldAlert size={14} />
                        This login is for platform administrators only. Regular users should use the <Link to="/login" style={{ color: '#ed4245', fontWeight: 700, textDecoration: 'underline' }}>User Login</Link>.
                    </div>

                    {error && (
                        <motion.div
                            className="alert alert-danger"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Aadhaar UUID */}
                        <div className="form-group">
                            <label className="form-label">
                                <AadhaarIcon size={14} className="label-icon" />
                                Admin Aadhaar UUID
                            </label>
                            <div className="input-wrapper">
                                <input
                                    id="admin-aadhaar-input"
                                    type="text"
                                    className="form-input has-icon-left"
                                    placeholder="Enter admin Aadhaar UUID"
                                    value={aadhaarUuid}
                                    onChange={(e) => setAadhaarUuid(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <div className="input-icon-left">
                                    <AadhaarIcon size={18} />
                                </div>
                            </div>
                        </div>

                        {/* Email for multi-account */}
                        {requiresEmail && (
                            <motion.div
                                className="form-group"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                            >
                                <label className="form-label">Select Account</label>
                                <select
                                    className="form-select"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                >
                                    <option value="">Choose your account...</option>
                                    {accounts.map((acc, i) => (
                                        <option key={i} value={acc.email}>
                                            {acc.email} — {acc.account_type}
                                            {acc.business_name ? ` (${acc.business_name})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </motion.div>
                        )}

                        {/* Password */}
                        <div className="form-group">
                            <label className="form-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="label-icon">
                                    <rect x="3" y="11" width="18" height="11" rx="3" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    <circle cx="12" cy="16.5" r="1.5" fill="currentColor" stroke="none" />
                                </svg>
                                Password
                            </label>
                            <div className="input-wrapper">
                                <input
                                    id="admin-password-input"
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input has-icon-left"
                                    placeholder="Enter admin password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ paddingRight: '44px' }}
                                />
                                <div className="input-icon-left">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="3" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        <circle cx="12" cy="16.5" r="1.5" fill="currentColor" stroke="none" />
                                    </svg>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="input-icon-right"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <motion.button
                            id="admin-login-btn"
                            type="submit"
                            className="btn btn-block btn-lg"
                            disabled={loading}
                            whileHover={{ scale: loading ? 1 : 1.01 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                            style={{
                                background: '#ed4245',
                                color: 'white',
                                border: '1px solid transparent',
                                boxShadow: '0 2px 12px -2px rgba(237, 66, 69, 0.4)',
                            }}
                        >
                            {loading ? (
                                <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div> Verifying...</>
                            ) : (
                                <>
                                    <ShieldAlert size={18} /> Admin Sign In
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="auth-footer">
                        Regular user?{' '}
                        <Link to="/login" style={{ fontWeight: 600 }}>Sign in here</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;

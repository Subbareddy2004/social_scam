import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react';
import { BrandLogo, AadhaarIcon } from '../components/BrandIcons';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [credential, setCredential] = useState('');
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
            await login(credential, password, email || null);
            navigate('/feed');
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
        <div className="auth-container">
            <motion.div
                className="auth-card card"
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="card-body" style={{ padding: '40px' }}>
                    {/* Back to Home */}
                    <Link to="/" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>
                        <ArrowLeft size={15} /> Back to Home
                    </Link>

                    {/* Header */}
                    <div className="auth-header">
                        <motion.div
                            className="auth-logo"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                            style={{ background: 'none', boxShadow: 'none' }}
                        >
                            <BrandLogo size={56} />
                        </motion.div>
                        <h1>Welcome back</h1>
                        <p>Sign in to your <span className="text-gradient">SocialGuard</span> account</p>
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
                        {/* Aadhaar UUID or Email */}
                        <div className="form-group">
                            <label className="form-label">
                                <AadhaarIcon size={14} className="label-icon" />
                                Aadhaar UUID or Email
                            </label>
                            <div className="input-wrapper">
                                <input
                                    id="credential-input"
                                    type="text"
                                    className="form-input has-icon-left"
                                    placeholder="Enter UUID or email address"
                                    value={credential}
                                    onChange={(e) => setCredential(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <div className="input-icon-left">
                                    {credential.includes('@') ? <Mail size={18} /> : <AadhaarIcon size={18} />}
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
                                    id="password-input"
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input has-icon-left"
                                    placeholder="Enter your password"
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
                            id="login-btn"
                            type="submit"
                            className="btn btn-primary btn-block btn-lg"
                            disabled={loading}
                            whileHover={{ scale: loading ? 1 : 1.01 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                        >
                            {loading ? (
                                <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div> Signing in...</>
                            ) : (
                                <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg> Sign In</>
                            )}
                        </motion.button>
                    </form>

                    <div className="auth-footer">
                        Don't have an account?{' '}
                        <Link to="/register" style={{ fontWeight: 600 }}>Create one</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;

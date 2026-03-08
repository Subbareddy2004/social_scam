import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Info, ArrowLeft } from 'lucide-react';
import { BrandLogo, AadhaarIcon, ProfileIcon } from '../components/BrandIcons';

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [accountType, setAccountType] = useState('personal');
    const [formData, setFormData] = useState({
        aadhaar_uuid: '',
        name: '',
        email: '',
        password: '',
        business_name: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register({ ...formData, account_type: accountType });
            navigate('/feed');
        } catch (err) {
            const errorData = err.response?.data;
            setError(errorData?.error || errorData?.errors?.[0]?.msg || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    /* Custom inline SVG icons */
    const PersonIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" /><path d="M4 21c0-3.87 3.58-7 8-7s8 3.13 8 7" />
        </svg>
    );

    const BuildingIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22V12h6v10" /><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01" />
        </svg>
    );

    const BriefcaseIcon = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="3" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><path d="M12 12v.01" />
        </svg>
    );

    const LockIcon = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="3" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /><circle cx="12" cy="16.5" r="1.5" fill="currentColor" stroke="none" />
        </svg>
    );

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
                        <h1>Create account</h1>
                        <p>Join <span className="text-gradient">SocialGuard</span> today</p>
                    </div>

                    {error && (
                        <motion.div
                            className="alert alert-danger"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Account Type Toggle */}
                    <div className="account-type-toggle">
                        <button
                            type="button"
                            className={`toggle-btn ${accountType === 'personal' ? 'active' : ''}`}
                            onClick={() => setAccountType('personal')}
                        >
                            <PersonIcon /> Personal
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn ${accountType === 'business' ? 'active' : ''}`}
                            onClick={() => setAccountType('business')}
                        >
                            <BuildingIcon /> Business
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Aadhaar UUID */}
                        <div className="form-group">
                            <label className="form-label">
                                <AadhaarIcon size={14} className="label-icon" />
                                Aadhaar UUID
                            </label>
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    name="aadhaar_uuid"
                                    className="form-input has-icon-left"
                                    placeholder="Enter your 12-digit Aadhaar UUID"
                                    value={formData.aadhaar_uuid}
                                    onChange={handleChange}
                                    required
                                />
                                <div className="input-icon-left">
                                    <AadhaarIcon size={18} />
                                </div>
                            </div>
                            <div className="form-helper">
                                <Info size={12} />
                                {accountType === 'personal'
                                    ? 'One personal account per Aadhaar UUID'
                                    : 'Multiple business accounts allowed per Aadhaar'}
                            </div>
                        </div>

                        {/* Full Name */}
                        <div className="form-group">
                            <label className="form-label">
                                <ProfileIcon size={14} className="label-icon" />
                                Full Name
                            </label>
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input has-icon-left"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                                <div className="input-icon-left">
                                    <ProfileIcon size={18} />
                                </div>
                            </div>
                        </div>

                        {/* Business Name (conditional) */}
                        {accountType === 'business' && (
                            <motion.div
                                className="form-group"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <label className="form-label">
                                    <BriefcaseIcon />
                                    Business Name
                                </label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        name="business_name"
                                        className="form-input has-icon-left"
                                        placeholder="Enter your business name"
                                        value={formData.business_name}
                                        onChange={handleChange}
                                        required
                                    />
                                    <div className="input-icon-left">
                                        <BriefcaseIcon />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label">
                                <Mail size={14} className="label-icon" />
                                Email Address
                            </label>
                            <div className="input-wrapper">
                                <input
                                    type="email"
                                    name="email"
                                    className="form-input has-icon-left"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                                <div className="input-icon-left">
                                    <Mail size={18} />
                                </div>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label className="form-label">
                                <LockIcon />
                                Password
                            </label>
                            <div className="input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    className="form-input has-icon-left"
                                    placeholder="At least 6 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    style={{ paddingRight: '44px' }}
                                />
                                <div className="input-icon-left">
                                    <LockIcon />
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
                            type="submit"
                            className="btn btn-primary btn-block btn-lg"
                            disabled={loading}
                            whileHover={{ scale: loading ? 1 : 1.01 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                        >
                            {loading ? (
                                <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div> Creating account...</>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                                    </svg>
                                    Create {accountType === 'business' ? 'Business' : 'Personal'} Account
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="auth-footer">
                        Already have an account?{' '}
                        <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;

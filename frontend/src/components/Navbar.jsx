import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { LogOut, Clock, XCircle } from 'lucide-react';
import {
    BrandLogo, FeedIcon, CreatePostIcon, ProfileIcon, DashboardIcon, ModerationIcon, UsersGroupIcon
} from './BrandIcons';

const Navbar = () => {
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    if (!isAuthenticated) return null;

    const isActive = (path) =>
        location.pathname === path || location.pathname.startsWith(path + '/');

    // Admin sees only admin features, users see only user features
    const navItems = isAdmin
        ? [
            { path: '/admin', icon: DashboardIcon, label: 'Dashboard' },
            { path: '/admin/pending', icon: ModerationIcon, label: 'Pending' },
            { path: '/admin/rejected', icon: XCircle, label: 'Rejected' },
            { path: '/admin/users', icon: UsersGroupIcon, label: 'Users' },
        ]
        : [
            { path: '/feed', icon: FeedIcon, label: 'Feed' },
            { path: '/create-post', icon: CreatePostIcon, label: 'Create' },
            { path: '/profile', icon: ProfileIcon, label: 'Profile' },
        ];

    const handleLogout = () => {
        logout();
        navigate(isAdmin ? '/admin/login' : '/');
    };

    return (
        <motion.nav
            className="navbar"
            initial={{ y: -68 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        >
            <div className="navbar-inner">
                {/* Logo */}
                <Link to={isAdmin ? '/admin' : '/feed'} className="navbar-logo">
                    <div className="logo-icon" style={{ background: 'none', boxShadow: 'none' }}>
                        <BrandLogo size={38} />
                    </div>
                    <div className="logo-text">
                        Social<span>Guard</span>
                    </div>
                </Link>

                {/* Nav Links – hidden for admin (sidebar has navigation) */}
                {!isAdmin && (
                    <div className="navbar-nav">
                        {navItems.map(({ path, icon: Icon, label }) => (
                            <Link
                                key={path}
                                to={path}
                                className={`nav-link ${isActive(path) ? 'active' : ''}`}
                            >
                                <Icon size={18} className="nav-icon" />
                                <span>{label}</span>
                            </Link>
                        ))}
                    </div>
                )}

                {/* User */}
                <div className="navbar-user">
                    <div className="user-info">
                        <div className="user-info-name">{user?.name}</div>
                        <div className="user-info-role">
                            {isAdmin ? 'ADMIN' : user?.account_type === 'business' ? user.business_name : user?.account_type}
                        </div>
                    </div>
                    <div className="navbar-avatar" title={user?.name}>
                        {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <button onClick={handleLogout} className="btn-logout" title="Sign out">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;


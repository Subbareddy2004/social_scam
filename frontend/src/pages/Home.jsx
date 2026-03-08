import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { BrandLogo, ScamShieldIcon, PostVerifiedIcon, AadhaarIcon } from '../components/BrandIcons';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const Home = () => {
    const { isAuthenticated } = useAuth();

    const features = [
        {
            icon: <AadhaarIcon size={28} />,
            title: 'Aadhaar Verified',
            desc: 'Secure identity verification via Aadhaar UUID. One personal account per ID, multiple business accounts.',
        },
        {
            icon: <ScamShieldIcon size={28} />,
            title: 'AI Scam Detection',
            desc: 'Every post is automatically screened for scam content, phishing links, and suspicious messages.',
        },
        {
            icon: <PostVerifiedIcon size={28} />,
            title: 'Content Moderation',
            desc: 'Flagged content goes through admin review. Approved posts get a verified badge.',
        },
    ];

    const stats = [
        { value: 'Real-Time', label: 'Scam Scanning' },
        { value: '100%', label: 'Identity Verified' },
        { value: 'AI', label: 'Powered Detection' },
        { value: '24/7', label: 'Admin Moderation' },
    ];

    return (
        <div style={{ minHeight: '100vh', overflow: 'hidden' }}>
            {/* ─── Navbar ─── */}
            <nav className="navbar" style={{ position: 'fixed', width: '100%' }}>
                <div className="navbar-inner">
                    <Link to="/" className="navbar-logo">
                        <div className="logo-icon" style={{ background: 'none', boxShadow: 'none' }}>
                            <BrandLogo size={38} />
                        </div>
                        <div className="logo-text">
                            Social<span>Guard</span>
                        </div>
                    </Link>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {isAuthenticated ? (
                            <Link to="/feed" className="btn btn-primary">
                                Go to Feed <ArrowRight size={16} />
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-ghost">Sign In</Link>
                                <Link to="/register" className="btn btn-primary">
                                    Get Started <ArrowRight size={16} />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ─── Hero ─── */}
            <section style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', textAlign: 'center', padding: '120px 24px 80px',
                position: 'relative',
            }}>
                {/* Decorative Blurple orbs */}
                <div style={{
                    position: 'absolute', width: 500, height: 500,
                    background: 'radial-gradient(circle, rgba(88,101,242,0.12) 0%, transparent 70%)',
                    top: '5%', left: '5%', borderRadius: '50%', filter: 'blur(80px)',
                }} />
                <div style={{
                    position: 'absolute', width: 400, height: 400,
                    background: 'radial-gradient(circle, rgba(88,101,242,0.08) 0%, transparent 70%)',
                    bottom: '10%', right: '10%', borderRadius: '50%', filter: 'blur(80px)',
                }} />

                <motion.div
                    style={{ maxWidth: 720, position: 'relative', zIndex: 1 }}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 180, damping: 15, delay: 0.2 }}
                        style={{ display: 'inline-block', marginBottom: 32 }}
                    >
                        <BrandLogo size={80} />
                    </motion.div>

                    <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.03em' }}>
                        Social Media,{' '}
                        <span className="text-gradient">Scam Free</span>
                    </h1>

                    <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7 }}>
                        SocialGuard protects communities with AI-powered scam detection, Aadhaar-verified identities, and real-time content moderation.
                    </p>

                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {isAuthenticated ? (
                            <Link to="/feed" className="btn btn-primary btn-lg">
                                Open Feed <ArrowRight size={18} />
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" className="btn btn-primary btn-lg">
                                    Create Account <ArrowRight size={18} />
                                </Link>
                                <Link to="/login" className="btn btn-ghost btn-lg">
                                    Sign In
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Trusted indicators */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24,
                        marginTop: 40, flexWrap: 'wrap',
                    }}>
                        {['Aadhaar Verified', 'AI Powered', 'Admin Moderated'].map((t) => (
                            <div key={t} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontWeight: 500,
                            }}>
                                <CheckCircle2 size={14} style={{ color: 'var(--emerald-400)' }} />
                                {t}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ─── Stats Strip ─── */}
            <section style={{
                borderTop: '1px solid var(--border-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
                padding: '40px 24px',
                background: 'var(--surface-base)',
            }}>
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 32, maxWidth: 800, margin: '0 auto', textAlign: 'center',
                }}>
                    {stats.map(({ value, label }) => (
                        <motion.div
                            key={label}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-400)', letterSpacing: '-0.02em', fontFamily: "'JetBrains Mono', monospace" }}>
                                {value}
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
                                {label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ─── Features ─── */}
            <section style={{ padding: '80px 24px', maxWidth: 1000, margin: '0 auto' }}>
                <motion.div
                    style={{ textAlign: 'center', marginBottom: 56 }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>
                        Built for <span className="text-gradient">Trust</span>
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto', fontSize: '1rem' }}>
                        A social platform where every identity is verified and every post is screened
                    </p>
                </motion.div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 24,
                }}>
                    {features.map(({ icon, title, desc }, i) => (
                        <motion.div
                            key={title}
                            className="card"
                            style={{ padding: 32, textAlign: 'center' }}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <div style={{
                                width: 56, height: 56, borderRadius: 'var(--r-xl)',
                                background: 'rgba(88, 101, 242, 0.1)', border: '1px solid rgba(88, 101, 242, 0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px', color: 'var(--brand-400)',
                            }}>
                                {icon}
                            </div>
                            <h3 style={{ fontSize: '1.0625rem', marginBottom: 8 }}>{title}</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section style={{
                padding: '80px 24px', textAlign: 'center',
                background: 'linear-gradient(180deg, transparent 0%, rgba(88,101,242,0.04) 100%)',
                borderTop: '1px solid var(--border-subtle)',
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ maxWidth: 500, margin: '0 auto' }}
                >
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 12 }}>
                        Ready to join?
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '1rem' }}>
                        Create your verified account and start posting securely.
                    </p>
                    {isAuthenticated ? (
                        <Link to="/feed" className="btn btn-primary btn-lg">
                            Go to Feed <ArrowRight size={18} />
                        </Link>
                    ) : (
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Get Started Free <ArrowRight size={18} />
                        </Link>
                    )}
                </motion.div>
            </section>

            {/* ─── Footer ─── */}
            <footer style={{
                borderTop: '1px solid var(--border-subtle)',
                padding: '24px',
                textAlign: 'center',
                fontSize: '0.8125rem',
                color: 'var(--text-tertiary)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <BrandLogo size={18} />
                    <span style={{ fontWeight: 600 }}>SocialGuard</span>
                    <span>· Built with security in mind</span>
                    <span style={{ margin: '0 4px' }}>·</span>
                    <Link to="/admin/login" style={{ color: 'var(--text-tertiary)', fontWeight: 500, textDecoration: 'none', transition: 'color 150ms' }} onMouseEnter={e => e.target.style.color = '#ed4245'} onMouseLeave={e => e.target.style.color = 'var(--text-tertiary)'}>
                        Admin Portal
                    </Link>
                </div>
            </footer>
        </div>
    );
};

export default Home;

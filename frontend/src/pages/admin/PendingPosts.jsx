import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/axios';
import {
    Check, X, AlertTriangle, Clock, Inbox, ShieldAlert, Eye
} from 'lucide-react';

const PendingPosts = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [viewPost, setViewPost] = useState(null);

    const fetchPending = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/admin/pending');
            setPosts(data.posts);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPending(); }, []);

    const handleAction = async (postId, action) => {
        setActionLoading(postId);
        try {
            await API.put(`/admin/posts/${postId}/${action}`);
            setPosts(p => p.filter(post => post.id !== postId));
            if (viewPost?.id === postId) setViewPost(null);
        } catch {
            alert(`Failed to ${action} post.`);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div><div className="loading-text">Loading pending posts...</div></div>;
    }

    return (
        <div>
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Clock size={24} /> Pending Posts
                    {posts.length > 0 && (
                        <span className="status-badge pending" style={{ fontSize: '0.75rem' }}>
                            {posts.length}
                        </span>
                    )}
                </h1>
                <p>Review posts flagged by the scam detection system</p>
            </motion.div>

            {posts.length === 0 ? (
                <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="empty-state-icon"><Inbox size={32} /></div>
                    <h3>All clear!</h3>
                    <p>No posts pending review</p>
                </motion.div>
            ) : (
                <div className="card table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Author</th>
                                <th>Content</th>
                                <th>Confidence</th>
                                <th>Reason</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {posts.map(post => {
                                    const conf = post.scam_confidence || 0;
                                    const confLevel = conf > 0.7 ? 'high' : conf > 0.4 ? 'medium' : 'low';
                                    return (
                                        <motion.tr
                                            key={post.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            layout
                                        >
                                            <td>
                                                <div className="user-cell">
                                                    <div className="user-cell-avatar">
                                                        {post.author?.name?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="user-cell-info-name">{post.author?.name}</div>
                                                        <div className="user-cell-info-email">{post.author?.email}</div>
                                                        {post.author?.aadhaar_uuid && (
                                                            <div className="user-cell-info-email" style={{ fontSize: '0.65rem', color: 'var(--text-quaternary)', fontFamily: 'var(--font-mono)' }}>
                                                                UUID: {post.author.aadhaar_uuid}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="truncate" style={{ maxWidth: '220px' }}>
                                                    {post.text_content || '(image only)'}
                                                </div>
                                                {post.image_url && (
                                                    <img
                                                        src={post.image_url}
                                                        alt=""
                                                        style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 6, marginTop: 4, border: '1px solid var(--border-subtle)' }}
                                                    />
                                                )}
                                            </td>
                                            <td>
                                                <div className="confidence-display">
                                                    <div className="confidence-track">
                                                        <div className={`confidence-fill ${confLevel}`} style={{ width: `${conf * 100}%` }} />
                                                    </div>
                                                    <span className="confidence-value">{(conf * 100).toFixed(0)}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--amber-400)' }}>
                                                    <ShieldAlert size={13} />
                                                    <span className="truncate" style={{ maxWidth: '180px' }}>{post.scam_reason || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{ background: 'var(--surface-input)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                                                        onClick={() => setViewPost(post)}
                                                        title="View full post"
                                                    >
                                                        <Eye size={14} /> View
                                                    </button>
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => handleAction(post.id, 'approve')}
                                                        disabled={actionLoading === post.id}
                                                    >
                                                        <Check size={14} /> Approve
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleAction(post.id, 'reject')}
                                                        disabled={actionLoading === post.id}
                                                    >
                                                        <X size={14} /> Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── View Post Modal ── */}
            <AnimatePresence>
                {viewPost && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setViewPost(null)}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                            backdropFilter: 'blur(4px)',
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: 'var(--surface-card)', borderRadius: 'var(--r-xl)',
                                border: '1px solid var(--border-subtle)', padding: '24px',
                                maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Post Details</h3>
                                <button onClick={() => setViewPost(null)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                            </div>

                            {/* Author Info */}
                            <div style={{ background: 'var(--surface-input)', borderRadius: 'var(--r-lg)', padding: '12px', marginBottom: '16px', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Author</div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{viewPost.author?.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{viewPost.author?.email}</div>
                                {viewPost.author?.aadhaar_uuid && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>UUID: {viewPost.author.aadhaar_uuid}</div>
                                )}
                            </div>

                            {/* Content */}
                            <div style={{ background: 'var(--surface-input)', borderRadius: 'var(--r-lg)', padding: '12px', marginBottom: '16px', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Content</div>
                                <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                    {viewPost.text_content || '(No text content)'}
                                </div>
                                {viewPost.image_url && (
                                    <img src={viewPost.image_url} alt="Post" style={{ width: '100%', borderRadius: 'var(--r-md)', marginTop: '12px', border: '1px solid var(--border-subtle)' }} />
                                )}
                            </div>

                            {/* Scam Info */}
                            <div style={{ background: 'var(--surface-input)', borderRadius: 'var(--r-lg)', padding: '12px', marginBottom: '16px', border: '1px solid rgba(234,179,8,0.2)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--amber-400)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <ShieldAlert size={12} /> Scam Detection Result
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    <strong>Confidence:</strong> {((viewPost.scam_confidence || 0) * 100).toFixed(0)}%
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    <strong>Reason:</strong> {viewPost.scam_reason || 'Unknown'}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleAction(viewPost.id, 'approve')}
                                    disabled={actionLoading === viewPost.id}
                                >
                                    <Check size={14} /> Approve
                                </button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleAction(viewPost.id, 'reject')}
                                    disabled={actionLoading === viewPost.id}
                                >
                                    <X size={14} /> Reject
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PendingPosts;

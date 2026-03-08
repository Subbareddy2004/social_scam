import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api/axios';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import {
    PenSquare, RefreshCw, Inbox, ArrowLeft, ArrowRight
} from 'lucide-react';

const Feed = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchPosts = async (pageNum = 1) => {
        try {
            setLoading(true);
            const { data } = await API.get(`/posts?page=${pageNum}&limit=20`);
            setPosts(data.posts);
            setTotalPages(data.pagination.totalPages);
        } catch (err) {
            console.error('Error fetching posts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPosts(page); }, [page]);

    const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

    return (
        <div className="main-content">
            <div className="feed-container">
                {/* Create Post Prompt */}
                <Link to="/create-post" className="card create-post-prompt" style={{ textDecoration: 'none' }}>
                    <div className="prompt-avatar">
                        {initial}
                    </div>
                    <div className="prompt-text">What's on your mind, {user?.name?.split(' ')[0]}?</div>
                    <motion.div whileHover={{ scale: 1.05 }}>
                        <div className="btn btn-primary btn-sm">
                            <PenSquare size={14} /> Post
                        </div>
                    </motion.div>
                </Link>

                {/* Toolbar */}
                <div className="feed-toolbar">
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Latest Posts
                    </h3>
                    <button
                        onClick={() => fetchPosts(page)}
                        className="btn btn-ghost btn-sm"
                        disabled={loading}
                    >
                        <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
                        Refresh
                    </button>
                </div>

                {/* Posts */}
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <div className="loading-text">Loading posts...</div>
                    </div>
                ) : posts.length === 0 ? (
                    <motion.div
                        className="empty-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="empty-state-icon">
                            <Inbox size={32} />
                        </div>
                        <h3>No posts yet</h3>
                        <p>Be the first to share something with the community</p>
                        <Link to="/create-post" className="btn btn-primary">
                            <PenSquare size={16} /> Create First Post
                        </Link>
                    </motion.div>
                ) : (
                    <>
                        {posts.map((post, i) => (
                            <PostCard key={post.id} post={post} index={i} />
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                gap: '12px', marginTop: '32px', paddingBottom: '16px'
                            }}>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    <ArrowLeft size={14} /> Previous
                                </button>
                                <span className="text-sm font-mono" style={{ color: 'var(--text-tertiary)' }}>
                                    {page} / {totalPages}
                                </span>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next <ArrowRight size={14} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Feed;

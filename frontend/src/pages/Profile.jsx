import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import PostCard from '../components/PostCard';
import {
    Mail, Shield, Calendar, Briefcase, FileText, Trash2
} from 'lucide-react';

const Profile = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyPosts = async () => {
            try {
                const { data } = await API.get('/posts/user/me');
                setPosts(data.posts);
            } catch (err) {
                console.error('Error fetching posts:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyPosts();
    }, []);

    const handleDelete = async (postId) => {
        if (!confirm('Delete this post permanently?')) return;
        try {
            await API.delete(`/posts/${postId}`);
            setPosts(posts.filter(p => p.id !== postId));
        } catch {
            alert('Failed to delete post.');
        }
    };

    const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

    return (
        <div className="main-content">
            <div className="profile-container">
                {/* Profile Header */}
                <motion.div
                    className="card profile-header"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="profile-avatar-lg">{initial}</div>
                    <div className="profile-info">
                        <h2>{user?.name}</h2>
                        <div className="profile-meta">
                            <div className="profile-meta-item">
                                <Mail size={14} />
                                <span>{user?.email}</span>
                            </div>
                            <div className="profile-meta-item">
                                <Shield size={14} />
                                <span className="font-mono text-xs">{user?.aadhaar_uuid}</span>
                            </div>
                            {user?.business_name && (
                                <div className="profile-meta-item">
                                    <Briefcase size={14} />
                                    <span>{user.business_name}</span>
                                </div>
                            )}
                            <div className="profile-meta-item">
                                <Calendar size={14} />
                                <span>Joined {new Date(user?.created_at).toLocaleDateString('en-US', {
                                    month: 'long', year: 'numeric'
                                })}</span>
                            </div>
                        </div>
                        <div className="profile-badges">
                            <span className={`badge badge-${user?.account_type}`}>{user?.account_type}</span>
                            {user?.role === 'admin' && <span className="badge badge-admin">Admin</span>}
                        </div>
                    </div>
                </motion.div>

                {/* Posts Section */}
                <motion.div
                    className="page-header"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                    <div>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={20} /> My Posts
                        </h2>
                        <p className="text-sm text-secondary">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <div className="loading-text">Loading your posts...</div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon"><FileText size={32} /></div>
                        <h3>No posts yet</h3>
                        <p>Your published posts will appear here</p>
                    </div>
                ) : (
                    posts.map((post, i) => (
                        <PostCard
                            key={post.id}
                            post={{ ...post, author: user }}
                            showStatus={true}
                            onDelete={handleDelete}
                            index={i}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default Profile;

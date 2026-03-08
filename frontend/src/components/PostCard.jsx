import { motion } from 'framer-motion';
import { Trash2, Clock, Building2 } from 'lucide-react';

const PostCard = ({ post, onDelete, showStatus = false, index = 0 }) => {
    const author = post.author || {};
    const initial = author.name?.charAt(0)?.toUpperCase() || '?';

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days}d`;
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <motion.div
            className="card post-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
            {/* Header */}
            <div className="post-card-header">
                <div className="post-avatar">{initial}</div>
                <div className="post-author-info">
                    <div className="post-author-name">
                        {author.name || 'Unknown'}
                        {author.account_type && (
                            <span className={`badge badge-${author.account_type}`}>
                                {author.account_type === 'business' && <Building2 size={10} />}
                                {author.account_type}
                            </span>
                        )}
                    </div>
                    <div className="post-author-meta">
                        <Clock size={12} />
                        <span>{timeAgo(post.created_at)}</span>
                        {author.business_name && (
                            <>
                                <span className="meta-dot" />
                                <span>{author.business_name}</span>
                            </>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {showStatus && post.status && (
                        <span className={`status-badge ${post.status}`}>
                            {post.status}
                        </span>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(post.id)}
                            className="post-action-btn danger"
                            title="Delete post"
                        >
                            <Trash2 size={15} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="post-content">
                {post.text_content && <p className="post-text">{post.text_content}</p>}
                {post.image_url && (
                    <div className="post-image-wrapper">
                        <img src={post.image_url} alt="Post" className="post-image" />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default PostCard;

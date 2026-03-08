import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import { X, Send, AlertTriangle, CheckCircle2, Clock, ArrowLeft } from 'lucide-react';
import { ScamShieldIcon, PostVerifiedIcon } from '../components/BrandIcons';

const CreatePost = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [textContent, setTextContent] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [imageBase64, setImageBase64] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result);
            setImageBase64(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImagePreview(null);
        setImageBase64(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!textContent.trim() && !imageBase64) return;
        setLoading(true);
        setResult(null);

        try {
            const payload = {};
            if (textContent.trim()) payload.text_content = textContent.trim();
            if (imageBase64) payload.image_base64 = imageBase64;

            const { data } = await API.post('/posts', payload);
            setResult(data);
            if (data.post.status === 'approved') {
                setTextContent('');
                removeImage();
            }
        } catch (err) {
            setResult({
                message: err.response?.data?.error || 'Failed to create post.',
                post: { status: 'error' },
            });
        } finally {
            setLoading(false);
        }
    };

    const resultConfig = {
        approved: { icon: CheckCircle2, class: 'alert-success' },
        pending: { icon: Clock, class: 'alert-warning' },
        rejected: { icon: AlertTriangle, class: 'alert-danger' },
        error: { icon: AlertTriangle, class: 'alert-danger' },
    };

    const getResult = () => result ? resultConfig[result.post.status] || resultConfig.error : null;

    /* Custom Image Upload Icon */
    const ImageUploadIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
            <path d="M14 3v4M12 5h4" />
        </svg>
    );

    return (
        <div className="main-content">
            <div className="create-post-container">
                {/* Header */}
                <motion.div
                    className="page-header"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                    <div>
                        <h1>Create Post</h1>
                        <p>Share your thoughts with the community</p>
                    </div>
                    <button onClick={() => navigate('/feed')} className="btn btn-ghost btn-sm">
                        <ArrowLeft size={14} /> Back to Feed
                    </button>
                </motion.div>

                {/* Result Alert */}
                <AnimatePresence>
                    {result && (() => {
                        const r = getResult();
                        const Icon = r.icon;
                        return (
                            <motion.div
                                className={`alert ${r.class}`}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                <Icon size={18} />
                                <div>
                                    <strong>{result.message}</strong>
                                    {result.scam_check?.is_scam && (
                                        <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.85 }}>
                                            Reason: {result.scam_check.reason} · Confidence: {(result.scam_check.confidence * 100).toFixed(0)}%
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })()}
                </AnimatePresence>

                <form onSubmit={handleSubmit}>
                    {/* Compose Area */}
                    <motion.div
                        className="card"
                        style={{ marginBottom: 'var(--sp-5)' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="compose-area">
                            <textarea
                                id="post-text-input"
                                className="compose-textarea"
                                placeholder="What would you like to share?"
                                value={textContent}
                                onChange={(e) => setTextContent(e.target.value)}
                                rows={5}
                            />
                        </div>

                        {/* Image Upload */}
                        <div style={{ padding: '0 var(--sp-6) var(--sp-5)' }}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                            />

                            {imagePreview ? (
                                <div className="image-upload-zone has-image">
                                    <div className="image-preview">
                                        <img src={imagePreview} alt="Preview" />
                                        <button type="button" className="remove-btn" onClick={removeImage}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="image-upload-zone"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="upload-icon-wrapper">
                                        <ImageUploadIcon />
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        Click to add an image
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                        PNG, JPG, or GIF · Max 5MB
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Compose Footer */}
                        <div className="compose-footer">
                            <div className="scam-shield">
                                <ScamShieldIcon size={18} />
                                Auto-screened for scam content
                            </div>
                            <div className="compose-actions">
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => navigate('/feed')}
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading || (!textContent.trim() && !imageBase64)}
                                    whileHover={{ scale: loading ? 1 : 1.02 }}
                                    whileTap={{ scale: loading ? 1 : 0.98 }}
                                >
                                    {loading ? (
                                        <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> Checking...</>
                                    ) : (
                                        <><Send size={15} /> Publish</>
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </form>
            </div>
        </div>
    );
};

export default CreatePost;

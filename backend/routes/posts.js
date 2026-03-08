import express from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { checkForScam } from '../services/scamChecker.js';

const router = express.Router();

// Confidence threshold — below this, posts go to admin for review
const CONFIDENCE_THRESHOLD = 0.7;

// ─── Get Feed (approved posts) ──────────────────────────────
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { data: posts, error, count } = await supabase
            .from('posts')
            .select(`
        id, text_content, image_url, status, created_at,
        users!inner ( id, name, email, account_type, business_name, avatar_url )
      `, { count: 'exact' })
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Fetch posts error:', error);
            return res.status(500).json({ error: 'Failed to fetch posts.' });
        }

        res.json({
            posts: posts.map(p => ({
                id: p.id,
                text_content: p.text_content,
                image_url: p.image_url,
                created_at: p.created_at,
                author: p.users,
            })),
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit),
            },
        });
    } catch (error) {
        console.error('Feed error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// ─── Create Post ────────────────────────────────────────────
router.post('/', authenticate, [
    body('text_content').optional().isString(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { text_content } = req.body;
        let image_url = null;

        // Handle image upload to Supabase Storage
        if (req.files && req.files.image) {
            const file = req.files.image;
            const fileExt = file.name.split('.').pop();
            const fileName = `${req.user.id}_${Date.now()}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('post-images')
                .upload(fileName, file.data, {
                    contentType: file.mimetype,
                    upsert: false,
                });

            if (uploadError) {
                console.error('Image upload error:', uploadError);
                return res.status(500).json({ error: 'Failed to upload image.' });
            }

            const { data: urlData } = supabase.storage
                .from('post-images')
                .getPublicUrl(fileName);

            image_url = urlData.publicUrl;
        }

        // Handle base64 image from frontend
        if (req.body.image_base64) {
            const base64Data = req.body.image_base64;
            const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
                const contentType = matches[1];
                const buffer = Buffer.from(matches[2], 'base64');
                const fileExt = contentType.split('/')[1] || 'png';
                const fileName = `${req.user.id}_${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('post-images')
                    .upload(fileName, buffer, {
                        contentType,
                        upsert: false,
                    });

                if (uploadError) {
                    console.error('Image upload error:', uploadError);
                    return res.status(500).json({ error: 'Failed to upload image.' });
                }

                const { data: urlData } = supabase.storage
                    .from('post-images')
                    .getPublicUrl(fileName);

                image_url = urlData.publicUrl;
            }
        }

        if (!text_content && !image_url) {
            return res.status(400).json({ error: 'Post must have text content or an image.' });
        }

        // ─── Scam Detection ───
        const scamResult = await checkForScam(text_content, image_url);

        let status = 'approved';
        if (scamResult.is_scam) {
            if (scamResult.confidence >= CONFIDENCE_THRESHOLD) {
                status = 'rejected'; // High confidence scam — auto-reject
            } else {
                status = 'pending'; // Low confidence — send to admin
            }
        }

        // Insert post
        const { data: post, error } = await supabase
            .from('posts')
            .insert({
                user_id: req.user.id,
                text_content,
                image_url,
                status,
                scam_confidence: scamResult.is_scam ? scamResult.confidence : null,
                scam_reason: scamResult.is_scam ? scamResult.reason : null,
            })
            .select()
            .single();

        if (error) {
            console.error('Create post error:', error);
            return res.status(500).json({ error: 'Failed to create post.' });
        }

        res.status(201).json({
            message: status === 'approved'
                ? 'Post published successfully!'
                : status === 'pending'
                    ? 'Post submitted for admin review.'
                    : 'Post rejected — scam content detected.',
            post: {
                id: post.id,
                text_content: post.text_content,
                image_url: post.image_url,
                status: post.status,
                created_at: post.created_at,
            },
            scam_check: scamResult,
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// ─── Get Single Post ────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const { data: post, error } = await supabase
            .from('posts')
            .select(`
        id, text_content, image_url, status, created_at,
        users ( id, name, email, account_type, business_name, avatar_url )
      `)
            .eq('id', req.params.id)
            .single();

        if (error || !post) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        res.json({
            post: {
                id: post.id,
                text_content: post.text_content,
                image_url: post.image_url,
                status: post.status,
                created_at: post.created_at,
                author: post.users,
            },
        });
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// ─── Delete Own Post ────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
    try {
        // Check ownership
        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('id, user_id, image_url')
            .eq('id', req.params.id)
            .single();

        if (fetchError || !post) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        if (post.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You can only delete your own posts.' });
        }

        // Delete image from storage if exists
        if (post.image_url) {
            const fileName = post.image_url.split('/').pop();
            await supabase.storage.from('post-images').remove([fileName]);
        }

        // Delete post
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', req.params.id);

        if (error) {
            return res.status(500).json({ error: 'Failed to delete post.' });
        }

        res.json({ message: 'Post deleted successfully.' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// ─── Get My Posts ───────────────────────────────────────────
router.get('/user/me', authenticate, async (req, res) => {
    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select('id, text_content, image_url, status, scam_confidence, scam_reason, created_at')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch your posts.' });
        }

        res.json({ posts });
    } catch (error) {
        console.error('Get my posts error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

export default router;

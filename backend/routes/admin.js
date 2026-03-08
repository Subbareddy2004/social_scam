import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(requireAdmin);

// ─── Dashboard Stats ────────────────────────────────────────
router.get('/stats', async (req, res) => {
    try {
        const [
            { count: totalUsers },
            { count: totalPosts },
            { count: pendingPosts },
            { count: rejectedPosts },
            { count: blockedUsers },
        ] = await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('posts').select('*', { count: 'exact', head: true }),
            supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_blocked', true),
        ]);

        res.json({
            stats: {
                totalUsers: totalUsers || 0,
                totalPosts: totalPosts || 0,
                pendingPosts: pendingPosts || 0,
                rejectedPosts: rejectedPosts || 0,
                blockedUsers: blockedUsers || 0,
                approvedPosts: (totalPosts || 0) - (pendingPosts || 0) - (rejectedPosts || 0),
            },
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats.' });
    }
});

// ─── Get Pending Posts ──────────────────────────────────────
router.get('/pending', async (req, res) => {
    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select(`
        id, text_content, image_url, status, scam_confidence, scam_reason, created_at,
        users ( id, name, email, aadhaar_uuid, account_type, business_name, avatar_url )
      `)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch pending posts.' });
        }

        res.json({
            posts: posts.map(p => ({
                id: p.id,
                text_content: p.text_content,
                image_url: p.image_url,
                status: p.status,
                scam_confidence: p.scam_confidence,
                scam_reason: p.scam_reason,
                created_at: p.created_at,
                author: p.users,
            })),
        });
    } catch (error) {
        console.error('Pending posts error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// ─── Get Rejected Posts ─────────────────────────────────────
router.get('/rejected', async (req, res) => {
    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select(`
        id, text_content, image_url, status, scam_confidence, scam_reason, created_at,
        users ( id, name, email, aadhaar_uuid, account_type, business_name, avatar_url )
      `)
            .eq('status', 'rejected')
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch rejected posts.' });
        }

        res.json({
            posts: posts.map(p => ({
                id: p.id,
                text_content: p.text_content,
                image_url: p.image_url,
                status: p.status,
                scam_confidence: p.scam_confidence,
                scam_reason: p.scam_reason,
                created_at: p.created_at,
                author: p.users,
            })),
        });
    } catch (error) {
        console.error('Rejected posts error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// ─── Approve Post ───────────────────────────────────────────
router.put('/posts/:id/approve', async (req, res) => {
    try {
        const { data: post, error } = await supabase
            .from('posts')
            .update({ status: 'approved' })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error || !post) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        res.json({ message: 'Post approved successfully.', post });
    } catch (error) {
        console.error('Approve error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// ─── Reject Post ────────────────────────────────────────────
router.put('/posts/:id/reject', async (req, res) => {
    try {
        const { data: post, error } = await supabase
            .from('posts')
            .update({ status: 'rejected' })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error || !post) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        res.json({ message: 'Post rejected.', post });
    } catch (error) {
        console.error('Reject error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// ─── List All Users ─────────────────────────────────────────
router.get('/users', async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, name, email, aadhaar_uuid, account_type, business_name, role, is_blocked, avatar_url, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch users.' });
        }

        res.json({ users });
    } catch (error) {
        console.error('Users list error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// ─── Block User ─────────────────────────────────────────────
router.put('/users/:id/block', async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .update({ is_blocked: true })
            .eq('id', req.params.id)
            .neq('role', 'admin') // Can't block admins
            .select()
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'User not found or cannot be blocked.' });
        }

        res.json({ message: 'User blocked successfully.', user });
    } catch (error) {
        console.error('Block user error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// ─── Unblock User ───────────────────────────────────────────
router.put('/users/:id/unblock', async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .update({ is_blocked: false })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({ message: 'User unblocked successfully.', user });
    } catch (error) {
        console.error('Unblock user error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

export default router;

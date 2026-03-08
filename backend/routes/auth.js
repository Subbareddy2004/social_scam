import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import supabase from '../config/supabase.js';

const router = express.Router();

// ─── Register Personal Account ─────────────────────────────
router.post('/register', [
    body('aadhaar_uuid').notEmpty().withMessage('Aadhaar UUID is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { aadhaar_uuid, name, email, password } = req.body;

        // Check if personal account already exists with this Aadhaar UUID
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('aadhaar_uuid', aadhaar_uuid)
            .eq('account_type', 'personal')
            .single();

        if (existingUser) {
            return res.status(409).json({ error: 'A personal account with this Aadhaar UUID already exists.' });
        }

        // Check duplicate email
        const { data: existingEmail } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingEmail) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 12);

        // Insert user
        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                aadhaar_uuid,
                name,
                email,
                password_hash,
                account_type: 'personal',
                role: 'user',
                is_blocked: false,
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return res.status(500).json({ error: 'Failed to create account.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role, account_type: newUser.account_type },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Personal account created successfully.',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                aadhaar_uuid: newUser.aadhaar_uuid,
                account_type: newUser.account_type,
                role: newUser.role,
                avatar_url: newUser.avatar_url,
                created_at: newUser.created_at,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// ─── Register Business Account ─────────────────────────────
router.post('/register-business', [
    body('aadhaar_uuid').notEmpty().withMessage('Aadhaar UUID is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('business_name').notEmpty().withMessage('Business name is required'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { aadhaar_uuid, name, email, password, business_name } = req.body;

        // Check duplicate email
        const { data: existingEmail } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingEmail) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 12);

        // Insert business user (multiple allowed with same aadhaar_uuid)
        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                aadhaar_uuid,
                name,
                email,
                password_hash,
                account_type: 'business',
                business_name,
                role: 'user',
                is_blocked: false,
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return res.status(500).json({ error: 'Failed to create business account.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role, account_type: newUser.account_type },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Business account created successfully.',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                aadhaar_uuid: newUser.aadhaar_uuid,
                account_type: newUser.account_type,
                business_name: newUser.business_name,
                role: newUser.role,
                avatar_url: newUser.avatar_url,
                created_at: newUser.created_at,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// ─── Login ──────────────────────────────────────────────────
router.post('/login', [
    body('credential').notEmpty().withMessage('Aadhaar UUID or Email is required'),
    body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { credential, password, email } = req.body;

        // Detect if credential is an email (contains @) or Aadhaar UUID
        const isEmail = credential.includes('@');

        let query;
        if (isEmail) {
            // Login by email — unique lookup
            query = supabase.from('users').select('*').eq('email', credential);
        } else {
            // Login by Aadhaar UUID
            query = supabase.from('users').select('*').eq('aadhaar_uuid', credential);
            if (email) {
                query = query.eq('email', email);
            }
        }

        const { data: users, error } = await query;

        if (error || !users || users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // If multiple accounts found (business), require email to disambiguate
        if (users.length > 1 && !email) {
            return res.status(400).json({
                error: 'Multiple accounts found with this Aadhaar UUID. Please provide your email to login.',
                requires_email: true,
                accounts: users.map(u => ({ email: u.email, account_type: u.account_type, business_name: u.business_name })),
            });
        }

        const user = users[0];

        // Check if user is blocked
        if (user.is_blocked) {
            return res.status(403).json({ error: 'Your account has been blocked by the administrator.' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, account_type: user.account_type },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                aadhaar_uuid: user.aadhaar_uuid,
                account_type: user.account_type,
                business_name: user.business_name,
                role: user.role,
                avatar_url: user.avatar_url,
                created_at: user.created_at,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// ─── Get Current User ───────────────────────────────────────
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, aadhaar_uuid, account_type, business_name, role, is_blocked, avatar_url, created_at')
            .eq('id', decoded.id)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (user.is_blocked) {
            return res.status(403).json({ error: 'Your account has been blocked.' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(401).json({ error: 'Invalid token.' });
    }
});

export default router;

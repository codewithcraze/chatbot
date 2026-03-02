import { Router } from 'express';
import Session from '../models/Session.js';
import { createSessionRules, validate } from '../middleware/validation.js';

const router = Router();

/**
 * POST /api/sessions
 * Create a new chat session.
 */
router.post('/', createSessionRules, validate, async (req, res) => {
    try {
        const { orgId, customer = {}, metadata = {} } = req.body;
        const session = await Session.create({ orgId, customer, metadata });
        res.status(201).json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/sessions/:id
 * Get a session with all messages.
 */
router.get('/:id', async (req, res) => {
    try {
        const session = await Session.findById(req.params.id).populate('assignedAgent', 'name avatar status');
        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/sessions?orgId=&status=&page=&limit=
 * List sessions with filters (for CRM).
 */
router.get('/', async (req, res) => {
    try {
        const { orgId, status, search } = req.query;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(200, parseInt(req.query.limit, 10) || 30);

        const filter = {};
        if (orgId) filter.orgId = orgId;
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { 'customer.name': { $regex: search, $options: 'i' } },
                { 'customer.email': { $regex: search, $options: 'i' } },
            ];
        }

        const [sessions, total] = await Promise.all([
            Session.find(filter)
                .sort({ updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('assignedAgent', 'name avatar status')
                .select('-messages')
                .lean(),                          // return plain JS objects, faster
            Session.countDocuments(filter),
        ]);

        res.json({ sessions, total, page, limit, pages: Math.ceil(total / limit) });
    } catch (err) {
        console.error('GET /api/sessions error:', err);
        res.status(500).json({ error: err.message });
    }
});


/**
 * PATCH /api/sessions/:id/customer
 * Update customer info (for CRM right sidebar).
 */
router.patch('/:id/customer', async (req, res) => {
    try {
        const session = await Session.findByIdAndUpdate(
            req.params.id,
            { $set: { customer: req.body } },
            { new: true }
        );
        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

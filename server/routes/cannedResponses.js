import { Router } from 'express';
import CannedResponse from '../models/CannedResponse.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/canned-responses?orgId=&category=&search=
 */
router.get('/', async (req, res) => {
    try {
        const { orgId, category, search } = req.query;
        if (!orgId) return res.status(400).json({ error: 'orgId is required' });
        const filter = { orgId };
        if (category) filter.category = category;
        if (search) {
            filter.$or = [
                { shortcut: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } },
            ];
        }
        const responses = await CannedResponse.find(filter).sort({ shortcut: 1 });
        res.json(responses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/canned-responses
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const { orgId, shortcut, message, category } = req.body;
        const cr = await CannedResponse.create({ orgId, shortcut, message, category });
        res.status(201).json(cr);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ error: 'Shortcut already exists' });
        res.status(500).json({ error: err.message });
    }
});

/**
 * PUT /api/canned-responses/:id
 */
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const cr = await CannedResponse.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!cr) return res.status(404).json({ error: 'Not found' });
        res.json(cr);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /api/canned-responses/:id
 */
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        await CannedResponse.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

import { Router } from 'express';
import Session from '../models/Session.js';

const router = Router();

/**
 * POST /api/messages
 * Fallback HTTP endpoint to save a message to a session.
 */
router.post('/', async (req, res) => {
    try {
        const { sessionId, sender, type = 'text', content, metadata = {} } = req.body;
        if (!sessionId || !sender || !content) {
            return res.status(400).json({ error: 'sessionId, sender, and content are required' });
        }
        const session = await Session.findByIdAndUpdate(
            sessionId,
            {
                $push: {
                    messages: { sender, type, content, metadata, timestamp: new Date() },
                },
            },
            { new: true }
        );
        if (!session) return res.status(404).json({ error: 'Session not found' });
        const newMsg = session.messages[session.messages.length - 1];
        res.status(201).json(newMsg);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

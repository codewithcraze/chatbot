import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Agent from '../models/Agent.js';
import Session from '../models/Session.js';
import { assignAgentRules, validate } from '../middleware/validation.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/agents/me
 * Return the currently authenticated agent (validates token + returns fresh DB data).
 */
router.get('/me', requireAuth, async (req, res) => {
    try {
        const agent = await Agent.findById(req.agent.id).select('-passwordHash');
        if (!agent) return res.status(404).json({ error: 'Agent not found' });
        res.json(agent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/agents/online?orgId=
 * Return available online agents.
 */
router.get('/online', async (req, res) => {
    try {
        const { orgId } = req.query;
        const filter = { status: 'online' };
        if (orgId) filter.orgId = orgId;

        const agents = await Agent.find(filter).select('-passwordHash');
        const available = agents.filter(a => (a.activeSessions || []).length < (a.maxConcurrent || 5));
        res.json(available);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/agents?orgId=
 * List all agents in an org (admin).
 */
router.get('/', requireAuth, async (req, res) => {
    try {
        const { orgId } = req.query;
        const filter = orgId ? { orgId } : {};
        const agents = await Agent.find(filter).select('-passwordHash');
        res.json(agents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


/**
 * POST /api/agents/register
 * Create a new agent (admin only).
 */
router.post('/register', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, email, password, orgId, role = 'agent', maxConcurrent = 5 } = req.body;
        const existing = await Agent.findOne({ email });
        if (existing) return res.status(409).json({ error: 'Email already registered' });

        const passwordHash = await bcrypt.hash(password, 10);
        const agent = await Agent.create({ name, email, passwordHash, orgId, role, maxConcurrent });
        res.status(201).json({ ...agent.toJSON(), passwordHash: undefined });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/agents/login
 * Agent login → JWT.
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const agent = await Agent.findOne({ email });
        if (!agent) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, agent.passwordHash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: agent._id, orgId: agent.orgId, role: agent.role, name: agent.name },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Mark agent online
        agent.status = 'online';
        agent.lastActive = new Date();
        await agent.save();

        res.json({ token, agent: { ...agent.toJSON(), passwordHash: undefined } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/agents/:id/assign
 * Assign agent to a session.
 */
router.post('/:id/assign', assignAgentRules, validate, async (req, res) => {
    try {
        const { sessionId } = req.body;
        const agent = await Agent.findById(req.params.id);
        if (!agent) return res.status(404).json({ error: 'Agent not found' });

        const session = await Session.findByIdAndUpdate(
            sessionId,
            { assignedAgent: agent._id, status: 'live', liveAt: new Date() },
            { new: true }
        );
        if (!session) return res.status(404).json({ error: 'Session not found' });

        if (!agent.activeSessions.includes(sessionId)) {
            agent.activeSessions.push(sessionId);
            await agent.save();
        }

        res.json({ agent, session });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * PATCH /api/agents/:id/status
 * Update agent status.
 */
router.patch('/:id/status', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['online', 'away', 'offline'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const agent = await Agent.findByIdAndUpdate(
            req.params.id,
            { status, lastActive: new Date() },
            { new: true }
        ).select('-passwordHash');
        if (!agent) return res.status(404).json({ error: 'Agent not found' });
        res.json(agent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

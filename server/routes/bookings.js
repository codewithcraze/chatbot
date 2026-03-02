import { Router } from 'express';
import Booking from '../models/Booking.js';
import Session from '../models/Session.js';
import { createBookingRules, updateBookingRules, validate } from '../middleware/validation.js';

const router = Router();

/**
 * GET /api/bookings?orgId=&status=&date=&page=&limit=
 */
router.get('/', async (req, res) => {
    try {
        const { orgId, status, date, search, page = 1, limit = 30 } = req.query;
        const filter = {};
        if (orgId) filter.orgId = orgId;
        if (status) filter.status = status;
        if (date) {
            const start = new Date(date);
            const end = new Date(date);
            end.setDate(end.getDate() + 1);
            filter.datetime = { $gte: start, $lt: end };
        }
        if (search) {
            filter.$or = [
                { 'customer.name': { $regex: search, $options: 'i' } },
                { 'customer.email': { $regex: search, $options: 'i' } },
                { service: { $regex: search, $options: 'i' } },
            ];
        }

        const bookings = await Booking.find(filter)
            .sort({ datetime: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Booking.countDocuments(filter);
        res.json({ bookings, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/bookings
 */
router.post('/', createBookingRules, validate, async (req, res) => {
    try {
        const { sessionId, orgId, service, datetime, customer, notes } = req.body;
        const booking = await Booking.create({
            sessionId,
            orgId,
            service,
            datetime,
            customer,
            notes,
            history: [{ action: 'created' }],
        });
        res.status(201).json(booking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/bookings/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * PUT /api/bookings/:id
 */
router.put('/:id', updateBookingRules, validate, async (req, res) => {
    try {
        const { service, datetime, status, notes, agentId } = req.body;
        const update = {};
        if (service) update.service = service;
        if (datetime) update.datetime = datetime;
        if (status) update.status = status;
        if (notes !== undefined) update.notes = notes;

        const historyEntry = { action: status === 'cancelled' ? 'cancelled' : 'modified' };
        if (agentId) historyEntry.agentId = agentId;

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { $set: update, $push: { history: historyEntry } },
            { new: true }
        );
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /api/bookings/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { $set: { status: 'cancelled' }, $push: { history: { action: 'cancelled' } } },
            { new: true }
        );
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        res.json({ message: 'Booking cancelled', booking });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

import { validationResult, body, param, query } from 'express-validator';

/**
 * Middleware: return 400 with validation errors if any exist.
 */
export function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

// ─── Session validators ──────────────────────────────────────────────────────
export const createSessionRules = [
    body('orgId').notEmpty().withMessage('orgId is required'),
    body('customer').optional().isObject(),
];

// ─── Booking validators ──────────────────────────────────────────────────────
export const createBookingRules = [
    body('sessionId').notEmpty(),
    body('orgId').notEmpty(),
    body('service').notEmpty().withMessage('service is required'),
    body('datetime').isISO8601().withMessage('datetime must be ISO 8601'),
    body('customer.name').notEmpty().withMessage('customer.name is required'),
];

export const updateBookingRules = [
    param('id').isMongoId().withMessage('Invalid booking id'),
    body('service').optional().notEmpty(),
    body('datetime').optional().isISO8601(),
    body('status').optional().isIn(['confirmed', 'modified', 'cancelled']),
];

// ─── Agent validators ────────────────────────────────────────────────────────
export const assignAgentRules = [
    param('id').isMongoId().withMessage('Invalid agent id'),
    body('sessionId').notEmpty().isMongoId().withMessage('Invalid sessionId'),
];

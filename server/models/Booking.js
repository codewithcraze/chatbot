import mongoose from 'mongoose';

const bookingHistorySchema = new mongoose.Schema({
    action: { type: String, required: true }, // 'created', 'modified', 'cancelled'
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
});

const bookingSchema = new mongoose.Schema(
    {
        sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
        orgId: { type: String, required: true, index: true },
        service: { type: String, required: true },
        datetime: { type: Date, required: true },
        status: {
            type: String,
            enum: ['confirmed', 'modified', 'cancelled'],
            default: 'confirmed',
        },
        customer: {
            name: { type: String, required: true },
            email: { type: String, default: '' },
            phone: { type: String, default: '' },
        },
        notes: { type: String, default: '' },
        history: [bookingHistorySchema],
    },
    { timestamps: true }
);

bookingSchema.index({ orgId: 1, status: 1 });
bookingSchema.index({ orgId: 1, datetime: -1 });
bookingSchema.index({ 'customer.email': 1 });

export default mongoose.model('Booking', bookingSchema);

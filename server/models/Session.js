import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        enum: ['bot', 'customer', 'agent', 'system'],
        required: true,
    },
    type: {
        type: String,
        enum: ['text', 'booking_card', 'status_card', 'action', 'system', "links"],
        default: 'text',
    },
    content: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent',
    },
    timestamp: { type: Date, default: Date.now },
});

const sessionSchema = new mongoose.Schema(
    {
        _id: { type: String },   // custom string ID from widget (e.g. generateId(24))
        orgId: { type: String, required: true, index: true },
        customer: {
            name: { type: String, default: 'Guest' },
            email: { type: String, default: '' },
            phone: { type: String, default: '' },
            ip: { type: String, default: '' },
            device: { type: String, default: '' },
            location: { type: String, default: '' },
        },
        status: {
            type: String,
            enum: ['bot', 'waiting', 'live', 'resolved'],
            default: 'bot',
            index: true,
        },
        assignedAgent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Agent',
            default: null,
        },
        messages: [messageSchema],
        metadata: {
            sourceUrl: { type: String, default: '' },
            browser: { type: String, default: '' },
            os: { type: String, default: '' },
        },
        queuedAt: { type: Date, default: null },
        liveAt: { type: Date, default: null },
        resolvedAt: { type: Date, default: null },
    },
    { timestamps: true }         // _id is defined above as String, so no auto-ObjectId is generated
);



sessionSchema.index({ orgId: 1, status: 1 });
sessionSchema.index({ orgId: 1, createdAt: -1 });

export default mongoose.model('Session', sessionSchema);

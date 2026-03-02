import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema(
    {
        orgId: { type: String, required: true, index: true },
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        avatar: { type: String, default: '' },
        status: {
            type: String,
            enum: ['online', 'away', 'offline'],
            default: 'offline',
        },
        activeSessions: [{ type: String }],

        maxConcurrent: { type: Number, default: 5 },
        role: { type: String, enum: ['agent', 'admin'], default: 'agent' },
        lastActive: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Virtual: is the agent available for new chats?
agentSchema.virtual('isAvailable').get(function () {
    return this.status === 'online' && this.activeSessions.length < this.maxConcurrent;
});

agentSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Agent', agentSchema);

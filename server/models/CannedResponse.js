import mongoose from 'mongoose';

const cannedResponseSchema = new mongoose.Schema(
    {
        orgId: { type: String, required: true, index: true },
        shortcut: { type: String, required: true, trim: true }, // e.g. "greet"
        message: { type: String, required: true },
        category: { type: String, default: 'general', trim: true },
    },
    { timestamps: true }
);

cannedResponseSchema.index({ orgId: 1, shortcut: 1 }, { unique: true });

export default mongoose.model('CannedResponse', cannedResponseSchema);

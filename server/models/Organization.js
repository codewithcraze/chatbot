import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        settings: {
            primaryColor: { type: String, default: '#6366f1' },
            botName: { type: String, default: 'Support Assistant' },
            hours: {
                // e.g. { start: '09:00', end: '18:00', timezone: 'Asia/Kolkata' }
                start: { type: String, default: '09:00' },
                end: { type: String, default: '18:00' },
                timezone: { type: String, default: 'UTC' },
                daysOpen: { type: [Number], default: [1, 2, 3, 4, 5] }, // Mon–Fri
            },
            autoAssign: { type: Boolean, default: true },
            welcomeMessage: {
                type: String,
                default: 'Hi there! 👋 How can I help you today?',
            },
        },
        plan: { type: String, enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model('Organization', organizationSchema);

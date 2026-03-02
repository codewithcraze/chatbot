/**
 * Seed script – creates a default admin agent & organization.
 * Run once: node seed.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Agent from './models/Agent.js';
import Organization from './models/Organization.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat_crm';

const DEFAULT_ORG = {
    name: 'Demo Organization',
    settings: { primaryColor: '#6366f1', botName: 'Support Assistant' },
    plan: 'starter',
};

const DEFAULT_AGENT = {
    name: 'Admin',
    email: 'admin@demo.com',
    password: 'admin123',
    role: 'admin',
};

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Create org
    let org = await Organization.findOne({ name: DEFAULT_ORG.name });
    if (!org) {
        org = await Organization.create(DEFAULT_ORG);
        console.log(`✅ Organization created: "${org.name}" (orgId: ${org._id})`);
    } else {
        console.log(`ℹ️  Organization already exists: "${org.name}" (orgId: ${org._id})`);
    }

    // Create admin agent
    const existing = await Agent.findOne({ email: DEFAULT_AGENT.email });
    if (existing) {
        console.log(`ℹ️  Agent already exists: ${DEFAULT_AGENT.email}`);
    } else {
        const passwordHash = await bcrypt.hash(DEFAULT_AGENT.password, 10);
        const agent = await Agent.create({
            name: DEFAULT_AGENT.name,
            email: DEFAULT_AGENT.email,
            passwordHash,
            orgId: String(org._id),
            role: DEFAULT_AGENT.role,
            status: 'offline',
        });
        console.log(`✅ Admin agent created:`);
        console.log(`   Email   : ${DEFAULT_AGENT.email}`);
        console.log(`   Password: ${DEFAULT_AGENT.password}`);
        console.log(`   OrgId   : ${agent.orgId}`);
    }

    await mongoose.disconnect();
    console.log('\n🎉 Seed complete. You can now log in to the CRM at http://localhost:5173');
}

seed().catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});

import CustomerIntel from './CustomerIntel.jsx';
import { useConversationStore } from '../store/conversationStore.js';
import { useBookings } from '../hooks/useApi.js';

export default function RightSidebar({ sessionId }) {
    const { conversations } = useConversationStore();
    const conv = conversations.find((c) => c._id === sessionId);
    const { data: bookingsData } = useBookings({ orgId: conv?.orgId });

    const sessionBookings = (bookingsData?.bookings || []).filter(
        (b) => String(b.sessionId) === sessionId
    );

    return (
        <div className="flex flex-col h-full bg-slate-900 overflow-y-auto scrollbar-thin">
            <CustomerIntel conversation={conv} bookings={sessionBookings} />
        </div>
    );
}

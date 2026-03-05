const PILLS = [
    { id: 'book', label: 'Book Flight', flow: 'book' },
    { id: 'status', label: 'Check Booking Status', flow: 'status' },
    { id: 'modify', label: 'Modify Booking', flow: 'modify' },
    { id: 'cancel', label: 'Cancel Booking', flow: 'cancel' },
    { id: 'agent', label: '💬 Agent', flow: null },
];

export default function QuickPills({ onSelect, onConnectAgent }) {
    return (
        <div className="widget-pills">
            {PILLS.map((pill) => (
                <button
                    key={pill.id}
                    className="widget-pill"
                    onClick={() => {
                        if (pill.id === 'agent') {
                            onConnectAgent();
                        } else {
                            onSelect(pill.flow);
                        }
                    }}
                >
                    {pill.label}
                </button>
            ))}
        </div>
    );
}

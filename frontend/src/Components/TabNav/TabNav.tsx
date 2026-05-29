import { useLocation, useNavigate } from 'react-router-dom';
import { QUICK_QUEUE_PRIMARY } from '../../featureFlags';

const tabs = QUICK_QUEUE_PRIMARY
    ? [
        { label: '1. Quick Queue', path: '/' },
        { label: '2. Queue Tunes', path: '/queue-tunes' },
    ]
    : [
        { label: '1. Queue Tunes', path: '/' },
        { label: '2. Quick Queue', path: '/quick-queue' },
    ];

export function TabNav() {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <div className="flex gap-1 mb-8 bg-zinc-900 rounded-full p-1">
            {tabs.map(tab => {
                const isActive = location.pathname === tab.path;
                return (
                    <button
                        key={tab.path}
                        onClick={() => navigate(tab.path)}
                        className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${isActive
                            ? 'bg-green-500 text-black'
                            : 'text-zinc-400 hover:text-white'
                            }`}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}

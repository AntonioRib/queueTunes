import { SpotifyDevice } from '../../Services/GetAvailableDevices';

interface DevicePickerModalProps {
    devices: SpotifyDevice[];
    onSelect: (deviceId: string) => void;
    onCancel: () => void;
    onRefresh: () => void;
}

export function DevicePickerModal({ devices, onSelect, onCancel, onRefresh }: DevicePickerModalProps) {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-sm">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white text-lg font-semibold">No active device</h3>
                    <button
                        onClick={onRefresh}
                        title="Refresh devices"
                        className="text-zinc-400 hover:text-white transition-colors p-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                            <path d="M16 16h5v5" />
                        </svg>
                    </button>
                </div>
                <p className="text-zinc-400 text-sm mb-4">Pick a device to start queuing on:</p>
                <p className="text-zinc-500 text-xs mb-4">Don't see your device? Make sure Spotify is open and playing on it, then hit refresh.</p>
                <div className="flex flex-col gap-2">
                    {devices.map(device => (
                        <button
                            key={device.id}
                            onClick={() => onSelect(device.id)}
                            className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-left"
                        >
                            <span className="text-lg">
                                {device.type === 'Smartphone' ? '📱' : device.type === 'Computer' ? '💻' : '🔊'}
                            </span>
                            <div>
                                <div className="text-white text-sm font-medium">{device.name}</div>
                                <div className="text-zinc-400 text-xs">{device.type}</div>
                            </div>
                        </button>
                    ))}
                </div>
                <button
                    onClick={onCancel}
                    className="mt-4 w-full text-zinc-400 hover:text-white text-sm py-2 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

import { SpotifyDevice } from '../../Services/GetAvailableDevices';
import { strings } from '../../strings';

/** Props for {@link DevicePickerModal}. */
export interface DevicePickerModalProps {
    devices: SpotifyDevice[];
    onSelect: (deviceId: string) => void;
    onCancel: () => void;
    onRefresh: () => void;
}

const iconFor = (type: string): string => {
    if (type === 'Smartphone') return '📱';
    if (type === 'Computer') return '💻';
    return '🔊';
};

/**
 * Full-screen modal shown when no Spotify device is active at the moment
 * the user taps "Play now". Selecting a device transfers playback and
 * continues the flow automatically.
 */
export function DevicePickerModal({ devices, onSelect, onCancel, onRefresh }: DevicePickerModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-sm rounded-xl bg-zinc-900 p-6">
                <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{strings.devicePicker.title}</h3>
                    <button
                        onClick={onRefresh}
                        title={strings.devicePicker.refreshTitle}
                        className="p-1 text-zinc-400 transition-colors hover:text-white"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                            <path d="M16 16h5v5" />
                        </svg>
                    </button>
                </div>
                <p className="mb-4 text-sm text-zinc-400">{strings.devicePicker.prompt}</p>
                <p className="mb-4 text-xs text-zinc-500">
                    {strings.devicePicker.troubleshoot}
                </p>
                <div className="flex flex-col gap-2">
                    {devices.map(device => (
                        <button
                            key={device.id}
                            onClick={() => onSelect(device.id)}
                            className="flex items-center gap-3 rounded-lg bg-zinc-800 p-3 text-left transition-colors hover:bg-zinc-700"
                        >
                            <span className="text-lg">{iconFor(device.type)}</span>
                            <div>
                                <div className="text-sm font-medium text-white">{device.name}</div>
                                <div className="text-xs text-zinc-400">{device.type}</div>
                            </div>
                        </button>
                    ))}
                    {devices.length === 0 && (
                        <p className="rounded-lg bg-zinc-800 p-3 text-center text-sm text-zinc-400">
                            {strings.devicePicker.emptyList}
                        </p>
                    )}
                </div>
                <button
                    onClick={onCancel}
                    className="mt-4 w-full py-2 text-sm text-zinc-400 transition-colors hover:text-white"
                >
                    {strings.devicePicker.cancel}
                </button>
            </div>
        </div>
    );
}

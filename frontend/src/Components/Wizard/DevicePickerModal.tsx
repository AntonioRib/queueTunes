import { useRef } from 'react';
import { SpotifyDevice } from '../../Services/GetAvailableDevices';
import { strings } from '../../strings';
import { useDialogA11y } from './useDialogA11y';

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
    const dialogRef = useRef<HTMLDivElement>(null);
    useDialogA11y(dialogRef, onCancel);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={onCancel}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="device-picker-title"
                aria-describedby="device-picker-prompt"
                tabIndex={-1}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm rounded-xl bg-zinc-900 p-6"
            >
                <div className="mb-2 flex items-center justify-between">
                    <h2 id="device-picker-title" className="text-lg font-semibold text-white">
                        {strings.devicePicker.title}
                    </h2>
                    <button
                        onClick={onRefresh}
                        aria-label={strings.devicePicker.refreshTitle}
                        title={strings.devicePicker.refreshTitle}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-zinc-400 transition-colors hover:text-white"
                    >
                        <svg
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
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
                <p id="device-picker-prompt" className="mb-4 text-sm text-zinc-400">
                    {strings.devicePicker.prompt}
                </p>
                <p className="mb-4 text-xs text-zinc-400">
                    {strings.devicePicker.troubleshoot}
                </p>
                <ul className="flex flex-col gap-2">
                    {devices.map(device => (
                        <li key={device.id}>
                            <button
                                onClick={() => onSelect(device.id)}
                                className="flex w-full min-h-[44px] items-center gap-3 rounded-lg bg-zinc-800 p-3 text-left transition-colors hover:bg-zinc-700"
                            >
                                <span aria-hidden="true" className="text-lg">{iconFor(device.type)}</span>
                                <span className="flex flex-col">
                                    <span className="text-sm font-medium text-white">{device.name}</span>
                                    <span className="text-xs text-zinc-400">{device.type}</span>
                                </span>
                            </button>
                        </li>
                    ))}
                    {devices.length === 0 && (
                        <li className="rounded-lg bg-zinc-800 p-3 text-center text-sm text-zinc-400">
                            {strings.devicePicker.emptyList}
                        </li>
                    )}
                </ul>
                <button
                    onClick={onCancel}
                    className="mt-4 min-h-[44px] w-full py-3 text-sm text-zinc-400 transition-colors hover:text-white"
                >
                    {strings.devicePicker.cancel}
                </button>
            </div>
        </div>
    );
}

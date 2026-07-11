import { strings } from '../../strings';

/** Props for {@link BuildingState}. */
export interface BuildingStateProps {
    onCancel: () => void;
    /** Optional label to indicate the current stage (e.g. "Fetching songs…"). */
    label?: string;
}

/**
 * Full-screen "Building your queue…" state with a spinner and a Cancel
 * button. Cancel is wired up in the parent Wizard via an AbortController
 * on the in-flight {@link import('../../Services/PlayUris').PlayUris} call.
 */
export function BuildingState({ onCancel, label }: BuildingStateProps) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/95 p-6">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-green-500" />
            <p className="text-lg font-medium text-white">{strings.building.heading}</p>
            {label && <p className="text-sm text-zinc-400">{label}</p>}
            <button
                onClick={onCancel}
                className="rounded-full border border-zinc-700 px-6 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
                {strings.building.cancel}
            </button>
        </div>
    );
}

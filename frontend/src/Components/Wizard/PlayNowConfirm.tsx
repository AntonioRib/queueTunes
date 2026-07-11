import { useState } from 'react';
import { strings } from '../../strings';

/** localStorage key remembering the user opted out of the confirm dialog. */
export const SEEN_REPLACE_WARNING_KEY = 'wizard_seen_replace_warning';

/** Props for {@link PlayNowConfirm}. */
export interface PlayNowConfirmProps {
    onConfirm: (rememberChoice: boolean) => void;
    onCancel: () => void;
}

/**
 * First-tap-ever confirmation modal. If the user checks "Don't ask
 * again", the caller writes {@link SEEN_REPLACE_WARNING_KEY} so future
 * plays skip straight to building.
 */
export function PlayNowConfirm({ onConfirm, onCancel }: PlayNowConfirmProps) {
    const [dontAsk, setDontAsk] = useState(false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-sm rounded-xl bg-zinc-900 p-6">
                <h3 className="mb-2 text-lg font-semibold text-white">{strings.playNowConfirm.title}</h3>
                <p className="mb-4 text-sm text-zinc-400">
                    {strings.playNowConfirm.body}
                </p>
                <label className="mb-4 flex items-center gap-2 text-sm text-zinc-300">
                    <input
                        type="checkbox"
                        checked={dontAsk}
                        onChange={e => setDontAsk(e.target.checked)}
                        className="h-4 w-4 accent-green-500"
                    />
                    {strings.playNowConfirm.dontAskAgain}
                </label>
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 rounded-full border border-zinc-700 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                    >
                        {strings.playNowConfirm.cancel}
                    </button>
                    <button
                        onClick={() => onConfirm(dontAsk)}
                        className="flex-1 rounded-full bg-green-500 py-2 text-sm font-semibold text-black transition-colors hover:bg-green-400"
                    >
                        {strings.playNowConfirm.continue}
                    </button>
                </div>
            </div>
        </div>
    );
}

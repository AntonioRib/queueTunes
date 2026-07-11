import { useRef, useState } from 'react';
import { strings } from '../../strings';
import { useDialogA11y } from './useDialogA11y';

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
                aria-labelledby="play-now-confirm-title"
                aria-describedby="play-now-confirm-body"
                tabIndex={-1}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm rounded-xl bg-zinc-900 p-6"
            >
                <h2 id="play-now-confirm-title" className="mb-2 text-lg font-semibold text-white">
                    {strings.playNowConfirm.title}
                </h2>
                <p id="play-now-confirm-body" className="mb-4 text-sm text-zinc-400">
                    {strings.playNowConfirm.body}
                </p>
                <label className="mb-4 flex min-h-[44px] items-center gap-2 text-base text-zinc-300 sm:text-sm">
                    <input
                        type="checkbox"
                        checked={dontAsk}
                        onChange={e => setDontAsk(e.target.checked)}
                        className="h-5 w-5 accent-green-500"
                    />
                    {strings.playNowConfirm.dontAskAgain}
                </label>
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="min-h-[44px] flex-1 rounded-full border border-zinc-700 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                    >
                        {strings.playNowConfirm.cancel}
                    </button>
                    <button
                        onClick={() => onConfirm(dontAsk)}
                        className="min-h-[44px] flex-1 rounded-full bg-green-500 px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-green-400"
                    >
                        {strings.playNowConfirm.continue}
                    </button>
                </div>
            </div>
        </div>
    );
}

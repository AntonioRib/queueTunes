import { QueueTunesButton } from "./Components/QueueTunesButton";

interface Step3Props {
    onClick: () => void,
    disabled?: boolean
    isQueuingTunes?: boolean
}

export function Step3({ onClick, disabled, isQueuingTunes }: Step3Props) {
    return (
        <div id="step3">
            <div className="my-5 text-base font-semibold">
                3. Queue Tunes
            </div>
            <QueueTunesButton onClick={onClick} disabled={disabled} isQueuingTunes={isQueuingTunes} />
        </div>
    );
}
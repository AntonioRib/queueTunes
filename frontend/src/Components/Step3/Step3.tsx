import { QueueTunesButton } from "./Components/QueueTunesButton";

interface Step3Props {
    onClick: () => void,
    disabled?: boolean
}

export function Step3({ onClick, disabled }: Step3Props) {
    return (
        <div id="step3">
            <div className="my-5 text-base font-semibold">
                3. Queue Tunes (it will ask you to log in)
            </div>
            <QueueTunesButton onClick={onClick} disabled={disabled} />
        </div>
    );
}
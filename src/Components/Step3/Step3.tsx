import { QueueTunesButton } from "./Components/QueueTunesButton";

export function Step3() {
    return (
        <div id="step3">
            <div className="my-5 text-base font-semibold">
                3. Queue Tunes (it will ask you to log in)
            </div>
            <QueueTunesButton />
        </div>
    );
}
interface QueueTunesButtonProps {
    onClick?: () => void,
    disabled?: boolean
}

export function QueueTunesButton({ onClick, disabled }: QueueTunesButtonProps) {
    return (
        <button
            type="button"
            className={`w-full text-white font-medium rounded-lg text-lg py-2.5 transition ease-in-out duration-200 
    ${disabled ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            onClick={onClick}
            disabled={disabled}
        >
            {disabled ? "Please select a playlist" : "Queue Tunes"}
        </button>

    );
}
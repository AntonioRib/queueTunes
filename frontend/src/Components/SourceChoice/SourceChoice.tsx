import { SetStateAction } from "react";
import { PlaylistViewer } from "../PlaylistViewer/PlaylistViewer";

interface SourceChoiceProps {
    playlistUrl: string;
    setPlaylistUrl: (url: string) => void;
    playlistName?: string;
    playlistNumberOfSongs?: number;
    playlistSongsApproximate?: boolean;
    playlistFollowers?: number;
    loadingFailed: boolean;
    isLoading: boolean;
    handleRetry: () => void;
    useMySongs: boolean;
    setUseMySongs: React.Dispatch<SetStateAction<boolean>>;
}

export const SourceChoice = ({ playlistUrl, setPlaylistUrl, playlistName, playlistNumberOfSongs, playlistSongsApproximate, playlistFollowers, loadingFailed, isLoading, handleRetry, useMySongs, setUseMySongs }: SourceChoiceProps) => {
    const radioButtons = (
        <div className="flex items-center">
            <label className="flex items-center mr-3">
                <input
                    type="radio"
                    name="useMySongs"
                    checked={!useMySongs}
                    onChange={() => setUseMySongs(false)}
                    className="mr-2 accent-emerald-500"
                />
                <span className="text-sm font-medium">Use Playlist</span>
            </label>
            <label className="flex items-center">
                <input
                    type="radio"
                    name="useMySongs"
                    checked={useMySongs}
                    onChange={() => setUseMySongs(true)}
                    className="mr-2 accent-emerald-500"
                />
                <span className="text-sm font-medium">Use My Songs</span>
            </label>
        </div>
    );

    if (useMySongs) {
        return (
            <>
                {radioButtons}
            </>
        );
    }

    return (
        <>
            {radioButtons}
            <PlaylistViewer
                playlistUrl={playlistUrl}
                setPlaylistUrl={setPlaylistUrl}
                playlistName={playlistName}
                playlistNumberOfSongs={playlistNumberOfSongs}
                playlistSongsApproximate={playlistSongsApproximate}
                playlistFollowers={playlistFollowers}
                loadingFailed={loadingFailed}
                isLoading={isLoading}
                handleRetry={handleRetry}
            />
        </>
    )
};
interface PlaylistViewerProps {
    playlistUrl: string;
    setPlaylistUrl: (url: string) => void;
    playlistName?: string;
    playlistNumberOfSongs?: number;
    playlistFollowers?: number;
    loadingFailed: boolean;
}

export function PlaylistViewer({ playlistUrl, setPlaylistUrl, playlistName, playlistNumberOfSongs, playlistFollowers, loadingFailed }: PlaylistViewerProps) {
    let playlistInfo = <></>;
    if (loadingFailed) {
        playlistInfo = (
            <div className="flex flex-col justify-end items-start w-full bg-emerald-900 rounded-lg mb-5 text-white p-2">
                <h1 className="text-xl font-bold mb-1">Error loading playlist</h1>
                <p className="text-sm mb-0.5">Please check the playlist URL and try again</p>
            </div>
        );
    } else {
        playlistInfo = (
            <div className="flex flex-col justify-end items-start w-full bg-emerald-900 rounded-lg mb-5 text-white p-2">
                <h1 className="text-xl font-bold mb-1">{playlistName || "No playlist selected"}</h1>
                {playlistNumberOfSongs && <p className="text-sm mb-0.5">Songs: {playlistNumberOfSongs}</p>}
                {playlistFollowers && <p className="text-sm">Followers: {playlistFollowers}</p>}
            </div>
        );
    }

    return (
        <>
            <label htmlFor="playlist-url" className="sr-only">Playlist URL</label>
            <input
                className="w-full py-2 px-3 bg-emerald-900 border border-green-800 rounded-lg text-white mb-5"
                id="playlist-url"
                type="text"
                placeholder="Enter Playlist URL"
                title="Playlist URL"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
            />
            {playlistInfo}
        </ >
    );
}
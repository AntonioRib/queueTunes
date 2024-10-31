export function PlaylistViewer() {
    return (
        <>
            <label htmlFor="playlist-url" className="sr-only">Playlist URL</label>
            <input
                className="w-full py-2 px-3 bg-emerald-900 border border-green-800 rounded-lg text-white mb-5"
                id="playlist-url"
                type="text"
                placeholder="Enter Playlist URL"
                title="Playlist URL"
            />
            <div className="flex justify-center items-center w-full h-48 bg-emerald-900 rounded-lg mb-5"></div>
        </ >
    );
}
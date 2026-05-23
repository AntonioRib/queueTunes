interface PlaylistViewerProps {
    playlistUrl: string;
    setPlaylistUrl: (url: string) => void;
    playlistName?: string;
    playlistNumberOfSongs?: number;
    playlistSongsApproximate?: boolean;
    playlistFollowers?: number;
    loadingFailed: boolean;
    isLoading: boolean;
    handleRetry: () => void;
}

export function PlaylistViewer({ playlistUrl, setPlaylistUrl, playlistName, playlistNumberOfSongs, playlistSongsApproximate, playlistFollowers, loadingFailed, isLoading, handleRetry }: PlaylistViewerProps) {
    let playlistInfo = <></>;
    if (isLoading) {
        playlistInfo = (
            <div className="flex flex-col justify-center items-center w-full bg-emerald-900 rounded-lg mb-2 text-white p-4">
                <h1 className="text-xl font-bold mb-2">Loading playlist...</h1>
                <div className="w-5 h-5 border-4 border-white border-t-emerald-700 rounded-full animate-spin"></div>
            </div>
        );
    } else if (loadingFailed) {
        playlistInfo = (
            <div className="flex flex-col justify-end items-start w-full bg-emerald-900 rounded-lg mb-2 text-white p-2">
                <div className="flex items-center w-full">
                    <div className="flex-1">
                        <h1 className="text-xl font-bold mb-1">Error loading playlist</h1>
                        <p className="text-sm mb-0.5">
                            Please check the playlist URL and try again
                        </p>
                    </div>
                    <button
                        className="ml-4 bg-white text-emerald-900 p-2 rounded-full hover:bg-emerald-700 hover:text-white transition flex items-center justify-center"
                        onClick={handleRetry}
                        title="Retry"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 16 16">
                            <path d="M14.9547098,7.98576084 L15.0711,7.99552 C15.6179,8.07328 15.9981,8.57957 15.9204,9.12636 C15.6826,10.7983 14.9218,12.3522 13.747,13.5654 C12.5721,14.7785 11.0435,15.5888 9.37999,15.8801 C7.7165,16.1714 6.00349,15.9288 4.48631,15.187 C3.77335,14.8385 3.12082,14.3881 2.5472,13.8537 L1.70711,14.6938 C1.07714,15.3238 3.55271368e-15,14.8776 3.55271368e-15,13.9867 L3.55271368e-15,9.99998 L3.98673,9.99998 C4.87763,9.99998 5.3238,11.0771 4.69383,11.7071 L3.9626,12.4383 C4.38006,12.8181 4.85153,13.1394 5.36475,13.3903 C6.50264,13.9466 7.78739,14.1285 9.03501,13.9101 C10.2826,13.6916 11.4291,13.0839 12.3102,12.174 C13.1914,11.2641 13.762,10.0988 13.9403,8.84476 C14.0181,8.29798 14.5244,7.91776 15.0711,7.99552 L14.9547098,7.98576084 Z M11.5137,0.812976 C12.2279,1.16215 12.8814,1.61349 13.4558,2.14905 L14.2929,1.31193 C14.9229,0.681961 16,1.12813 16,2.01904 L16,6.00001 L12.019,6.00001 C11.1281,6.00001 10.6819,4.92287 11.3119,4.29291 L12.0404,3.56441 C11.6222,3.18346 11.1497,2.86125 10.6353,2.60973 C9.49736,2.05342 8.21261,1.87146 6.96499,2.08994 C5.71737,2.30841 4.57089,2.91611 3.68976,3.82599 C2.80862,4.73586 2.23802,5.90125 2.05969,7.15524 C1.98193,7.70202 1.47564,8.08224 0.928858,8.00448 C0.382075,7.92672 0.00185585,7.42043 0.0796146,6.87364 C0.31739,5.20166 1.07818,3.64782 2.25303,2.43465 C3.42788,1.22148 4.95652,0.411217 6.62001,0.119916 C8.2835,-0.171384 9.99651,0.0712178 11.5137,0.812976 Z" />
                        </svg>
                    </button>
                </div>
            </div>


        );
    } else {
        playlistInfo = (
            <div className="flex flex-col justify-end items-start w-full bg-emerald-900 rounded-lg mb-2 text-white p-3">
                <h1 className="text-xl font-bold mb-1">{playlistName || "No playlist selected"}</h1>
                <div className="flex gap-4 text-sm text-emerald-200">
                    {playlistNumberOfSongs !== undefined && <span>{playlistNumberOfSongs}{playlistSongsApproximate ? '+' : ''} songs</span>}
                    {!!playlistFollowers && <span>{playlistFollowers.toLocaleString()} followers</span>}
                </div>
            </div>
        );
    }

    return (
        <div className="mt-5">
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
        </div>
    );
}
import React from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <div className="bg-black min-h-screen flex flex-col items-center justify-center text-white">
        <div className="mb-10 font-light text-8xl text-white tracking-wide">
          <div>QueueTunes</div>
        </div>
        <div id="column" className="max-w-md min-w-60 text-start bg-emerald-900 border border-green-900 rounded-lg p-10 shadow-lg">
          <div id="step1">
            <div className="mb-5 text-lg">
              1. Add the podcasts you want to your Spotify Queue
            </div>
          </div>
          <div id="step2" className="flex flex-col items-center">
            <div className="my-5 text-lg">
              2. Add the playlist you'll want to queue and choose the podcast-to-song ratio
            </div>
            <input
              className="w-full py-2 px-3 bg-emerald-950 border border-green-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 mb-5"
              id="playlist-url"
              type="text"
              placeholder="Enter Playlist URL"
            />
            <div className="flex justify-center items-center w-full h-48 bg-emerald-950 rounded-lg mb-5"></div>
            <div className="w-full text-start mb-5">
              <label htmlFor="ratio" className="text-white font-medium">Ratio</label>
              <input
                id="ratio"
                type="range"
                min="0"
                max="100"
                className="w-full h-2 bg-emerald-800 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
            </div>
          </div>
          <div id="step3">
            <div className="my-5 text-lg">
              3. Queue Tunes (it will ask you to log in)
            </div>
            <button
              type="button"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-lg py-2.5 transition ease-in-out duration-200"
            >
              Queue Tunes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
# [QueueTunes](https://happy-ground-0d8a70103.4.azurestaticapps.net/)

Do you consistently have to add music in between podcast episodes on Spotify? QueueTunes is a tool to intertwine songs with your Spotify Podcasts.

All you have to do is, add the podcasts to your Spotify queue, tell which playlist you want to use, set a few settings and QueueTunes!

If you only want to use it, you can do it [here](https://happy-ground-0d8a70103.4.azurestaticapps.net/).

### Built with

- Frontend

  - React
  - Tailwind

- Backend
  - Node.js
  - Express.js

### Open Issues

- Spotify APIs dont allow to re-arrange the queue or to add tracks on specific places of the queue, so we hack it a bit by adding everything at the bottom and forward the number of episodes.
- The Queue coming from the Spotify APIs is weird and filled with things that arent really on the queue (or at least the user doesnt know they are). So we ask for how many episodes the user wants to use.

# Tridify Multi-user-viewer

A multi-user-web-viewer for displaying building models converted in Tridifys cloud converting service https://www.tridify.com/.
Tridifys converting service allows you to convert BIM and architectural CAD models into gltf-files that can be turned in to 3D environments.

Rough objects for Multiuser Viewer:
- User gets model-spesific URL for multi-user-viewer from Tridifys conversion service
- Viewer displays model according to URL
- User can share (session ID / URL) so that other users can 

## Using URL parameters

Go to https://localhost:8080/?model={model-hash}
Then press "Create room"
Model will be loaded

default hash: iyN_Ip9hznKe0DVpD8uACqq-SuVaI0pzc33UkpbwzRE
example url: https://localhost:8080/?model=iyN_Ip9hznKe0DVpD8uACqq-SuVaI0pzc33UkpbwzRE

Repo forked from https://github.com/mozilla/hubs.git.

## README.md from mozilla.hubs:

[![Build Status](https://travis-ci.org/mozilla/hubs.svg?branch=master)](https://travis-ci.org/mozilla/hubs)

The client-side code for https://hubs.mozilla.com/, a multi-user experience in WebVR. Built with
[A-Frame](https://github.com/aframevr/aframe/).

## Getting Started

To run the client, run:

```sh
git clone https://github.com/mozilla/hubs.git
cd hubs
npm ci
npm start
```

Then visit https://localhost:8080 (note: HTTPS is required)

Note: When running the Hubs client locally, you will still connect to the development versions of our [Janus WebRTC](https://github.com/mozilla/janus-plugin-sfu) and [reticulum](https://github.com/mozilla/reticulum) servers. 

## Building Static Files

To bundle javascript and generate the html templates, run:

```sh
npm run build
```

## Sharing Your Changes

When running a local copy of Hubs as-is, you'll use Mozilla's "dev" Reticulm and Janus servers
for storing your room information and relaying messages between users in the room.

This also means you can upload a modified copy of Hubs to a hosting provider as-is, and use it
without having to set up your own servers. Simply run:

```
npm run build
```

and then upload the files in the `dist` folder to your hosting provider.

If you are running your own servers, you can modify the environment variable
`RETICULUM_SERVER` when building to point Hubs to your own infrastructure.

See `.env.defaults` for the full set of environment variables that can modify
Hubs' behavior at build time.

## hubs.local Host Entry

When running the full stack for Hubs (which includes [Reticulum](https://github.com/mozilla/reticulum))
locally it is necessary to add a `hosts` entry pointing `hubs.local` to your local server's IP.
This will allow the CSP checks to pass that are served up by Reticulum so you can test the whole app. Note that you must also laod hubs.local over https.

## Query Params

- `allow_multi` - Allow multiple instances off the app in the same browser session
- `avatar_scale` - Scale your self!
- `quality` - Either "low" or "high". Force assets to a certain quality level
- `mobile` - Force mobile mode
- `no_stats` - Disable performance stats
- `vr_entry_type` - Either "2d", "vr", or "daydream". Used internally to force a VR entry type. Add "_now" to the end of the value to skip the audio check.
- `disable_telemetry` - If `true` disables Sentry telemetry.
- `log_filter` - A `debug` style filter for setting the logging level.
- `debug` - If `true` performs verbose logging of Janus and NAF traffic.
- `vrstats` - If `true` shows stats in VR.
- `debug_log` - If `true`, enables an on-screen debug log and console. Useful for debugging on mobile devices.
- `userinput_debug` - If `true`, enables an on-screen userinput debug status panel. Press "L" on your keyboard to show the panel.
- `thirdPerson` - Enables experimental third person mode.

## Additional Resources

* [Reticulum](https://github.com/mozilla/reticulum) - Phoenix-based backend for managing state and presence.
* [NAF Janus Adapter](https://github.com/mozilla/naf-janus-adapter) - A [Networked A-Frame](https://github.com/networked-aframe) adapter for the Janus SFU service.
* [Janus Gateway](https://github.com/meetecho/janus-gateway) - A WebRTC proxy used for centralizing network traffic in this client.
* [Janus SFU Plugin](https://github.com/mozilla/janus-plugin-sfu) - Plugins for Janus which enables it to act as a SFU.
* [Hubs-Ops](https://github.com/mozilla/hubs-ops) - Infrastructure as code + management tools for running necessary backend services on AWS.

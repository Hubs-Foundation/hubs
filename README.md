[![Build Status](https://travis-ci.org/mozilla/hubs.svg?branch=master)](https://travis-ci.org/mozilla/hubs)

A prototype client demonstrating a multi-user experience in WebVR. Built with
[A-Frame](https://github.com/aframevr/aframe/)

## Getting Started

To run the social client, run:

```sh
git clone https://github.com/mozilla/hubs.git
yarn install
yarn start
```

## Building Static Files

To bundle javascript and generate the html templates, run:

```sh
yarn build
```

## hubs.local Host Entry

When running the full stack for Hubs (which includes [Reticulum](https://github.com/mozilla/reticulum))
locally it is necessary to add a `hosts` entry pointing `hubs.local` to your local server's IP.
This will allow the CSP checks to pass that are served up by Reticulum so you can test the whole app.

## Query Params

- `room` - Id of the room (an integer) that you want to join
- `allow_multi` - Allow multiple instances off the app in the same browser session
- `enable_screen_sharing` - Enable screen sharing
- `accept_screen_shares` - Display screens shared by other users
- `avatar_scale` - Scale your self!
- `quality` - Either "low" or "high". Force assets to a certain quality level
- `mobile` - Force mobile mode
- `no_stats` - Disable performance stats
- `vr_entry_type` - Either "2d", "vr", or "daydream". Used internally to force a VR entry type. Add "_now" to the end of the value to skip the audio check.
- `disable_telemetry` - If `true` disables Sentry telemetry.
- `log_filter` - A `debug` style filter for setting the logging level.
- `debug` - If `true` performs verbose logging of Janus and NAF traffic.

## Additional Resources

* [Reticulum](https://github.com/mozilla/reticulum) - Phoenix-based backend for managing state and presence.
* [NAF Janus Adapter](https://github.com/mozilla/naf-janus-adapter) - A [Networked A-Frame](https://github.com/networked-aframe) adapter for the Janus SFU service.
* [Janus Gateway](https://github.com/meetecho/janus-gateway) - A WebRTC proxy used for centralizing network traffic in this client.
* [Janus SFU Plugin](https://github.com/mozilla/janus-plugin-sfu) - Plugins for Janus which enables it to act as a SFU.
* [Hubs-Ops](https://github.com/mozilla/hubs-ops) - Infrastructure as code + management tools for running necessary backend services on AWS.

[![Waffle.io - Columns and their card count](https://badge.waffle.io/mozilla/socialmr.svg?columns=all)](http://waffle.io/mozilla/socialmr)

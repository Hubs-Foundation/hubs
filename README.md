# Mozilla Social Mixed Reality Client

A prototype client demonstrating a multi-user experience in WebVR. Built with
[A-Frame](https://github.com/aframevr/aframe/)

## Getting Started

To run the social client, run:

```sh
git clone https://github.com/mozilla/mr-social-client.git
yarn install
yarn start
```

## Building Static Files

To bundle javascript and generate the html templates, run:

```sh
yarn build
```

## Query Params

- `room` - Id of the room (an integer) that you want to join
- `allow_multi` - Allow multiple instances off the app in the same browser session
- `enable_screen_sharing` - Enable screen sharing
- `accept_screen_shares` - Display screens shared by other users
- `avatar_scale` - Scale your self!
- `quality` - Either "low" or "high". Force assets to a certain quality level
- `mobile` - Force mobile mode
- `no_stats` - Disable performance stats
- `vr_entry_type` - Either "gearvr" or "daydream". Used internally to force a VR entry type

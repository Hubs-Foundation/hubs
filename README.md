# Hubs

[![License: MPL 2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)

The client-side code for Hubs, an online 3D collaboration platform that works for desktop, mobile, and VR platforms.

## Getting Started

If you would like to run Hubs on your own servers, check out [Hubs Community Edition](https://github.com/Hubs-Foundation/hubs-cloud/tree/master/community-edition).

If you would like to deploy a custom client to your existing Hubs Cloud instance please refer to [this guide](https://docs.hubsfoundation.org/hubs-cloud-custom-clients.html).

If you would like to contribute to the main fork of the Hubs client please see the [contributor guide](./CONTRIBUTING.md).

If you just want to check out how Hubs works and make your own modifications continue on to our Quick Start Guide.

### Quick Start

[Install NodeJS](https://nodejs.org) if you haven't already. We use 16.16.0 on our build servers. If you work on multiple javascript projects it may be useful to use something like [NVM](https://github.com/nvm-sh/nvm) to manage multiple versions of node for you.

Run the following commands:

```bash
git clone https://github.com/Hubs-Foundation/hubs.git
cd hubs
# nvm use v16.16.0 # if using NVM
npm ci
npm run dev
```

The backend dev server is configured with CORS to only accept connections from "hubs.local:8080", so you will need to access it from that host. To do this, you likely want to add "hubs.local" and "hubs-proxy.local" to the [local "hosts" file](https://phoenixnap.com/kb/how-to-edit-hosts-file-in-windows-mac-or-linux) on your computer:

```
127.0.0.1	hubs.local
127.0.0.1	hubs-proxy.local
```

Then visit https://hubs.local:8080 (note: HTTPS is required, you'll need to accept the warning for the self-signed SSL certificate)

> Note: When running the Hubs client locally, you will still connect to the development versions of the [reticulum](https://github.com/Hubs-Foundation/reticulum) server. This server does not allow being accessed outside of localhost. If you want to host your own Hubs servers, please check out [Hubs Community Edition](https://github.com/Hubs-Foundation/hubs-cloud/tree/master/community-edition).

## Contributing

Read our [contributor guide](./CONTRIBUTING.md) to learn how you can submit bug reports, feature requests, and pull requests.

We're also looking for help with localization. The Hubs redesign has a lot of new text and we need help from people like you to translate it. Follow the [localization docs](./src/assets/locales/README.md) to get started.

Contributors are expected to abide by the project's [Code of Conduct](./CODE_OF_CONDUCT.md) and to be respectful of the project and people working on it.

## Additional Resources

* [Reticulum](https://github.com/Hubs-Foundation/reticulum) - Phoenix-based backend for managing state and presence.
* [Networked A-Frame](https://github.com/Hubs-Foundation/networked-aframe).
* [Hubs-Ops](https://github.com/Hubs-Foundation/hubs-ops) - Infrastructure as code + management tools for running necessary backend services on AWS.

## License

Hubs is licensed with the [Mozilla Public License 2.0](./LICENSE)


# Contributing

This page outlines opportunities for people who want to contribute to the Hubs project. We welcome external contributions that align with the project's mission around enabling collaboration and communication through shared 3D spaces. You can find information about how to contribute to Hubs and the supporting projects that make up the platform here. 

Contributors are expected to abide by the project's [Code of Conduct](CODE_OF_CONDUCT.md) and to be respectful of the project and people working on it. 

The following GitHub projects are part of the Hubs platform and governed by these contributing guidelines: 

* https://github.com/mozilla/hubs/ - the core Hubs project
* https://github.com/mozilla/spoke - 3D editor for creating scenes
* https://github.com/mozilla/janus-plugin-sfu - networking
* https://github.com/mozilla/reticulum - server infrastructure for Hubs
* https://github.com/mozilla/hubs-ops - operations infrastructure for Hubs
* https://github.com/MozillaReality/hubs-discord-bot - Hubs' Discord integration

## Quick Start

We are happy to receive contributions to the Hubs platform in a number of different ways as outlined below. Please note that all contributions are subject to approval by the project maintainers. We ask (but do not require) that those interested in contributing to Hubs consider joining the public [Hubs Discord server](https://discord.gg/wHmY4nd) to connect with the dev team, ask questions, and view discussions about work being done on the project. 

### 💻 Code Contributions
Hubs has a client-server architecture that gives multiple users the ability to connect to a shared room on the server. If you are interested in contributing to the Hubs client, continue on to the [development workflow guide](#development-workflow) to get started. If you want to contribute to the networking or infrastructure, consider looking at the [reticulum](https://github.com/mozilla/reticulum) or [janus](https://github.com/mozilla/janus-plugin-sfu) repositories. If you are interested in working on the code for Spoke, the 3D editor used to create custom environments for Hubs rooms, explore the [Spoke](https://github.com/mozilla/spoke) repository.

For more information on the inner workings of Hubs and the architectural decisions behind the project, check out [this presentation on the Mozilla Hubs Code Base](https://vimeo.com/365531296) by Engineering Lead Greg Fodor.

Issues that are open are tagged. If you explore a bug or feature request that you'd like to fix, make a comment on the case so we know you're looking into it! We try to use the '[good first issue](https://github.com/mozilla/hubs/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)' tag to identify some cases that may be easier than others to begin with as you get started with the code base. 

Steps to contributing code to the Hubs project:

1. Clone the repo you want to contribute to and get things running locally
2. Find an issue or improvement that you want to fix - give us a heads up that you're working on it by dropping in a comment on the issue.
3. Fix the bug! Test out your changes on your local setup and let us know if you have questions or want another opinion about the fix. 
4. Submit your PR for a code review and someone from the team will take a look and give feedback. Make sure you follow up! We'll close the PR if it seems like you've abandoned it by not responding to any questions or comments we leave in the review. If your PR adds a new feature, consider requesting the 'What's New' tag. With the 'What's New' tag, any text in the main body of the PR up to (and including) an image will be added to the [hubs website](https://hubs.mozilla.com/whats-new). Gifs are especially appreciated! [This pull request](https://github.com/mozilla/hubs/pull/1536) shows an example of how the 'What's New' tag can be used.
5. Celebrate! 🎉 You're helping Mozilla's mission to make the web an open and accessible place for social experiences! 

### 🐛Filing Issues and Feature Requests
Reporting bugs, feature requests, and questions that you have about the platform helps the team prioritize the work that we're doing and make Hubs better! We welcome user-submitted issues and use Github's built-in issue tracking for our bug reporting process. 

* If you are filing a bug, please include information about the operating system, device, and browser that you were using when you saw the bug. _Example: Seen on Windows 10 with Firefox 66.0.5 on Oculus Rift_

* The more detail the better! If you are able to reproduce a bug on multiple different browsers or on both desktop and mobile, that information is helpful for us to know about

* Screenshots when appropriate are much appreciated 📷

We will do our best to respond to and tag inbound issues as they are submitted in a timely manner. Bugs will be prioritized according to the following table: 

| Priority  | Criteria | Example |
| ------------- | ------------- | -------------
| P0 | Needs immediate attention. Affects many users and their ability to use core product functionality of connecting to rooms with other users. | No one can enter any Hubs rooms with any VR headset |
| P1 | Address as quickly as possible. Affects many users and their ability to use a common product feature. Workaround is difficult or unavailable. | Teleporting doesn't work for users on Quest with the Oculus browser. |
| P2 | Address when able. Affects some users regularly but mildly, or is a hard-to-repro failure seen rarely that is fixed with an easy workaround. | Lobby camera in Camera mode does not show emojis shared from iOS. <br><br> One user reports getting disconnected after ten minutes in a particular room, but no one else experiences it and they are able to refresh to re-enter.
| P3 | Address when able after P2 bugs are fixed. Affects a small set of users inconsistently in a non-breaking way with an easy workaround. | Every so often, a standalone VR headset will show up as a mobile phone in the user list. Refreshing fixes it. |

### 🎨 3D Art
If you are a 3D artist and want to support what we're doing with Hubs, consider creating and releasing content under a Creative Commons license or creating scenes using the [Spoke scene editor](https://hubs.mozilla.com/spoke) and releasing them as remixable environments. Content with low polygon counts that are optimized to run well on the web are much appreciated! In particular, we'd love to see scenes that capture a wide range of experiences. 

### 📜 Documentation 
Our documentation for Hubs is hosted on the [GitHub Hubs Wiki](https://github.com/mozilla/hubs/wiki) section of the project. The documentation for Spoke is hosted on the [GitHub Spoke Wiki](https://github.com/mozilla/spoke/wiki) For contributing corrections or additional pages for the Wiki, please file an issue as a suggestion in the corresponding repository with your proposed content and we will review it and add it to the wiki when all looks good! 

### 🌐 Localization 
If you would like to add/update a localization translation for Hubs, please see the [Localization README](src/assets/locales/README.md). Then, please submit a pull request with your new/updated localization changes.

### 🦆 General Help
We believe in the power of community (that's why we're building this, after all!) and know that not all forms of support will come from something outlined here. Feel free to jump into our public [Discord server](https://discord.gg/wHmY4nd) to chat with us and ask about how you can get involved!

## Development Workflow

Getting set up to work on the Hubs client main fork is a little different than working on a custom client for a Hubs Cloud deployment. If you're looking to set up your development environment for your own Hubs Cloud deployment see [this guide](https://hubs.mozilla.com/docs/hubs-cloud-custom-clients.html).

### 0. Dependencies

[Install NodeJS](https://nodejs.org) if you haven't already. We recommend version 12 or above.

### 1. Setting up the Repository

Clone the Hubs repository and install the npm dependencies.

```bash
git clone https://github.com/mozilla/hubs.git
cd hubs
npm ci
```

> Note: We recommend using `npm ci` instead of `npm install` so that you always use the versions of modules in the `package-lock.json` file.

### 2. Start Webpack Dev Server

There are 3 different commands for starting up the client's webpack-dev-server in different environments:

#### `npm run dev`

This command runs the client against the Mozilla dev cluster. If you're just doing frontend development on the main fork of Hubs, this is probably the command you should be using.

> Note: When using this command, the client will use a default configuration with all features enabled.

#### `npm start`

This command requires you to be logged into a Hubs Cloud instance. You can login using `npm run login`, you will need an admin account on the server to be able to use this command.

> Note: When using this command, the client will pull the client configuration from the Hubs Cloud instance. So you will have the same settings as you do in the admin panel.

#### `npm run local`

This command runs against local services. You'll use this if you are running an instance of Reticulum locally. More info on how to run Reticulum locally is located [here](https://github.com/mozilla/reticulum#run-hubs-against-a-local-reticulum-instance).

> Note: When using this command, the client will use a default configuration with all features enabled.

### 3. Navigate To The Client Page

Once the server is running you can navigate to:

https://localhost:8080

> Note the client runs over https with a self-signed SSL certificate. You'll be presented with a warning the first time you open the page. You can accept the SSL certificate warning and continue onto the site.

You should see the Hubs client landing page. Whenever you make a change to a file in the `hubs/src` directory, the webpage should refresh.

### 4. Modifying The Code

The Hubs client's code is located in the `hubs/src` directory. Hubs is written in javascript. We use Babel for transpilation and support and encourage most modern javascript features. We use Prettier for code formatting and ESLint for linting. Whenever you make a PR our continuous integration servers lint your code. Make sure you set up your editor or run `npm run lint` before you submit your code.

The testing process for Hubs is mostly a manual one. You need to test your changes thoroughly in the client. You also should check that your change runs in the smoke test environment. You can access it at https://localhost:8080/hub.html?hub_id=smoke (It's a pretty weird space... headphones are recommended if you don't want to disturb your co-workers). The smoke test environment contains a variety of media that is all intended to load and run properly. If something looks broken or different with your changes, you may have a regression in your code.

The Hubs team has a more in-depth testing and release process internally, but we don't have any additional testing process for external contributors at this time.

### 5. High Level Project Organization

```
hubs/
  admin/ <- The admin panel project directory
  src/
    assets/ <- Static assets and stylesheets, loaded by Webpack
    components/ <- AFrame Components
    loaders/ <- Hubs' custom Three.js loaders
    materials/ <- Hubs' custom Three.js materials
    react-components/ <- All of the UI components for the Hubs website, HUD, etc.
    storage/ <- Central state stores for the user's account and media
    systems/ <- AFrame Systems
      userinput/ <- Files associated with the user-input system. See the userinput.md file for more details
      hubs-systems.js <- Where we register systems of our own design pattern that are guaranteed to run in a predefined order.
    utils/ <- Assorted modules of utility functions
    vendor/ <- Third Party vendor code
    workers/ <- WebWorker entry points
    avatar.html <- Avatar Page html template
    avatar.js <- Avatar Page js entry point
    gltf-component-mappings.js <- Where we register custom glTF components that are inflated when loading glTF scenes, avatars, and objects.
    hub.html <- Hub Page html template
    hub.js <- Hub Page js entry point
    index.html <- Landing Page html template
    index.js <- Landing Page js entry point
    link.html <- Short Link Page html template
    link.js <- Link Page js entry point
    network-schemas.js
    scene.html <- Scene Page html template
    scene.js <- Scene Page js entry point
```
### 6. Testing on an HMD

The simplest way to test on an HMD is to use `npm run dev` from Step 2 above while having 8080 port traffic on your device point to you local dev instance's port 8080. In order to do that, you'll need to do a few things that will vary per device. 

### Oculus Quest

These steps are what's necessary to enable development on your device

1. Setup the Quest device for development.
    https://developer.oculus.com/documentation/native/android/mobile-device-setup/
    (Join or create an organization then enable Developer Mode)

2. Configure the Quest device, via adb (Android Debug Bridge), to route port 8080 requests to the local webserver (that `npm run dev` starts up).
    https://developer.android.com/studio/command-line/adb
    (Detailed instructions are there for setting up wired and wireless connections)

    Useful commands during this process
    ----------------------------------
    `adb devices -l`
    Lists all connected devices. The -l flag will list device specific details, one of which should be: `model:Quest`
    
    `adb -s model:Quest reverse tcp:8080 tcp:8080`
    `adb reverse tcp:8080 tcp:8080`
    This command routes all port 8080 requests from the Quest device to port 8080 on your local web server. The first one is if you want to do things wirelessly, while the second is a quicker (albeit tethered) solution that is less prone to the error below.

    If you encounter the following error:
    adb: error: more than one device/emulator

    Try killing and restarting adb with the following commands:
     `adb kill-server`
     `adb start-server`
    Then retry the reverse command above again

3. Open a browser on the Quest device and test.
    Go to the following url: `https://localhost:8080` in the Oculus broswer or Firefox Reality browser

    > Note the client runs over https with a self-signed SSL certificate. You'll be presented with a warning the first time you open the page. You can accept the SSL certificate warning and continue onto the site.

4. You should see the Hubs index page, the same one you see in a browser on your development machine.

### Other Devices

Please feel free to contribute setup instructions for additional devices.

- [Technologies and Backend Services](#org3f3162a)
- [How the code is organized](#orga3ec246)
- [Where to go from here](#org6def927)
  - [Core Concepts for Gameplay Code](#org619c8bf)
  - [Interactivity](#org4758997)
  - [Networking](#orgc703920)

The Hubs client is a web application that runs in each user&rsquo;s web browser. It contains the HTML, CSS, and Javascript necessary to simulate a networked 3D world and display interactive 2D menus. This document provides an overview of the Hubs client: the technologies it uses, the backend services it connects to, and how its code is organized.


<a id="org3f3162a"></a>

# Technologies and Backend Services

The client combines several libraries and technologies to provide this experience to users, and offers developers various ways to change and extend its functionality.

These are the main technologies in use by the hubs client:

-   `Three.js` : `Three.js` is a 3D graphics and scene graph library for building and creating 3D scenes. Three.js makes it easier to use the browser&rsquo;s built-in graphics capabilities, such as WebGL, WebXR, and WebGPU (someday).
-   `bitECS` : `bitECS` is an ECS library for managing game state that lives outside the Three.js scene graph. In the Hubs client, most &ldquo;things&rdquo; (avatars, images, an animated emoji) are referenced by an entity ID. This entity ID is used to access component data stored in pre-allocated `TypedArrays`.
-   `Media Capture and Streams API`, `WebRTC`, and `WebAudio` : The `Media Capture and Streams API` allows microphones, cameras, and screencapture to be accessed within the browser. Data is captured and encoded locally before being sent (as `WebRTC` streams) to a backend service (`Dialog`), where they are forwarded to other clients connected to the same room. Incoming streams are decoded and transformed (e.g. by `PannerNode` s and `GainNodes` from the `WebAudio` API) before being played through the user&rsquo;s speakers.
-   `HTTP`, `Web Sockets` : The Hubs client is web app, which means its code is downloaded when you visit a hubs-powered site. After its initial load, the hubs client exchanges many, many messages to the backend web server, `Reticulum`. To download assets like 3D model files and 2D images, the client makes `HTTP` requests. To exchange game state information like, &ldquo;where my avatar is moving&rdquo;, the client sends messages over a `Web Socket` connection (specifically, via `Phoenix channels`).
-   `Webpack and npm` : The Hubs client is built and bundled by `Webpack`. Building the client (or custom versions of the client) typically involves running a few commands with `npm`.
-   `Typescript` : `Typescript` is a superset of Javascript that compiles to Javascript. We adopted typescript in 2022. While we are not trying to rewrite all of our existing javascript, new code is usually written in typescript.


<a id="orga3ec246"></a>

# How the code is organized

There are three main sections of application code:

The `admin` directory contains a separate application that powers the Hubs admin panel. Note that this directory will likely undergo changes in the near future.

The `react-components` directory contains all of the 2D UI shown in menus, modals, and toolbars throughout the client. It is built with `React`.

The `src` directory contains of the code that powers the 3D simulation. The entry points for various pages are defined in `webpack.config.js`.


<a id="org6def927"></a>

# Where to go from here

Check out the other docs. They cover


<a id="org619c8bf"></a>

## Core Concepts for Gameplay Code


<a id="org4758997"></a>

## Interactivity


<a id="orgc703920"></a>

## Networking

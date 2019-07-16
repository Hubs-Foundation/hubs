/**
 * aframe-entry.js
 *
 * This file sets up Three.js and AFrame with our custom patches. Import in any entry point where AFRAME is needed.
 *
 * Do not use import in this file, only use require() (import is asynchronous and its execution order is unpredictable)
 * Anything that mutates the AFRAME or THREE global variables should be required in this file.
 *
 * TODO: Eventually we will port completely to esmodules and this file will no longer be necessary.
 */

window.THREE = require("three");

// Mutate THREE global:
require("./utils/webgl").patchWebGLRenderingContext();
require("./utils/audio-context-fix");
require("./utils/threejs-positional-audio-updatematrixworld");
require("./utils/threejs-world-update");
require("./utils/threejs-video-texture-pause");

THREE.TextureLoader = require("./loaders/HubsTextureLoader");

require("three/examples/js/loaders/GLTFLoader");
require("three/examples/js/pmrem/PMREMGenerator");
require("three/examples/js/pmrem/PMREMCubeUVPacker");
require("three/examples/js/controls/OrbitControls");

require("aframe");

// Mutate AFRAME global here if necessary:

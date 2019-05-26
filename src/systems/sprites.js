// Sprite rendering
// We have a lot of 2D images that are each rendered separately in hubs.
// Our goal is to render them all at once.

// TODO: Write explainer for spritesheet generation
import spritesheet from "../assets/images/hud/spritesheet.json";
import { createImageTexture } from "../components/media-views.js";
import spritesheetPng from "../assets/images/hud/spritesheet.png";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import vert from "./sprites/sprite.vert";
import frag from "./sprites/sprite.frag";

// We'll replace
//   <a-image ... ></a-image>
// with,
//   <a-entity sprite="name: foo"></a-entity>
// where sprite is an aframe component:
AFRAME.registerComponent("sprite", {
  schema: { name: { type: "string" } }
});

const spritesheetSize = spritesheet.meta.size;
const sprite1Frame = spritesheet.frames["create_object-hover.png"].frame;
const sprite1 = {
  x: sprite1Frame.x / spritesheetSize.w,
  y: sprite1Frame.y / spritesheetSize.h,
  w: sprite1Frame.w / spritesheetSize.w,
  h: sprite1Frame.h / spritesheetSize.h
};

const sprite2Frame = spritesheet.frames["spawn.png"].frame;
const sprite2 = {
  x: sprite2Frame.x / spritesheetSize.w,
  y: sprite2Frame.y / spritesheetSize.h,
  w: sprite2Frame.w / spritesheetSize.w,
  h: sprite2Frame.h / spritesheetSize.h
};

const bufferDatas = {
  mvCols: new Float32Array([
    1.0, 0, 0, 0,
    0, -1, 0, 0,
    0, 0, 1, 0,
    -0.5, 0, 0, 1,
    1.0, 0, 0, 0,
    0, -1, 0, 0,
    0, 0, 1, 0,
    -0.5, 0, 0, 1,
    1.0, 0, 0, 0,
    0, -1, 0, 0,
    0, 0, 1, 0,
    -0.5, 0, 0, 1,
    1.0, 0, 0, 0,
    0, -1, 0, 0,
    0, 0, 1, 0,
    -0.5, 0, 0, 1,

    1.0,
    0,
    0,
    0,
    0,
    -1,
    0,
    0,
    0,
    0,
    1,
    0,
    0.5,
    0,
    0,
    1,
    1.0,
    0,
    0,
    0,
    0,
    -1,
    0,
    0,
    0,
    0,
    1,
    0,
    0.5,
    0,
    0,
    1,
    1.0,
    0,
    0,
    0,
    0,
    -1,
    0,
    0,
    0,
    0,
    1,
    0,
    0.5,
    0,
    0,
    1,
    1.0,
    0,
    0,
    0,
    0,
    -1,
    0,
    0,
    0,
    0,
    1,
    0,
    0.5,
    0,
    0,
    1
  ]),
  mvs: new Float32Array([
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    -0.4,
    0,
    1,
    0.3,
    0,
    0,
    0,
    0,
    0.3,
    0,
    0,
    0,
    0,
    0.3,
    0,
    0,
    1.0,
    0,
    1
  ]),
  uvs: new Float32Array([
    sprite1.x,
    sprite1.y + sprite1.h,

    sprite1.x + sprite1.w,
    sprite1.y + sprite1.h,

    sprite1.x,
    sprite1.y,

    sprite1.x + sprite1.w,
    sprite1.y,

    sprite2.x,
    sprite2.y + sprite2.h,

    sprite2.x + sprite2.w,
    sprite2.y + sprite2.h,

    sprite2.x,
    sprite2.y,

    sprite2.x + sprite2.w,
    sprite2.y
  ]),
  vertices: new Float32Array([
    -0.5,
    0.5,
    0,

    0.5,
    0.5,
    0,

    -0.5,
    -0.5,
    0,

    0.5,
    -0.5,
    0,

    -0.1,
    0.1,
    0,

    0.1,
    0.1,
    0,

    -0.1,
    -0.1,
    0,

    0.1,
    -0.1,
    0
  ]),
  indices: new Uint16Array([0, 2, 1, 1, 2, 3, 4, 6, 5, 5, 6, 7])
};

export class SpriteSystem {
  constructor(scene) {
    Promise.all([createImageTexture(spritesheetPng), waitForDOMContentLoaded()]).then(([spritesheetTexture]) => {
      const geometry = new THREE.BufferGeometry();
      geometry.addAttribute("a_vertices", new THREE.BufferAttribute(bufferDatas.vertices, 3, false));
      geometry.addAttribute("a_uvs", new THREE.BufferAttribute(bufferDatas.uvs, 2, false));
      const mvCols = new THREE.InterleavedBuffer(bufferDatas.mvCols, 16);
      geometry.addAttribute("mvCol0", new THREE.InterleavedBufferAttribute(mvCols, 4, 0, false));
      geometry.addAttribute("mvCol1", new THREE.InterleavedBufferAttribute(mvCols, 4, 4, false));
      geometry.addAttribute("mvCol2", new THREE.InterleavedBufferAttribute(mvCols, 4, 8, false));
      geometry.addAttribute("mvCol3", new THREE.InterleavedBufferAttribute(mvCols, 4, 12, false));
      geometry.setIndex([0, 2, 1, 1, 2, 3, 4, 6, 5, 5, 6, 7]);
      const material = new THREE.RawShaderMaterial({
        uniforms: {
          u_spritesheet: { value: spritesheetTexture }
        },
        vertexShader: vert,
        fragmentShader: frag,
        side: THREE.DoubleSide,
        transparent: true
      });
      this.mesh = new THREE.Mesh(geometry, material);
      const el = document.createElement("a-entity");
      scene.appendChild(el);
      el.setObject3D("mesh", this.mesh);
    });
  }
}

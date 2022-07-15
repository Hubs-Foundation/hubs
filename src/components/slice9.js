/* global AFRAME */
import { textureLoader } from "../utils/media-utils";

import actionButtonSrc from "../assets/hud/action_button.9.png";
import buttonSrc from "../assets/hud/button.9.png";
import nametagSrc from "../assets/hud/nametag.9.png";
import nametagBorderSrc from "../assets/hud/nametag-border.9.png";

const textures = {
  "action-button": {
    tex: textureLoader.load(actionButtonSrc),
    width: 128,
    height: 128
  },
  button: {
    tex: textureLoader.load(buttonSrc),
    width: 128,
    height: 128
  },
  nametag: {
    tex: textureLoader.load(nametagSrc),
    width: 128,
    height: 128
  },
  "nametag-border": {
    tex: textureLoader.load(nametagBorderSrc),
    width: 128,
    height: 128
  }
};

function parseSide(side) {
  switch (side) {
    case "back": {
      return THREE.BackSide;
    }
    case "double": {
      return THREE.DoubleSide;
    }
    default: {
      // Including case `front`.
      return THREE.FrontSide;
    }
  }
}

/**
 * Slice9 component for A-Frame.
 */
AFRAME.registerComponent("slice9", {
  schema: {
    alphaTest: { default: 0.0 },
    bottom: { default: 0, min: 0 },
    color: { type: "color", default: "#fff" },
    debug: { default: false },
    height: { default: 1, min: 0 },
    left: { default: 0, min: 0 },
    opacity: { default: 1.0, min: 0, max: 1 },
    padding: { default: 0.1, min: 0.01 },
    right: { default: 0, min: 0 },
    side: { default: "front", oneOf: ["front", "back", "double"] },
    src: { oneOf: Object.keys(textures) },
    top: { default: 0, min: 0 },
    transparent: { default: true },
    width: { default: 1, min: 0 },
    usingCustomMaterial: { default: false },
    usingAtlas: { default: false },
    uvAtlasMin: { type: "vec2" },
    uvAtlasMax: { type: "vec2" }
  },

  init: function() {
    const data = this.data;

    this.textureSrc = null;

    const geometry = (this.geometry = new THREE.PlaneBufferGeometry(data.width, data.height, 3, 3));

    // Create mesh.
    if (data.usingCustomMaterial) {
      this.plane = new THREE.Mesh(geometry);
    } else {
      const material = new THREE.MeshBasicMaterial({
        alphaTest: data.alphaTest,
        color: data.color,
        opacity: data.opacity,
        transparent: data.transparent,
        wireframe: data.debug
      });
      this.plane = new THREE.Mesh(geometry, material);
    }
    this.el.setObject3D("mesh", this.plane);
  },

  regenerateMesh: function() {
    const data = this.data;
    let height;
    const pos = this.geometry.attributes.position.array;
    const uvs = this.geometry.attributes.uv.array;
    let width;

    if (this.plane.material && !this.plane.material.map) {
      return;
    }

    /*
      0--1------------------------------2--3
      |  |                              |  |
      4--5------------------------------6--7
      |  |                              |  |
      |  |                              |  |
      |  |                              |  |
      8--9-----------------------------10--11
      |  |                              |  |
      12-13----------------------------14--15
    */
    function setPos(id, x, y) {
      pos[3 * id] = x;
      pos[3 * id + 1] = y;
    }

    function setUV(id, u, v) {
      if (data.usingAtlas) {
        u = data.uvAtlasMin.x + u * (data.uvAtlasMax.x - data.uvAtlasMin.x);
        v = data.uvAtlasMin.y + v * (data.uvAtlasMax.y - data.uvAtlasMin.y);
      }
      uvs[2 * id] = u;
      uvs[2 * id + 1] = v;
    }

    // Update UVS
    if (data.usingCustomMaterial) {
      height = 1;
      width = 1;
    } else {
      height = textures[data.src].height;
      width = textures[data.src].width;
    }
    const uv = {
      left: data.left / width,
      right: data.right / width,
      top: data.top / height,
      bottom: data.bottom / height
    };

    setUV(1, uv.left, 1);
    setUV(2, uv.right, 1);

    setUV(4, 0, uv.bottom);
    setUV(5, uv.left, uv.bottom);
    setUV(6, uv.right, uv.bottom);
    setUV(7, 1, uv.bottom);

    setUV(8, 0, uv.top);
    setUV(9, uv.left, uv.top);
    setUV(10, uv.right, uv.top);
    setUV(11, 1, uv.top);

    setUV(13, uv.left, 0);
    setUV(14, uv.right, 0);

    if (data.usingAtlas) {
      setUV(0, 0, 1);
      setUV(3, 1, 1);
      setUV(12, 0, 0);
      setUV(15, 1, 0);
    }

    // Update vertex positions
    const w2 = data.width / 2;
    const h2 = data.height / 2;
    const left = -w2 + data.padding;
    const right = w2 - data.padding;
    const top = h2 - data.padding;
    const bottom = -h2 + data.padding;

    setPos(0, -w2, h2);
    setPos(1, left, h2);
    setPos(2, right, h2);
    setPos(3, w2, h2);

    setPos(4, -w2, top);
    setPos(5, left, top);
    setPos(6, right, top);
    setPos(7, w2, top);

    setPos(8, -w2, bottom);
    setPos(9, left, bottom);
    setPos(10, right, bottom);
    setPos(11, w2, bottom);

    setPos(13, left, -h2);
    setPos(14, right, -h2);
    setPos(12, -w2, -h2);
    setPos(15, w2, -h2);

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.uv.needsUpdate = true;
  },

  update: function(oldData) {
    const data = this.data;
    const diff = AFRAME.utils.diff(data, oldData);

    // Update material if using built-in material.
    if (!data.usingCustomMaterial) {
      this.plane.material.alphaTest = data.alphaTest;
      this.plane.material.color.setStyle(data.color);
      this.plane.material.opacity = data.opacity;
      this.plane.material.transparent = data.transparent;
      this.plane.material.wireframe = data.debug;
      this.plane.material.side = parseSide(data.side);
      this.plane.material.needsUpdate = true;
      if ("src" in diff) {
        this.updateMap();
      }
    }

    if (
      "width" in diff ||
      "height" in diff ||
      "padding" in diff ||
      "left" in diff ||
      "top" in diff ||
      "bottom" in diff ||
      "right" in diff
    ) {
      this.regenerateMesh();
    }
  },

  setMap(texture) {
    this.plane.material.map = texture;
    this.plane.material.needsUpdate = true;
    this.regenerateMesh();
  },

  /**
   * Update `src` if using built-in material.
   */
  updateMap: function() {
    const src = this.data.src;

    if (src) {
      if (src === this.textureSrc) {
        return;
      }
      // Texture added or changed.
      this.textureSrc = src;
      this.setMap(textures[src].tex);
      return;
    }

    // Texture removed.
    if (!this.plane.material.map) {
      return;
    }

    this.setMap(null);
  }
});

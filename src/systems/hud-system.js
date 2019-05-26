/* global THREE */
import { memoizeSprites } from "./hud/memoize-sprites";
import spritesheetJson from "../assets/images/hud/spritesheet.json";
import { createImageTexture } from "../components/media-views.js";
import spritesheetPng from "../assets/images/hud/spritesheet.png";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { writeXYWH, stencils, determineHoverZone } from "./hud/stencils";
import vert from "./hud/hud.vert";
import frag from "./hud/hud.frag";
import { NONE, BUTTON_MIC, BUTTON_CREATE, BUTTON_PEN, BUTTON_CAMERA } from "./hud/enum";
import { SOUND_HOVER_OR_GRAB, SOUND_SPAWN_PEN } from "./sound-effects-system";

const WIDTH = 0.75;
const OFFSET = new THREE.Vector3(0.04, 0, 0);
export class HudButtonRow {
  constructor() {
    Promise.all([createImageTexture(spritesheetPng), waitForDOMContentLoaded()]).then(([spritesheet]) => {
      const uSprites = new Float32Array(20);
      const geometry = new THREE.PlaneBufferGeometry(WIDTH, WIDTH / 4, 1, 1, false);
      const material = new THREE.RawShaderMaterial({
        uniforms: {
          u_spritesheet: { value: spritesheet },
          u_stencils: {
            value: stencils
          },
          u_sprites: { value: uSprites }
        },
        vertexShader: vert,
        fragmentShader: frag,
        side: THREE.DoubleSide,
        transparent: true,
        lights: false,
        map: null,
      });
      const mesh = new THREE.Mesh(geometry, material).translateX(-OFFSET.x).rotateX((3 * Math.PI) / 16);
      mesh.matrixNeedsUpdate = true;
      this.el = document.getElementById("hud-button-row");
      this.el.setObject3D("mesh", mesh);
      this.tooltip = document.getElementById("hud-tooltip");
      this.tooltipText = this.tooltip.querySelector("[text]");
    });
  }
}
const getSprite = memoizeSprites(spritesheetJson);

HudButtonRow.prototype.tick = (function() {
  const vec3 = new THREE.Vector3();
  const TOOLTIP_MUTE_MIC = "Mute Mic";
  const TOOLTIP_UNMUTE_MIC = "Unmute Mic";
  const TOOLTIPS = {
    [BUTTON_CREATE]: "Create",
    [BUTTON_PEN]: "Pen",
    [BUTTON_CAMERA]: "Camera"
  };
  const GRAB_EFFECT = {
    [BUTTON_MIC]: function(scene) {
      scene.emit("action_mute");
    },
    [BUTTON_CREATE]: function(scene) {
      scene.emit("action_spawn");
    },
    [BUTTON_PEN]: function(scene) {
      scene.emit("spawn_pen");
      scene.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_SPAWN_PEN);
    },
    [BUTTON_CAMERA]: function(scene) {
      scene.emit("action_toggle_camera");
    }
  };
  const participants = "Background.png";
  const mic = [["mute_off.png", "mute_off-hover.png"], ["mute_on.png", "mute_on-hover.png"]];
  const pen = [["pen_off.png", "pen_off-hover.png"], ["pen_on.png", "pen_on-hover.png"]];
  const cam = [["camera_off.png", "camera_off-hover.png"], ["camera_on.png", "camera_on-hover.png"]];
  const create = ["spawn.png", "spawn-hover.png"];

  return function tick(scene) {
    if (!this.el) {
      return;
    }
    const frozen = scene.is("frozen");
    this.el.object3D.visible = !frozen;
    //this.el.object3DMap.mesh.visible = !frozen;

    const userinput = scene.systems.userinput;
    const interaction = scene.systems.interaction;
    const point = interaction.intersectionPoint;
    const xZeroToOne = (vec3.copy(point).add(OFFSET).x + WIDTH / 2) / WIDTH;
    const hoverZone =
      interaction.state.rightRemote.hovered && interaction.state.rightRemote.hovered === this.el
        ? determineHoverZone(xZeroToOne)
        : NONE;

    const muted = scene.is("muted");

    const uSprites = this.el.object3DMap.mesh.material.uniforms.u_sprites.value;
    writeXYWH(uSprites, 0, getSprite(participants));
    writeXYWH(uSprites, 1, getSprite(mic[muted ? 1 : 0][hoverZone === BUTTON_MIC ? 1 : 0]));
    writeXYWH(uSprites, 2, getSprite(create[hoverZone === BUTTON_CREATE ? 1 : 0]));
    writeXYWH(uSprites, 3, getSprite(pen[scene.is("pen") ? 1 : 0][hoverZone === BUTTON_PEN ? 1 : 0]));
    writeXYWH(uSprites, 4, getSprite(cam[scene.is("camera") ? 1 : 0][hoverZone === BUTTON_CAMERA ? 1 : 0]));

    this.tooltip.object3D.visible = !frozen && hoverZone !== NONE;
    this.tooltipText.setAttribute(
      "text",
      "value",
      hoverZone === BUTTON_MIC ? (muted ? TOOLTIP_UNMUTE_MIC : TOOLTIP_MUTE_MIC) : TOOLTIPS[hoverZone] || ""
    );
    if (this.prevHoverZone !== hoverZone && hoverZone !== NONE) {
      scene.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_HOVER_OR_GRAB);
    }
    this.prevHoverZone = hoverZone;

    if (hoverZone !== NONE && userinput.get(interaction.options.rightRemote.grabPath) && GRAB_EFFECT[hoverZone]) {
      scene.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_HOVER_OR_GRAB);
      GRAB_EFFECT[hoverZone](scene);
    }
  };
})();

// This is written very component like, not system like...
// Didn't bother to do multiple of these, but could do that if we do that for object menus

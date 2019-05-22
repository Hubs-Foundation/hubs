/* global THREE */
import spritesheetJson from "../assets/images/hud/spritesheet.json";
import { memoizeSprites } from "./hud/memoize-sprites";
import { createImageTexture } from "../components/media-views.js";
import spritesheetPng from "../assets/images/hud/spritesheet.png";
import vert from "./hud/hud.vert";
import frag from "./hud/hud.frag";
import { writeXYWH, stencils, determineHoverZone } from "./hud/stencils";
import {
  HUD_ALPHA,
  HUD_BACKGROUND,
  BUTTON_MIC,
  BUTTON_CREATE,
  BUTTON_PEN,
  BUTTON_CAMERA,
  BUTTON_INVITE
} from "./hud/enum";
import { SOUND_HOVER_OR_GRAB, SOUND_SPAWN_PEN } from "./sound-effects-system";

const sprite = memoizeSprites(spritesheetJson);
const WIDTH = 0.75;
const OFFSET = new THREE.Vector3(0.04, 0, 0);
export class HudSystem {
  constructor() {
    createImageTexture(spritesheetPng).then(spritesheet => {
      const uSprites = new Float32Array(20);
      const geometry = new THREE.PlaneBufferGeometry(WIDTH, 0.25, 1, 1, false);
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
        transparent: true
      });
      this.hud = new THREE.Mesh(geometry, material);
      this.hud.translateX(-OFFSET.x);
      this.hud.matrixNeedsUpdate = true;
      this.hudEl = document.getElementById("player-hud-btns");
      this.hudEl.setObject3D("mesh", this.hud);
      this.tooltip = document.getElementById("hud-tooltip");
      this.tooltipText = this.tooltip.querySelector("[text]");
    });
  }
}

HudSystem.prototype.tick = (function() {
  const participants = "Background.png";
  const mic = [["mute_off.png", "mute_off-hover.png"], ["mute_on.png", "mute_on-hover.png"]];
  const pen = [["pen_off.png", "pen_off-hover.png"], ["pen_on.png", "pen_on-hover.png"]];
  const cam = [["camera_off.png", "camera_off-hover.png"], ["camera_on.png", "camera_on-hover.png"]];
  const create = ["spawn.png", "spawn-hover.png"];

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

  const TOOLTIP_MUTE_MIC = "Mute Mic";
  const TOOLTIP_UNMUTE_MIC = "Unmute Mic";
  const TOOLTIP_CREATE = "Create";
  const TOOLTIP_PEN = "Pen";
  const TOOLTIP_CAMERA = "Camera";
  const TOOLTIPS = {
    [BUTTON_CREATE]: TOOLTIP_CREATE,
    [BUTTON_PEN]: TOOLTIP_PEN,
    [BUTTON_CAMERA]: TOOLTIP_CAMERA
  };

  const vec3 = new THREE.Vector3();

  return function tick(scene) {
    if (!this.hud) {
      return;
    }
    const frozen = scene.is("frozen");
    this.hudEl.object3D.visible = !frozen;
    this.hud.visible = !frozen;
    this.hudEl.object3D.lookAt(scene.camera.getWorldPosition(new THREE.Vector3()));

    const userinput = scene.systems.userinput;
    const interaction = scene.systems.interaction;
    const point = interaction.intersectionPoint;
    const hovered = interaction.state.rightRemote.hovered;

    vec3.copy(point).add(OFFSET);
    const xZeroToOne = (vec3.x + WIDTH / 2) / WIDTH;
    const hoverZone = !!hovered && hovered === this.hud.el ? determineHoverZone(xZeroToOne) : -1;

    const muted = scene.is("muted");

    const uSprites = this.hud.material.uniforms.u_sprites.value;
    writeXYWH(uSprites, 0, sprite(participants));
    writeXYWH(uSprites, 1, sprite(mic[muted ? 1 : 0][hoverZone === BUTTON_MIC ? 1 : 0]));
    writeXYWH(uSprites, 2, sprite(create[hoverZone === BUTTON_CREATE ? 1 : 0]));
    writeXYWH(uSprites, 3, sprite(pen[scene.is("pen") ? 1 : 0][hoverZone === BUTTON_PEN ? 1 : 0]));
    writeXYWH(uSprites, 4, sprite(cam[scene.is("camera") ? 1 : 0][hoverZone === BUTTON_CAMERA ? 1 : 0]));

    this.tooltip.object3D.visible = !!hovered && hovered === this.hud.el && !frozen && hoverZone !== HUD_BACKGROUND;
    this.tooltipText.setAttribute(
      "text",
      "value",
      hoverZone === BUTTON_MIC ? (muted ? TOOLTIP_UNMUTE_MIC : TOOLTIP_MUTE_MIC) : TOOLTIPS[hoverZone] || ""
    );
    if (
      this.prevHoverZone !== hoverZone &&
      (hoverZone === BUTTON_PEN ||
        hoverZone === BUTTON_CAMERA ||
        hoverZone === BUTTON_MIC ||
        hoverZone === BUTTON_CREATE)
    ) {
      scene.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_HOVER_OR_GRAB);
    }
    this.prevHoverZone = hoverZone;

    if (
      hovered &&
      hovered === this.hud.el &&
      userinput.get(interaction.options.rightRemote.grabPath) &&
      GRAB_EFFECT[hoverZone]
    ) {
      GRAB_EFFECT[hoverZone](scene);
    }
  };
})();

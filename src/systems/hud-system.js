/* global fetch THREE */
import spritesheetPng from "../assets/images/hud/spritesheet.png";
import spritesheetJson from "../assets/images/hud/spritesheet.json";
import vert from "../assets/hud.vert";
import frag from "../assets/hud.frag";
import { createImageTexture } from "../components/media-views.js";
import { SOUND_SPAWN_PEN } from "./sound-effects-system";

let hoverZoneEnum = 0;
const HUD_ALPHA = hoverZoneEnum++;
const HUD_BACKGROUND = hoverZoneEnum++;
const BUTTON_PARTICIPANTS = hoverZoneEnum++;
const BUTTON_MIC = hoverZoneEnum++;
const BUTTON_CREATE = hoverZoneEnum++;
const BUTTON_PEN = hoverZoneEnum++;
const BUTTON_CAMERA = hoverZoneEnum++;
const BUTTON_INVITE = hoverZoneEnum++;
const WIDTH = 0.75;

const determineHoverZone = (function() {
  const WIDTH_IN_PIXELS = 512;
  const MIC_X1 = (128 + 16) / WIDTH_IN_PIXELS;
  const MIC_X2 = (128 + 16 + 64) / WIDTH_IN_PIXELS;
  const CREATE_X1 = (128 + 16 + 64 + 16) / WIDTH_IN_PIXELS;
  const CREATE_X2 = (128 + 16 + 64 + 16 + 128) / WIDTH_IN_PIXELS;
  const PEN_X1 = (128 + 16 + 64 + 16 + 128 + 16) / WIDTH_IN_PIXELS;
  const PEN_X2 = (128 + 16 + 64 + 16 + 128 + 16 + 64) / WIDTH_IN_PIXELS;
  const CAM_X1 = (128 + 16 + 64 + 16 + 128 + 16 + 64 + 16) / WIDTH_IN_PIXELS;
  const CAM_X2 = (128 + 16 + 64 + 16 + 128 + 16 + 64 + 16 + 64) / WIDTH_IN_PIXELS;
  const HALF_WIDTH = WIDTH / 2;

  return function determineHoverZone(point) {
    const xZeroToOne = (point.x + HALF_WIDTH) / WIDTH;
    if (xZeroToOne > MIC_X1 && xZeroToOne < MIC_X2) {
      return BUTTON_MIC;
    } else if (xZeroToOne > CREATE_X1 && xZeroToOne < CREATE_X2) {
      return BUTTON_CREATE;
    } else if (xZeroToOne > PEN_X1 && xZeroToOne < PEN_X2) {
      return BUTTON_PEN;
    } else if (xZeroToOne > CAM_X1 && xZeroToOne < CAM_X2) {
      return BUTTON_CAMERA;
    }

    return HUD_BACKGROUND;
  };
})();

function vec4For(spriteName) {
  const frame = spritesheetJson.frames[spriteName].frame;
  // height and width is in the json
  const { w, h } = spritesheetJson.meta.size;
  return new THREE.Vector4(frame.x / w, frame.y / h, frame.w / w, frame.h / h);
}

export class HudSystem {
  constructor() {
    this.textures = [spritesheetPng].map(createImageTexture);
    Promise.all(this.textures).then(([spritesheet]) => {
      const geometry = new THREE.PlaneBufferGeometry(WIDTH, 0.25, 1, 1, false);
      const sprites = [
        vec4For("Background.png"),
        vec4For("mute_off.png"),
        vec4For("create_object.png"),
        vec4For("pen_off.png"),
        vec4For("camera_off.png")
      ];

      const uStencils = new Float32Array(20);
      const participantsFrame = {
        x: 0,
        y: 40 / 128.0,
        w: 128 / 512.0,
        h: 48 / 128.0
      };
      uStencils[0] = participantsFrame.x;
      uStencils[1] = participantsFrame.y;
      uStencils[2] = participantsFrame.w;
      uStencils[3] = participantsFrame.h;

      const micFrame = {
        x: (128 + 16) / 512.0,
        y: 32 / 128.0,
        w: 64 / 512.0,
        h: 64 / 128.0
      };
      uStencils[4] = micFrame.x;
      uStencils[5] = micFrame.y;
      uStencils[6] = micFrame.w;
      uStencils[7] = micFrame.h;

      const createFrame = {
        x: (128 + 16 + 64 + 16) / 512.0,
        y: 0 / 128.0,
        w: 128 / 512.0,
        h: 128 / 128.0
      };
      uStencils[8] = createFrame.x;
      uStencils[9] = createFrame.y;
      uStencils[10] = createFrame.w;
      uStencils[11] = createFrame.h;

      const penFrame = {
        x: (128 + 16 + 64 + 16 + 128 + 16) / 512.0,
        y: 32 / 128.0,
        w: 64 / 512.0,
        h: 64 / 128.0
      };
      uStencils[12] = penFrame.x;
      uStencils[13] = penFrame.y;
      uStencils[14] = penFrame.w;
      uStencils[15] = penFrame.h;

      const camFrame = {
        x: (128 + 16 + 64 + 16 + 128 + 16 + 64 + 16) / 512.0,
        y: 32 / 128.0,
        w: 64 / 512.0,
        h: 64 / 128.0
      };
      uStencils[16] = camFrame.x;
      uStencils[17] = camFrame.y;
      uStencils[18] = camFrame.w;
      uStencils[19] = camFrame.h;

      const uSprites = new Float32Array(20);
      const attrs = ["x", "y", "z", "w"];
      for (let k = 0; k < 5; k++) {
        for (let i = 0; i < 4; i++) {
          uSprites[k * 4 + i] = sprites[k][attrs[i]];
        }
      }

      const material = new THREE.RawShaderMaterial({
        uniforms: {
          u_spritesheet: { value: spritesheet },
          u_stencils: {
            value: uStencils
          },
          u_sprites: { value: uSprites }
        },
        vertexShader: vert,
        fragmentShader: frag,
        side: THREE.DoubleSide,
        transparent: true
      });
      this.hud = new THREE.Mesh(geometry, material);
      this.hud.translateX(-0.04);
      this.hud.matrixNeedsUpdate = true;
      document.getElementById("player-hud").setObject3D("mesh", this.hud);
      this.tooltip = document.getElementById("hud-tooltip");
    });
  }
}

HudSystem.prototype.tick = (function() {
  const U_MIC_INACTIVE = "mute_on.png";
  const U_MIC_INACTIVE_HOVERED = "mute_on-hover.png";
  const U_MIC_ACTIVE_HOVERED = "mute_off-hover.png";
  const U_MIC_ACTIVE = "mute_off.png";

  const U_PEN_INACTIVE = "pen_off.png";
  const U_PEN_INACTIVE_HOVERED = "pen_off-hover.png";
  const U_PEN_ACTIVE_HOVERED = "pen_on.png";
  const U_PEN_ACTIVE = "pen_on-hover.png";

  const U_CAMERA_INACTIVE = "camera_off.png";
  const U_CAMERA_INACTIVE_HOVERED = "camera_off-hover.png";
  const U_CAMERA_ACTIVE_HOVERED = "camera_on-hover.png";
  const U_CAMERA_ACTIVE = "camera_on.png";

  const U_CREATE = "create_object.png";
  const U_CREATE_HOVERED = "create_object-hover.png";

  const TOOLTIP_MUTE_MIC = "Mute Mic";
  const TOOLTIP_UNMUTE_MIC = "Unmute Mic";
  const TOOLTIP_CREATE = "Create";
  const TOOLTIP_PEN = "Pen";
  const TOOLTIP_CAMERA = "Camera";
  return function tick(scene) {
    if (!this.hud) {
      return;
    }

    const userinput = scene.systems.userinput;
    const interaction = scene.systems.interaction;
    const point = interaction.intersectionPoint;
    const hovered = interaction.state.rightRemote.hovered;
    const hoverZone =
      hovered && hovered === this.hud.el
        ? determineHoverZone(new THREE.Vector3().copy(point).add(new THREE.Vector3(0.04, 0, 0)))
        : -1;

    const muted = scene.is("muted");
    const uMic =
      muted && hoverZone !== BUTTON_MIC
        ? U_MIC_INACTIVE
        : muted && hoverZone === BUTTON_MIC
          ? U_MIC_INACTIVE_HOVERED
          : !muted && hoverZone === BUTTON_MIC
            ? U_MIC_ACTIVE_HOVERED
            : U_MIC_ACTIVE;
    const micFrame = vec4For(uMic);
    this.hud.material.uniforms.u_sprites.value[1 * 4 + 0] = micFrame.x;
    this.hud.material.uniforms.u_sprites.value[1 * 4 + 1] = micFrame.y;
    this.hud.material.uniforms.u_sprites.value[1 * 4 + 2] = micFrame.z;
    this.hud.material.uniforms.u_sprites.value[1 * 4 + 3] = micFrame.w;

    const uCreate = hoverZone === BUTTON_CREATE ? U_CREATE_HOVERED : U_CREATE;
    const createFrame = vec4For(uCreate);
    this.hud.material.uniforms.u_sprites.value[2 * 4 + 0] = createFrame.x;
    this.hud.material.uniforms.u_sprites.value[2 * 4 + 1] = createFrame.y;
    this.hud.material.uniforms.u_sprites.value[2 * 4 + 2] = createFrame.z;
    this.hud.material.uniforms.u_sprites.value[2 * 4 + 3] = createFrame.w;

    const pen = scene.is("pen");
    const uPen =
      !pen && hoverZone !== BUTTON_PEN
        ? U_PEN_INACTIVE
        : !pen && hoverZone === BUTTON_PEN
          ? U_PEN_INACTIVE_HOVERED
          : pen && hoverZone === BUTTON_PEN
            ? U_PEN_ACTIVE_HOVERED
            : U_PEN_ACTIVE;
    const penFrame = vec4For(uPen);
    this.hud.material.uniforms.u_sprites.value[3 * 4 + 0] = penFrame.x;
    this.hud.material.uniforms.u_sprites.value[3 * 4 + 1] = penFrame.y;
    this.hud.material.uniforms.u_sprites.value[3 * 4 + 2] = penFrame.z;
    this.hud.material.uniforms.u_sprites.value[3 * 4 + 3] = penFrame.w;

    const cam = scene.is("camera");
    const uCam =
      !cam && hoverZone !== BUTTON_CAMERA
        ? U_CAMERA_INACTIVE
        : !cam && hoverZone === BUTTON_CAMERA
          ? U_CAMERA_INACTIVE_HOVERED
          : cam && hoverZone === BUTTON_CAMERA
            ? U_CAMERA_ACTIVE_HOVERED
            : U_CAMERA_ACTIVE;
    const camFrame = vec4For(uCam);
    this.hud.material.uniforms.u_sprites.value[4 * 4 + 0] = camFrame.x;
    this.hud.material.uniforms.u_sprites.value[4 * 4 + 1] = camFrame.y;
    this.hud.material.uniforms.u_sprites.value[4 * 4 + 2] = camFrame.z;
    this.hud.material.uniforms.u_sprites.value[4 * 4 + 3] = camFrame.w;

    const frozen = scene.is("frozen");
    this.hud.visible = !frozen;
    this.tooltip.object3D.visible = hovered && hovered === this.hud.el && !frozen && hoverZone !== HUD_BACKGROUND;
    this.hud.lookAt(scene.camera.getWorldPosition(new THREE.Vector3()));
    switch (hoverZone) {
      case HUD_ALPHA:
        // raycaster should go thru this object but i have not implemented that yet
        break;
      case HUD_BACKGROUND:
        break;
      case BUTTON_PARTICIPANTS:
        break;
      case BUTTON_MIC:
        this.tooltip
          .querySelector("[text]")
          .setAttribute("text", "value", muted ? TOOLTIP_UNMUTE_MIC : TOOLTIP_MUTE_MIC);
        break;
      case BUTTON_CREATE:
        this.tooltip.querySelector("[text]").setAttribute("text", "value", TOOLTIP_CREATE);
        break;
      case BUTTON_PEN:
        this.tooltip.querySelector("[text]").setAttribute("text", "value", TOOLTIP_PEN);
        break;
      case BUTTON_CAMERA:
        this.tooltip.querySelector("[text]").setAttribute("text", "value", TOOLTIP_CAMERA);
        break;
      case BUTTON_INVITE:
      default:
        break;
    }

    if (hovered && hovered === this.hud.el && userinput.get(interaction.options.rightRemote.grabPath)) {
      switch (hoverZone) {
        case HUD_ALPHA:
          // raycaster should go thru this object but i have not implemented that yet
          break;
        case HUD_BACKGROUND:
          break;
        case BUTTON_PARTICIPANTS:
          break;
        case BUTTON_MIC:
          scene.emit("action_mute");
          break;
        case BUTTON_CREATE:
          scene.emit("action_spawn");
          break;
        case BUTTON_PEN:
          scene.emit("spawn_pen");
          scene.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_SPAWN_PEN);
          break;
        case BUTTON_CAMERA:
          scene.emit("action_toggle_camera");
          break;
        case BUTTON_INVITE:
        default:
          break;
      }
    }
  };
})();

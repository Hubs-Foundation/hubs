/* global fetch THREE */
import imageUrl from "../assets/images/hud_filled_pen3.png";
import { createImageTexture } from "../components/media-views.js";
import vert from "../assets/simple.vert";
import frag from "../assets/simple.frag";
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

export class HudSystem {
  constructor() {
    Promise.all([imageUrl].map(createImageTexture)).then(([image]) => {
      const geometry = new THREE.PlaneBufferGeometry(WIDTH, 0.25, 1, 1);
      const material = new THREE.RawShaderMaterial({
        uniforms: {
          u_mic: { value: 0 },
          u_create: { value: 0 },
          u_pen: { value: 0 },
          u_cam: { value: 0 },
          u_image: { value: image }
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
  const U_MIC_INACTIVE = 0;
  const U_MIC_INACTIVE_HOVERED = 1;
  const U_MIC_ACTIVE_HOVERED = 2;
  const U_MIC_ACTIVE = 3;

  const U_PEN_INACTIVE = 0;
  const U_PEN_INACTIVE_HOVERED = 1;
  const U_PEN_ACTIVE_HOVERED = 2;
  const U_PEN_ACTIVE = 3;

  const U_CAMERA_INACTIVE = 0;
  const U_CAMERA_INACTIVE_HOVERED = 1;
  const U_CAMERA_ACTIVE_HOVERED = 2;
  const U_CAMERA_ACTIVE = 3;

  const U_CREATE = 0;
  const U_CREATE_HOVERED = 1;

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
    const pen = scene.is("pen");
    const cam = scene.is("camera");

    const uMic =
      muted && hoverZone !== BUTTON_MIC
        ? U_MIC_INACTIVE
        : muted && hoverZone === BUTTON_MIC
          ? U_MIC_INACTIVE_HOVERED
          : !muted && hoverZone === BUTTON_MIC
            ? U_MIC_ACTIVE_HOVERED
            : U_MIC_ACTIVE;

    const uPen =
      !pen && hoverZone !== BUTTON_PEN
        ? U_PEN_INACTIVE
        : !pen && hoverZone === BUTTON_PEN
          ? U_PEN_INACTIVE_HOVERED
          : pen && hoverZone === BUTTON_PEN
            ? U_PEN_ACTIVE_HOVERED
            : U_PEN_ACTIVE;

    const uCam =
      !cam && hoverZone !== BUTTON_CAMERA
        ? U_CAMERA_INACTIVE
        : !cam && hoverZone === BUTTON_CAMERA
          ? U_CAMERA_INACTIVE_HOVERED
          : cam && hoverZone === BUTTON_CAMERA
            ? U_CAMERA_ACTIVE_HOVERED
            : U_CAMERA_ACTIVE;

    const uCreate = hoverZone === BUTTON_CREATE ? U_CREATE_HOVERED : U_CREATE;

    this.tooltip.object3D.visible = true;
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

    this.hud.material.uniforms.u_mic.value = uMic;
    this.hud.material.uniforms.u_create.value = uCreate;
    this.hud.material.uniforms.u_pen.value = uPen;
    this.hud.material.uniforms.u_cam.value = uCam;

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
          // length2 bug
          //scene.emit("spawn_pen");
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

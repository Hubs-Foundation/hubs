/* global fetch */
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

const DOWN = new THREE.Vector3(0, 1, 0);

const height = 0.25;
const width = 0.75;

function determineHoverZone(point) {
  const pixelWidth = 512;
  const micX1 = (128 + 16) / pixelWidth;
  const micX2 = (128 + 16 + 64) / pixelWidth;
  const createX1 = (128 + 16 + 64 + 16) / pixelWidth;
  const createX2 = (128 + 16 + 64 + 16 + 128) / pixelWidth;
  const penX1 = (128 + 16 + 64 + 16 + 128 + 16) / pixelWidth;
  const penX2 = (128 + 16 + 64 + 16 + 128 + 16 + 64) / pixelWidth;
  const camX1 = (128 + 16 + 64 + 16 + 128 + 16 + 64 + 16) / pixelWidth;
  const camX2 = (128 + 16 + 64 + 16 + 128 + 16 + 64 + 16 + 64) / pixelWidth;
  const halfWidth = width / 2;
  const xZeroToOne = (point.x + halfWidth) / width;

  if (xZeroToOne > micX1 && xZeroToOne < micX2) {
    return BUTTON_MIC;
  } else if (xZeroToOne > createX1 && xZeroToOne < createX2) {
    return BUTTON_CREATE;
  } else if (xZeroToOne > penX1 && xZeroToOne < penX2) {
    return BUTTON_PEN;
  } else if (xZeroToOne > camX1 && xZeroToOne < camX2) {
    return BUTTON_CAMERA;
  }

  return HUD_BACKGROUND;
}
export class HudSystem {
  constructor() {
    Promise.all([imageUrl].map(createImageTexture)).then(([image]) => {
      const geometry = new THREE.PlaneBufferGeometry(width, height, 1, 1);
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

  tick(scene) {
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

    const uCreate = hoverZone === BUTTON_CREATE ? 1 : 0;

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

    const interact = hovered && hovered === this.hud.el && userinput.get(interaction.options.rightRemote.grabPath);
    if (interact) {
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
  }
}

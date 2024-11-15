import { SOUND_SPAWN_PEN } from "../systems/sound-effects-system";
import { shareInviteUrl } from "../utils/share";
import { hubUrl } from "../utils/phoenix-utils";
import configs from "../utils/configs";
import { handleExitTo2DInterstitial } from "../utils/vr-interstitial";
/**
 * HUD panel for muting, freezing, and other controls that don't necessarily have hardware buttons.
 * @namespace ui
 * @component in-world-hud
 */
AFRAME.registerComponent("in-world-hud", {
  init() {
    this.mic = this.el.querySelector(".mic");
    this.spawn = this.el.querySelector(".spawn");
    this.pen = this.el.querySelector(".penhud");
    this.cameraBtn = this.el.querySelector(".camera-btn");
    this.inviteBtn = this.el.querySelector(".invite-btn");
    this.background = this.el.querySelector(".bg");

    this.onMicStateChanged = () => {
      this.mic.setAttribute("mic-button", "active", APP.dialog.isMicEnabled);
    };
    APP.dialog.on("mic-state-changed", this.onMicStateChanged);

    this.updateButtonStates = () => {
      this.mic.setAttribute("mic-button", "active", APP.dialog.isMicEnabled);
      this.pen.setAttribute("icon-button", "active", this.el.sceneEl.is("pen"));
      this.cameraBtn.setAttribute("icon-button", "active", this.el.sceneEl.is("camera"));
      if (window.APP.hubChannel) {
        this.spawn.setAttribute("icon-button", "disabled", !window.APP.hubChannel.can("spawn_and_move_media"));
        this.pen.setAttribute("icon-button", "disabled", !window.APP.hubChannel.can("spawn_drawing"));
        this.cameraBtn.setAttribute("icon-button", "disabled", !window.APP.hubChannel.can("spawn_camera"));
      }
    };

    this.onStateChange = evt => {
      if (!(evt.detail === "frozen" || evt.detail === "pen" || evt.detail === "camera")) return;
      this.updateButtonStates();
    };

    this.onMicClick = () => {
      APP.mediaDevicesManager.toggleMic();
    };

    this.onSpawnClick = () => {
      if (!window.APP.hubChannel.can("spawn_and_move_media")) return;
      this.el.emit("action_spawn");
    };

    this.onPenClick = e => {
      if (!window.APP.hubChannel.can("spawn_drawing")) return;
      this.el.emit("spawn_pen", { object3D: e.object3D });
      this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_SPAWN_PEN);
    };

    this.onCameraClick = () => {
      if (!window.APP.hubChannel.can("spawn_camera")) return;
      this.el.emit("action_toggle_camera");
    };

    this.onInviteClick = async event => {
      try {
        const extraParams =
          APP.hub.entry_mode === "invite" ? { hub_invite_id: (await APP.hubChannel.fetchInvite()).hub_invite_id } : {};
        const url = hubUrl(APP.hub.hub_id, extraParams).href;
        const didShare = await shareInviteUrl(
          null,
          url,
          { roomName: APP.hub.name, appName: configs.translation("app-name") },
          true,
          event
        );
        if (didShare) {
          await handleExitTo2DInterstitial(false, () => {}, true);
        }
      } catch (error) {
        console.error(`while inviting (using HUD):`, error);
      }
    };

    this.onHubUpdated = e => {
      this.inviteBtn.object3D.visible = e.detail.hub.entry_mode !== "invite" || APP.hubChannel.can("update_hub");
    };
  },

  play() {
    this.el.sceneEl.addEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.addEventListener("stateremoved", this.onStateChange);
    this.el.sceneEl.systems.permissions.onPermissionsUpdated(this.updateButtonStates);
    this.el.sceneEl.addEventListener("hub_updated", this.onHubUpdated);
    this.updateButtonStates();

    this.mic.object3D.addEventListener("interact", this.onMicClick);
    this.spawn.object3D.addEventListener("interact", this.onSpawnClick);
    this.pen.object3D.addEventListener("interact", this.onPenClick);
    this.cameraBtn.object3D.addEventListener("interact", this.onCameraClick);
    this.inviteBtn.object3D.addEventListener("interact", this.onInviteClick);
  },

  pause() {
    this.el.sceneEl.removeEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.removeEventListener("stateremoved", this.onStateChange);
    window.APP.hubChannel.removeEventListener("permissions_updated", this.updateButtonStates);
    this.el.sceneEl.removeEventListener("hub_updated", this.onHubUpdated);

    this.mic.object3D.removeEventListener("interact", this.onMicClick);
    this.spawn.object3D.removeEventListener("interact", this.onSpawnClick);
    this.pen.object3D.removeEventListener("interact", this.onPenClick);
    this.cameraBtn.object3D.removeEventListener("interact", this.onCameraClick);
    this.inviteBtn.object3D.removeEventListener("interact", this.onInviteClick);
  }
});

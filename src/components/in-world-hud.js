import { SOUND_SPAWN_PEN } from "../systems/sound-effects-system";
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
    this.agentBtn = this.el.querySelector(".agent-btn");
    this.mapBtn = this.el.querySelector(".map-btn");
    this.langBtn = this.el.querySelector(".lang-btn");
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
      this.agentBtn.setAttribute("icon-button", "active", this.el.sceneEl.is("agent"));
      this.mapBtn.setAttribute("icon-button", "active", this.el.sceneEl.is("map"));
      this.langBtn.setAttribute("flag-button", "active", this.el.sceneEl.is("panel"));
      if (window.APP.hubChannel) {
        this.spawn.setAttribute("icon-button", "disabled", !window.APP.hubChannel.can("spawn_and_move_media"));
        this.pen.setAttribute("icon-button", "disabled", !window.APP.hubChannel.can("spawn_drawing"));
        this.cameraBtn.setAttribute("icon-button", "disabled", !window.APP.hubChannel.can("spawn_camera"));
      }
    };

    this.onStateChange = evt => {
      if (
        !(
          evt.detail === "frozen" ||
          evt.detail === "pen" ||
          evt.detail === "camera" ||
          evt.detail === "agent" ||
          evt.detail === "map"
        )
      )
        return;
      this.updateButtonStates();
    };

    this.onMicClick = () => {
      APP.mediaDevicesManager.toggleMic();
    };

    this.onSpawnClick = () => {
      if (!window.APP.hubChannel.can("spawn_and_move_media")) return;
      this.el.emit("action_spawn");
    };

    this.onAgentClick = () => {
      this.el.sceneEl.emit("agent-toggle");
    };

    this.onMapClick = () => {
      this.el.emit("map-toggle");
    };

    this.onLangClick = () => {
      this.el.emit("lang-toggle");
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

    this.onInviteClick = () => {
      this.el.emit("action_invite");
    };

    this.onHubUpdated = e => {
      this.inviteBtn.object3D.visible = e.detail.hub.entry_mode !== "invite";
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
    this.agentBtn.object3D.addEventListener("interact", this.onAgentClick);
    this.mapBtn.object3D.addEventListener("interact", this.onMapClick);
    this.langBtn.object3D.addEventListener("interact", this.onLangClick);
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
    this.agentBtn.object3D.removeEventListener("interact", this.onAgentClick);
    this.mapBtn.object3D.removeEventListener("interact", this.onMapClick);
    this.langBtn.object3D.removeEventListener("interact", this.onLangClick);
    this.inviteBtn.object3D.removeEventListener("interact", this.onInviteClick);
  }
});

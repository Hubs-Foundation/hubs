import { getAbsoluteHref } from "./utils/media-url-utils";
import { spawnChatMessage } from "./react-components/chat-message";
import { SOUND_QUACK, SOUND_SPECIAL_QUACK } from "./systems/sound-effects-system";
import ducky from "./assets/models/DuckyMesh.glb";

// Handles user-entered messages
export default class MessageDispatch {
  constructor(scene, entryManager, hubChannel, addToPresenceLog, remountUI, mediaSearchStore) {
    this.scene = scene;
    this.entryManager = entryManager;
    this.hubChannel = hubChannel;
    this.addToPresenceLog = addToPresenceLog;
    this.remountUI = remountUI;
    this.mediaSearchStore = mediaSearchStore;
  }

  log = body => {
    this.addToPresenceLog({ type: "log", body });
  };

  dispatch = message => {
    if (message.startsWith("/")) {
      const commandParts = message.substring(1).split(" ");
      this.dispatchCommand(commandParts[0], ...commandParts.slice(1));
      document.activeElement.blur(); // Commands should blur
    } else {
      this.hubChannel.sendMessage(message);
    }
  };

  dispatchCommand = (command, ...args) => {
    const entered = this.scene.is("entered");

    if (!entered) {
      this.addToPresenceLog({ type: "log", body: "You must enter the room to use this command." });
      return;
    }

    const avatarRig = document.querySelector("#avatar-rig");
    const scales = [0.0625, 0.125, 0.25, 0.5, 1.0, 1.5, 3, 5, 7.5, 12.5];
    const curScale = avatarRig.object3D.scale;
    let err;
    let physicsSystem;
    const captureSystem = this.scene.systems["capture-system"];

    switch (command) {
      case "fly":
        if (avatarRig.getAttribute("character-controller").fly !== true) {
          avatarRig.setAttribute("character-controller", "fly", true);
          this.addToPresenceLog({ type: "log", body: "Fly mode enabled." });
        } else {
          avatarRig.setAttribute("character-controller", "fly", false);
          this.addToPresenceLog({ type: "log", body: "Fly mode disabled." });
        }
        break;
      case "grow":
        for (let i = 0; i < scales.length; i++) {
          if (scales[i] > curScale.x) {
            avatarRig.object3D.scale.set(scales[i], scales[i], scales[i]);
            avatarRig.object3D.matrixNeedsUpdate = true;
            break;
          }
        }

        break;
      case "shrink":
        for (let i = scales.length - 1; i >= 0; i--) {
          if (curScale.x > scales[i]) {
            avatarRig.object3D.scale.set(scales[i], scales[i], scales[i]);
            break;
          }
        }

        break;
      case "leave":
        this.entryManager.exitScene();
        this.remountUI({ roomUnavailableReason: "left" });
        break;
      case "duck":
        spawnChatMessage(getAbsoluteHref(location.href, ducky));
        if (Math.random() < 0.01) {
          this.scene.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_SPECIAL_QUACK);
        } else {
          this.scene.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_QUACK);
        }
        break;
      case "debug":
        physicsSystem = document.querySelector("a-scene").systems["hubs-systems"].physicsSystem;
        physicsSystem.setDebug(!physicsSystem.debugEnabled);
        break;
      case "vrstats":
        document.getElementById("stats").components["stats-plus"].toggleVRStats();
        break;
      case "scene":
        if (args[0]) {
          err = this.hubChannel.updateScene(args[0]);

          if (err === "unauthorized") {
            this.addToPresenceLog({ type: "log", body: "You do not have permission to change the scene." });
          }
        } else if (this.hubChannel.canOrWillIfCreator("update_hub")) {
          this.mediaSearchStore.sourceNavigateWithNoNav("scenes", "use");
        }

        break;
      case "rename":
        err = this.hubChannel.rename(args.join(" "));
        if (err === "unauthorized") {
          this.addToPresenceLog({ type: "log", body: "You do not have permission to rename this room." });
        }
        break;
      case "capture":
        if (!captureSystem.available()) {
          this.log("Capture unavailable.");
          break;
        }
        if (args[0] === "stop") {
          if (captureSystem.started()) {
            captureSystem.stop();
            this.log("Capture stopped.");
          } else {
            this.log("Capture already stopped.");
          }
        } else {
          if (captureSystem.started()) {
            this.log("Capture already running.");
          } else {
            captureSystem.start();
            this.log("Capture started.");
          }
        }
        break;
    }
  };
}

import { spawnChatMessage } from "./react-components/chat-message";

const DUCK_URL = "https://asset-bundles-prod.reticulum.io/interactables/Ducky/DuckyMesh-438ff8e022.gltf";

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

    const playerRig = document.querySelector("#player-rig");
    const scales = [0.0625, 0.125, 0.25, 0.5, 1.0, 1.5, 3, 5, 7.5, 12.5];
    const curScale = playerRig.object3D.scale;
    let err;
    let physicsSystem;

    switch (command) {
      case "fly":
        if (playerRig.getAttribute("character-controller").fly !== true) {
          playerRig.setAttribute("character-controller", "fly", true);
          this.addToPresenceLog({ type: "log", body: "Fly mode enabled." });
        } else {
          playerRig.setAttribute("character-controller", "fly", false);
          this.addToPresenceLog({ type: "log", body: "Fly mode disabled." });
        }
        break;
      case "grow":
        for (let i = 0; i < scales.length; i++) {
          if (scales[i] > curScale.x) {
            playerRig.object3D.scale.set(scales[i], scales[i], scales[i]);
            playerRig.object3D.matrixNeedsUpdate = true;
            break;
          }
        }

        break;
      case "shrink":
        for (let i = scales.length - 1; i >= 0; i--) {
          if (curScale.x > scales[i]) {
            playerRig.object3D.scale.set(scales[i], scales[i], scales[i]);
            break;
          }
        }

        break;
      case "leave":
        this.entryManager.exitScene();
        this.remountUI({ roomUnavailableReason: "left" });
        break;
      case "duck":
        spawnChatMessage(DUCK_URL);
        if (Math.random() < 0.01) {
          this.scene.emit("specialquack");
        } else {
          this.scene.emit("quack");
        }
        break;
      case "debug":
        physicsSystem = document.querySelector("a-scene").systems.physics;
        physicsSystem.setDebug(!physicsSystem.debug);
        break;
      case "scene":
        if (args[0]) {
          err = this.hubChannel.updateScene(args[0]);

          if (err === "unauthorized") {
            this.addToPresenceLog({ type: "log", body: "You do not have permission to change the scene." });
          }
        } else {
          this.mediaSearchStore.sourceNavigateWithNoNav("scenes");
        }

        break;
      case "rename":
        err = this.hubChannel.rename(args.join(" "));
        if (err === "unauthorized") {
          this.addToPresenceLog({ type: "log", body: "You do not have permission to rename this room." });
        }
        break;
    }
  };
}

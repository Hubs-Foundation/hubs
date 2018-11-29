import { spawnChatMessage } from "./react-components/chat-message";
const DUCK_URL = "https://asset-bundles-prod.reticulum.io/interactables/Ducky/DuckyMesh-438ff8e022.gltf";

// Handles user-entered messages
export default class MessageDispatch {
  constructor(scene, entryManager, hubChannel, addToPresenceLog, remountUI) {
    this.scene = scene;
    this.entryManager = entryManager;
    this.hubChannel = hubChannel;
    this.addToPresenceLog = addToPresenceLog;
    this.remountUI = remountUI;
  }

  dispatch = message => {
    if (message.startsWith("/")) {
      this.dispatchCommand(message.substring(1));
      document.activeElement.blur(); // Commands should blur
    } else {
      this.hubChannel.sendMessage(message);
    }
  };

  dispatchCommand = command => {
    const entered = this.scene.is("entered");

    switch (command) {
      case "help":
        // HACK for now, non-trivial to properly send this into React
        document.querySelector(".help-button").click();
        return;
    }

    if (!entered) {
      this.addToPresenceLog({ type: "log", body: "You must enter the room to use this command." });
      return;
    }

    const playerRig = document.querySelector("#player-rig");
    const scales = [0.0625, 0.125, 0.25, 0.5, 1.0, 1.5, 3, 5, 7.5, 12.5];
    const curScale = playerRig.object3D.scale;

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
      case "bigger":
        for (let i = 0; i < scales.length; i++) {
          if (scales[i] > curScale.x) {
            playerRig.object3D.scale.set(scales[i], scales[i], scales[i]);
            playerRig.object3D.matrixNeedsUpdate = true;
            break;
          }
        }

        break;
      case "smaller":
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
        this.scene.emit("quack");
        break;
    }
  };
}

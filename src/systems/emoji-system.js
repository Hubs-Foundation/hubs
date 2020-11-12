import { paths } from "./userinput/paths";
import { emojis, spawnEmojiInFrontOfUser } from "../components/emoji";

const actions = [
  paths.actions.spawnEmoji0,
  paths.actions.spawnEmoji1,
  paths.actions.spawnEmoji2,
  paths.actions.spawnEmoji3,
  paths.actions.spawnEmoji4,
  paths.actions.spawnEmoji5,
  paths.actions.spawnEmoji6
];

const EMOJI_RATE_LIMIT = 1000;

export class EmojiSystem {
  constructor(scene) {
    this.scene = scene;

    this.scene.addEventListener("enter-vr", () => {
      if (!document.getElementById("emoji-hud")) {
        const emojiHudEntity = document.createElement("a-entity");
        emojiHudEntity.id = "emoji-hud";
        emojiHudEntity.setAttribute("emoji-hud", "");
        scene.appendChild(emojiHudEntity);
      }
    });

    this.scene.addEventListener("exit-vr", () => {
      const emojiHudEntity = document.getElementById("emoji-hud");

      if (emojiHudEntity) {
        emojiHudEntity.remove();
      }
    });

    this.lastSpawnedEmoji = 0;
  }

  tick(time, userinput) {
    if (!this.scene.is("entered")) return;

    for (let i = 0; i < actions.length; i++) {
      if (
        userinput.get(actions[i]) &&
        i < emojis.length &&
        window.APP.hubChannel.can("spawn_emoji") &&
        time - this.lastSpawnedEmoji > EMOJI_RATE_LIMIT
      ) {
        this.lastSpawnedEmoji = time;
        spawnEmojiInFrontOfUser(emojis[i]);
      }
    }
  }
}

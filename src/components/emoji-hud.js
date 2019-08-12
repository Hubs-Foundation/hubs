const emojiSize = 0.15;
const margin = 0.03;
const totalSize = emojiSize + margin;

AFRAME.registerComponent("emoji-hud", {
  init() {
    const emojis = Array.from(this.el.querySelectorAll("[data-emoji]"));

    const totalWidth = totalSize * emojis.length;
    const offset = totalSize / 2;

    const playerRig = this.el.sceneEl.querySelector("#avatar-rig");
    playerRig.addEventListener("emoji_changed", ({ detail }) => {
      this.currentEmoji = detail.emojiType;
      this.updateEmojiStates();
    });

    for (let i = 0; i < emojis.length; i++) {
      const emoji = emojis[i];
      const emojiType = emoji.dataset.emoji;

      emoji.object3D.scale.setScalar(emojiSize);
      emoji.object3D.position.x = totalSize * i - totalWidth / 2 + offset;

      emoji.setAttribute("icon-button", {
        image: `${emojiType}-off.png`,
        hoverImage: `${emojiType}-on-hover.png`,
        activeImage: `${emojiType}-on.png`,
        activeHoverImage: `${emojiType}-on-hover.png`
      });

      emoji.object3D.addEventListener("interact", () => {
        const newEmoji = this.currentEmoji === emojiType ? "empty" : emojiType;
        playerRig.setAttribute("player-info", { emojiType: newEmoji });
      });
    }

    this.emojis = emojis;
  },
  updateEmojiStates() {
    for (const emoji of this.emojis) {
      emoji.setAttribute("icon-button", "active", emoji.dataset.emoji === this.currentEmoji);
    }
  }
});

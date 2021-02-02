function getAvatarMixer() {
  const el = document.getElementById("avatar-rig").querySelector("[animation-mixer]");
  const component = el && el.components["animation-mixer"];
  const mixer = component && component.mixer;
  return mixer;
}

export class EmoteSystem {
  constructor(scene) {
    this.scene = scene;
    this.queue = [];
    document.addEventListener("emote", e => {
      this.queue.push(e.detail);
    });
  }

  tick() {
    const mixer = getAvatarMixer();
    if (!mixer) {
      this.queue.length = 0;
      return;
    }
    const root = mixer._root;
    if (!root) {
      this.queue.length = 0;
      return;
    }

    for (const { name } of this.queue) {
      mixer.stopAllAction();

      const clip = root.animations.find(clip => {
        return clip.name === name;
      });
      if (!clip) {
        continue;
      }

      const action = mixer.clipAction(clip);
      action.play();

      console.log(`Playing ${name}.`, action, mixer, clip);
    }
    this.queue.length = 0;
  }
}

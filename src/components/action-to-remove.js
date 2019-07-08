AFRAME.registerComponent("action-to-remove", {
  multiple: true,

  schema: {
    path: { type: "string" },
    requireOwnership: { type: "boolean", default: true }
  },

  init() {
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.networkedEl = networkedEl;
    });
  },

  tick() {
    const userinput = AFRAME.scenes[0].systems.userinput;
    if (!userinput.get(this.data.path)) return;
    if (this.data.requireOwnership && this.networkedEl && !NAF.utils.isMine(this.networkedEl)) return;

    this.el.parentNode.removeChild(this.el);
  }
});

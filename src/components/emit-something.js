import { sets } from "../systems/userinput/sets";

AFRAME.registerComponent("action-to-event", {
  multiple: true,

  schema: {
    path: { type: "string" },
    event: { type: "string" }
  },

  tick() {
    const userinput = AFRAME.scenes[0].systems.userinput;
    if (userinput.readFrameValueAtPath(this.data.path)) {
      this.el.emit(this.data.event);
    }
  }
});

AFRAME.registerComponent("set-actionset-on-event", {
  multiple: true,

  schema: {
    set: { type: "string" },
    event: { type: "string" },
    activate: { type: "boolean" }
  },

  init() {
    const userinput = AFRAME.scenes[0].systems.userinput;
    this.el.addEventListener(this.data.event, () => {
      userinput[this.data.activate ? "activate" : "deactivate"](this.data.set);
    });
  }
});

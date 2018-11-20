/**
 * Sets all non-positional audio children to not be visible so their world matrices are not updated.
 */
AFRAME.registerComponent("set-sounds-invisible", {
  schema: {
    withinDistance: { type: "number" }
  },

  init() {
    for (const component of Object.values(this.el.components)) {
      if (component.attrName !== "sound" && !component.attrName.startsWith("sound__")) continue;
      if (component.data.positional) continue;
      component.pool.traverse(o => (o.visible = false));
    }
  }
});

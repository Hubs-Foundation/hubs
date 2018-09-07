/**
 * Sets the CSS class on an entity.
 * @component css-class
 */
AFRAME.registerComponent("css-class", {
  schema: {
    type: "string"
  },
  multiple: true,
  init() {
    this.el.classList.add(this.data);
  },
  update(oldData) {
    if (this.data !== oldData) {
      this.el.classList.remove(oldData);
      this.el.classList.add(this.data);
    }
  },
  remove() {
    this.el.classList.remove(this.data);
  }
});

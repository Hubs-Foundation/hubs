AFRAME.registerComponent("gltf-bundle", {
  schema: {
    src: { default: "" }
  },

  init: async function() {
    this._addGltfEntitiesForBundleJson = this._addGltfEntitiesForBundleJson.bind(this);

    const res = await fetch(this.data.src);
    const data = await res.json();
    this._addGltfEntitiesForBundleJson(data);
  },

  _addGltfEntitiesForBundleJson: function(bundleJson) {
    for (let i = 0; i < bundleJson.layers.length; i++) {
      const layer = bundleJson.layers[i];

      // TODO choose a proper asset based upon quality settings, etc. For now just take the first.
      if (layer.assets.length > 1) {
        throw `Unable to inflate bundle ${this.data.src} because multiple assets defined for layer ${layer.name}`;
      }

      const src = layer.assets[0].src;
      const gltfEl = document.createElement("a-gltf-entity");
      gltfEl.setAttribute("src", src);
      gltfEl.setAttribute("position", "0 0 0");
      this.el.appendChild(gltfEl);
    }
  }
});

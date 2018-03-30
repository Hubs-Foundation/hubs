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
    const loaded = [];

    for (let i = 0; i < bundleJson.assets.length; i++) {
      const asset = bundleJson.assets[i];
      const src = asset.src;
      const gltfEl = document.createElement("a-gltf-entity");
      gltfEl.setAttribute("src", src);
      gltfEl.setAttribute("position", "0 0 0");
      loaded.push(new Promise(resolve => gltfEl.addEventListener("model-loaded", resolve)));
      this.el.appendChild(gltfEl);
    }

    Promise.all(loaded).then(() => this.el.emit("bundleloaded"));
  }
});

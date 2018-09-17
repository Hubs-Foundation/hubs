/**
 * Instantiates GLTF models as specified in a bundle JSON.
 * @namespace gltf
 * @component gltf-bundle
 */
AFRAME.registerComponent("gltf-bundle", {
  schema: {
    src: { default: "" }
  },

  init: async function() {
    this._addGltfEntitiesForBundleJson = this._addGltfEntitiesForBundleJson.bind(this);
    this.baseURL = new URL(THREE.LoaderUtils.extractUrlBase(this.data.src), window.location.href);

    const res = await fetch(this.data.src);
    const data = await res.json();
    this._addGltfEntitiesForBundleJson(data);
  },

  _addGltfEntitiesForBundleJson: function(bundleJson) {
    const loaded = [];

    for (let i = 0; i < bundleJson.assets.length; i++) {
      const asset = bundleJson.assets[i];

      // TODO: for now just skip resources, eventually we will want to hold on to a reference so that we can use them
      if (asset.type === "resource") continue;

      const src = new URL(asset.src, this.baseURL).href;
      const gltfEl = document.createElement("a-entity");
      gltfEl.setAttribute("gltf-model-plus", { src, useCache: false, inflate: true });
      loaded.push(new Promise(resolve => gltfEl.addEventListener("model-loaded", resolve)));
      this.el.appendChild(gltfEl);
    }

    Promise.all(loaded).then(() => this.el.emit("bundleloaded"));
  }
});

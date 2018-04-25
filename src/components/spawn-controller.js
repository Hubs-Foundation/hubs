AFRAME.registerComponent("spawn-controller", {
  schema: {
    target: { type: "selector" },
    loadedEvent: { type: "string" }
  },
  init() {
    this.onLoad = this.onLoad.bind(this);
    this.data.target.addEventListener(this.data.loadedEvent, this.onLoad);
  },
  onLoad() {
    const spawnPoints = document.querySelectorAll("[spawn-point]");

    if (spawnPoints.length === 0) {
      // Keep default position
      return;
    }

    const spawnPointIndex = Math.round((spawnPoints.length - 1) * Math.random());
    const spawnPoint = spawnPoints[spawnPointIndex];

    spawnPoint.object3D.getWorldPosition(this.el.object3D.position);
    this.el.object3D.rotation.copy(spawnPoint.object3D.rotation);
  }
});

AFRAME.registerComponent("spawn-point", {});

AFRAME.registerComponent("invisible-player-hover-thing", {
  play() {
    this.el.setObject3D(
      "invisible-player-hover-thing",
      new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.8, 0.3),
        new THREE.MeshBasicMaterial({
          depthWrite: false,
          opacity: 0,
          transparent: true,
          color: 0x020202,
          side: THREE.BackSide
        })
      )
    );
  }
});

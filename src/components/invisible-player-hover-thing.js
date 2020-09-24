AFRAME.registerComponent("invisible-player-hover-thing", {
  play() {
    this.el.setObject3D(
      "invisible-player-hover-thing",
      new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 1.6, 0.4),
        new THREE.MeshBasicMaterial({ opacity: 0, transparent: true, color: 0x020202, side: THREE.BackSide })
      )
    );
  }
});

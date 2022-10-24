AFRAME.registerComponent("avatar-inspect-collider", {
  play() {
    this.el.setObject3D(
      "avatar-inspect-collider",
      new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.8, 0.3),
        new THREE.MeshBasicMaterial({
          visible: false
        })
      )
    );
  }
});

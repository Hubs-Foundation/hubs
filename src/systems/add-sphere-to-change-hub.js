function addVisibleSphere({ position, radius }) {
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.2 })
  );
  sphere.position.copy(position);
  sphere.matrixNeedsUpdate = true;
  AFRAME.scenes[0].object3D.add(sphere);
  return sphere;
}

function addSphereToChangeHub({ position, radius, hubId }) {
  addVisibleSphere({ radius, position });
  const el = document.createElement("a-entity");
  AFRAME.scenes[0].appendChild(el);
  setTimeout(() => {
    el.object3D.scale.setScalar(radius);
    el.object3D.position.copy(position);
    el.object3D.matrixNeedsUpdate = true;
    el.setAttribute("sphere-to-change-hub", "hubId", hubId);
  }, 0);
}
window.addSphereToChangeHub = addSphereToChangeHub;

// Example usage:
//   window.addSphereToChangeHub({ position: new THREE.Vector3(5,0,-4), radius: 4, hubId: "5BagsaW" });
//   window.addSphereToChangeHub({ position: new THREE.Vector3(-5,0,0), radius: 4, hubId: "ZvFAvCg" });

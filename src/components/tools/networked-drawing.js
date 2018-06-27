/* global THREE */
/**
 * Networked Drawing
 * @component networked-drawing
 */
AFRAME.registerComponent("networked-drawing", {
  schema: {},

  init() {
    this.points = [];

    var sampleClosedSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -40, -40),
      new THREE.Vector3(0, 40, -40),
      new THREE.Vector3(0, 140, -40),
      new THREE.Vector3(0, 40, 40),
      new THREE.Vector3(0, -40, 40)
    ]);

    var params = {
      scale: 0.02,
      extrusionSegments: 100,
      radiusSegments: 3,
      closed: true,
      animationView: false,
      lookAhead: false,
      cameraHelper: false
    };

    var geometry = new THREE.TubeBufferGeometry(
      sampleClosedSpline,
      params.extrusionSegments,
      2,
      params.radiusSegments,
      params.closed
    );

    var wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      opacity: 0.3,
      wireframe: true,
      transparent: true
    });
    var material = new THREE.MeshLambertMaterial({ color: 0xff00ff });
    var mesh = new THREE.Mesh(geometry, material);

    var wireframe = new THREE.Mesh(geometry, wireframeMaterial);
    mesh.add(wireframe);
    mesh.scale.set(params.scale, params.scale, params.scale);

    this.el.object3D.add(mesh);
  },

  play() {},

  pause() {}
});

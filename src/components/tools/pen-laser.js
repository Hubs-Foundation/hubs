AFRAME.registerComponent("pen-laser", {
  schema: {
    color: { type: "color", default: "#FF0033" },
    availableColors: {
      default: [
        "#FF0033",
        "#FFFF00",
        "#0099FF",
        "#00FF33",
        "#9900FF",
        "#FF6600",
        "#8D5524",
        "#C68642",
        "#E0AC69",
        "#F1C27D",
        "#FFDBAC",
        "#FFFFFF",
        "#222222",
        "#111111",
        "#000000"
      ]
    },
    laserVisible: { default: false },
    remoteLaserVisible: { default: false },
    laserOrigin: { default: { x: 0, y: 0, z: 0 } },
    remoteLaserOrigin: { default: { x: 0, y: 0, z: 0 } },
    laserTarget: { default: { x: 0, y: 0, z: 0 } }
  },

  init() {
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(2 * 3), 3));

    this.laser = new THREE.Line(
      lineGeometry,
      new THREE.LineBasicMaterial({
        color: "red",
        opacity: 0.2,
        transparent: true,
        visible: true
      })
    );

    //prevents the line from being a raycast target for the cursor
    this.laser.raycast = function() {};

    this.laser.frustumCulled = false;

    this.el.sceneEl.setObject3D(`pen-laser-${this.laser.uuid}`, this.laser);
  },

  update(prevData) {
    if (prevData.color != this.data.color) {
      this.laser.material.color.set(this.data.color);
    }
  },

  tick() {
    const isMine = this.el.parentEl.components.networked.initialized && this.el.parentEl.components.networked.isMine();
    const positionArray = this.laser.geometry.attributes.position.array;
    let laserVisible = false;
    if (isMine && this.data.laserVisible) {
      positionArray[0] = this.data.laserOrigin.x;
      positionArray[1] = this.data.laserOrigin.y;
      positionArray[2] = this.data.laserOrigin.z;
      positionArray[3] = this.data.laserTarget.x;
      positionArray[4] = this.data.laserTarget.y;
      positionArray[5] = this.data.laserTarget.z;
      this.laser.geometry.attributes.position.needsUpdate = true;
      laserVisible = true;
    } else if (!isMine && this.data.remoteLaserVisible) {
      positionArray[0] = this.data.remoteLaserOrigin.x;
      positionArray[1] = this.data.remoteLaserOrigin.y;
      positionArray[2] = this.data.remoteLaserOrigin.z;
      positionArray[3] = this.data.laserTarget.x;
      positionArray[4] = this.data.laserTarget.y;
      positionArray[5] = this.data.laserTarget.z;
      this.laser.geometry.attributes.position.needsUpdate = true;
      laserVisible = true;
    }

    if (this.laser.material.visible !== laserVisible) {
      this.laser.material.visible = laserVisible;
    }
  },

  remove() {
    this.el.sceneEl.removeObject3D(`pen-laser-${this.laser.uuid}`);
  }
});

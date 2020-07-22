let attachCamInterval;
class attachCamera {
  constructor() {}
  attach() {
    const camHash = "vide";
    const camEl = getFirstElementFromHash(camHash);

    if (camEl) {
      attachCamInterval = setInterval(attachCam, 10);
    } else {
      console.warn("You need to active your webcam first");
    }

    camEl.object3D.scale.setScalar(0.3);
    const selfEl = AFRAME.scenes[0].querySelector("#avatar-rig");
    const povCam = selfEl.querySelector(".model");
    var headElrotation = new THREE.Quaternion();
    const headEl = {
      position: new THREE.Vector3()
    };

    function attachCam() {
      attachObjToAvatar(camEl, selfEl);
    }

    function attachObjToAvatar(obj, avatar) {
      NAF.utils.getNetworkedEntity(obj).then(networkedEl => {
        const mine = NAF.utils.isMine(networkedEl);
        if (!mine) var owned = NAF.utils.takeOwnership(networkedEl);
        avatar.querySelectorAll("#avatar-head")[0].object3D.getWorldPosition(headEl.position);
        networkedEl.object3D.position.copy(headEl.position);
        networkedEl.object3D.position.y += 0.05;
        networkedEl.object3D.setRotationFromQuaternion(avatar.querySelectorAll("#avatar-head")[0].object3D.getWorldQuaternion(headElrotation));
      });
    }

    function getFirstElementFromHash(hash) {
      const g = AFRAME.scenes[0].querySelectorAll("[media-loader]");
      const matches = [];
      for (const e of g) {
        const m = e.components["media-loader"].attrValue.src.match(hash);
        if (m && m.length) matches.push(e);
      }
      return matches[0];
    }
  }

  detach() {
    attachCamInterval = clearInterval();
  }
}

export default attachCamera;

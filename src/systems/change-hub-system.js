/* global APP */
import { changeHub } from "../change-hub";
import "./add-sphere-to-change-hub";

const spheres = [];
AFRAME.registerComponent("sphere-to-change-hub", {
  schema: {
    hubId: { type: "string" }
  },
  init() {
    spheres.push(this);
  },
  remove() {
    spheres.splice(spheres.indexOf(this), 1);
  }
});

const isInSphere = (() => {
  const scale = new THREE.Vector3();
  const spherePosition = new THREE.Vector3();
  const deltaPosition = new THREE.Vector3();
  return function isInSphere(point, sphere) {
    sphere.updateMatrices();
    spherePosition.setFromMatrixPosition(sphere.matrixWorld);
    const radius = scale.setFromMatrixScale(sphere.matrixWorld).x;
    return radius * radius > deltaPosition.subVectors(point, spherePosition).lengthSq();
  };
})();

export class ChangeHubSystem {
  constructor() {
    // TODO see if there is a better way to do this with react router
    window.addEventListener("popstate", function(e) {
      const qs = new URLSearchParams(location.search);
      const newHubId = qs.get("hub_id") || document.location.pathname.substring(1).split("/")[0];
      if (newHubId !== APP.hub.hub_id) {
        changeHub(newHubId, false);
      }
    });
  }

  tick = (() => {
    const avatarHeadPosition = new THREE.Vector3();
    let isChangingHub = false;
    let avatarPovNode;
    return () => {
      if (isChangingHub) return;
      avatarPovNode = avatarPovNode || document.getElementById("avatar-pov-node").object3D;

      avatarPovNode.updateMatrices();
      avatarHeadPosition.setFromMatrixPosition(avatarPovNode.matrixWorld);
      spheres.forEach(sphere => {
        if (APP.hubChannel.hubId !== sphere.data.hubId && isInSphere(avatarHeadPosition, sphere.el.object3D)) {
          isChangingHub = true;
          changeHub(sphere.data.hubId).finally(() => {
            isChangingHub = false;
          });
        }
      });
    };
  })();
}

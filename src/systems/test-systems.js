import { generateUUID } from "../utils/generate-uuid";

window.clientId = generateUUID();
function createBox() {
  const box = {
    entityId: generateUUID(),

    hasOwner: true,
    ownerId: window.clientId,
    senderId: window.clientId,
    ownerTime: Date.now(),

    isBox: true,
    position: new THREE.Vector3(0, 1, 0),

    hasColor: true,
    color: new THREE.Color(1, 0, 0)
  };
  APP.jeejah.create(box);
  return box.entityId;
}
window.createBox = createBox;
function update(entityId, payload) {
  APP.jeejah.update({ entityId, senderId: window.clientId, ...payload });
}
window.update = update;
function takeOwnership(entityId) {
  APP.jeejah.update({ entityId, senderId: window.clientId, ownerId: window.clientId, ownerTime: Date.now() });
}
window.takeOwnership = takeOwnership;

function runTest() {
  const jj = APP.jeejah;
  const boxA = {
    entityId: generateUUID(),
    isBox: true,
    hasColor: true,
    color: new THREE.Color(1, 0, 0),
    position: new THREE.Vector3(0, 1, 0)
  };
  const boxB = {
    entityId: generateUUID(),
    isBox: true,
    hasColor: true,
    color: new THREE.Color(1, 0, 0),
    position: new THREE.Vector3(5, 1, 0)
  };
  const sphereA = {
    entityId: generateUUID(),
    isSphere: true,
    hasColor: true,
    color: new THREE.Color(0, 0, 1),
    position: new THREE.Vector3(0, 2, 0)
  };
  const sphereB = {
    entityId: generateUUID(),
    isSphere: true,
    color: new THREE.Color(0, 1, 1),
    position: new THREE.Vector3(2, 2, 0)
  };

  jj.create(boxA);
  // jj.create(boxB);
  // jj.create(sphereA);
  // jj.create(sphereB);

  setTimeout(() => {
    jj.update({
      entityId: boxA.entityId,
      color: new THREE.Color(0, 1, 0)
    });
  }, 1000);
  setTimeout(() => {
    jj.update({
      entityId: boxA.entityId,
      color: new THREE.Color(0, 0, 1),
      position: new THREE.Vector3(1, 1, 0)
    });
  }, 2000);
  setTimeout(() => {
    jj.update({
      entityId: boxA.entityId,
      color: new THREE.Color(0, 1, 0)
    });
  }, 3000);
  setTimeout(() => {
    jj.update({
      entityId: boxA.entityId,
      color: new THREE.Color(0, 0, 1),
      position: new THREE.Vector3(2, 1, 0)
    });
  }, 4000);
  setTimeout(() => {
    jj.delete({
      entityId: boxA.entityId
    });
  }, 5000);
  setTimeout(() => {
    jj.update({
      entityId: boxA.entityId,
      color: new THREE.Color(1, 1, 1),
      position: new THREE.Vector3(3, 1, 0)
    });
  }, 5000);
}

window.test = runTest;

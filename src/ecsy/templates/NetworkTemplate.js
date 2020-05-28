import { Networked } from "../components/Networked";
import { Object3DComponent } from "ecsy-three";

function almostEqualVec3(curVec, prevArr, epsilon) {
  return (
    Math.abs(curVec.x - prevArr[0]) < epsilon &&
    Math.abs(curVec.y - prevArr[1]) < epsilon &&
    Math.abs(curVec.z - prevArr[2]) < epsilon
  );
}

export function gatherVector3(nextData, lastSentData, value, destKey) {
  if (!lastSentData[destKey] || !almostEqualVec3(value, lastSentData[destKey], 0.001)) {
    if (!nextData) {
      nextData = {};
    }

    nextData[destKey] = value.toArray();
  }

  return nextData;
}

export function gatherPosition(nextData, lastSentData, entity, destKey = "position") {
  return gatherVector3(nextData, lastSentData, entity.getComponent(Object3DComponent).value.position, destKey);
}

export function gatherRotation(nextData, lastSentData, entity, destKey = "rotation") {
  return gatherVector3(nextData, lastSentData, entity.getComponent(Object3DComponent).value.rotation, destKey);
}

export function gatherScale(nextData, lastSentData, entity, destKey = "scale") {
  return gatherVector3(nextData, lastSentData, entity.getComponent(Object3DComponent).value.scale, destKey);
}

export function updateVector3(target, data, srcKey) {
  const value = data[srcKey];

  if (value) {
    target.fromArray(value);
  }
}

export function updatePosition(entity, data, srcKey = "position") {
  const value = data[srcKey];

  if (value) {
    entity.position.fromArray(value);
    entity.matrixNeedsUpdate = true;
  }
}

export function updateRotation(entity, data, srcKey = "rotation") {
  const value = data[srcKey];

  if (value) {
    entity.rotation.fromArray(value);
    entity.matrixNeedsUpdate = true;
  }
}

export class NetworkTemplate {
  static id = "default";

  createEntity(world) {
    const entity = this.createLocalEntity(world);
    // TODO: If we call this before NAF has connected, the clientId won't be set.
    entity.addComponent(Networked, {
      networkId: entity.uuid,
      owner: NAF.clientId,
      creator: NAF.clientId,
      template: this.constructor.id
    });
    return entity;
  }

  createLocalEntity(world) {
    return world.createEntity();
  }

  createRemoteEntity(world) {
    return this.createLocalEntity(world);
  }

  gatherEntityData(_entity, _lastSentData) {}

  updateEntity(_entity, _data) {}

  disposeEntity(entity) {
    entity.dispose();
  }
}

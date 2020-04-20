import { Component } from "ecsy";

/**
 * An interactor can have one hover target, one grabbed object, and many attached objects.
 * The grabbed object will be dropped when the grab end action is true.
 * The grabbed object should also be added to the attached objects array.
 * An object that should be attached on grab should be added to the attachedObjects array, but not
 * set to the grabTarget. The object is then in control of when it should be dropped, it should however
 * update the grabEnded
 */
export class Interactor extends Component {
  constructor() {
    super();
    this.hoverEntity = null;
    this.grabbedEntity = null;
    this.attachedEntities = [];
    this.hoverStarted = false;
    this.hovering = false;
    this.hoverEnded = false;
    this.grabStarted = false;
    this.grabbing = false;
    this.grabEnded = false;
    this.attachedEntitiesAdded = false;
    this.attachedEntitiesRemoved = false;
    this.grabStartActionPath = null;
    this.grabEndActionPath = null;
  }

  grab(entity) {
    if (!this.grabbedEntity) {
      this.grabbedEntity = entity;
      this.grabbing = true;
      this.grabStarted = true;
      this.attach(entity);
    }
  }

  drop(entity) {
    if (this.grabbedEntity === entity) {
      this.grabbedEntity = null;
      this.grabbing = false;
      this.grabEnded = true;
      this.detach(entity);
    }
  }

  attach(entity) {
    const index = this.attachedEntities.indexOf(entity);

    if (index === -1) {
      this.attachedEntities.push(entity);
      this.attachedEntitiesAdded = true;
    }
  }

  detach(entity) {
    const index = this.attachedEntities.indexOf(entity);

    if (index !== -1) {
      this.attachedEntities.splice(index, 1);
      this.attachedEntitiesRemoved = true;
    }
  }

  detachAll() {
    this.attachedEntities.length === 0;
    this.attachedEntitiesRemoved = true;
  }

  reset() {
    this.hoverTarget = null;
    this.grabTarget = null;
    this.attachedEntities.length = 0;
    this.hoverStarted = false;
    this.hovering = false;
    this.hoverEnded = false;
    this.grabStarted = false;
    this.grabbing = false;
    this.grabEnded = false;
    this.attachedEntitiesAdded = false;
    this.attachedEntitiesRemoved = false;
    this.grabStartActionPath = null;
    this.grabEndActionPath = null;
  }
}

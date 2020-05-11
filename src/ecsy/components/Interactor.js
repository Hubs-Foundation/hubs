import { Component } from "ecsy";
import { PropTypes } from "ecsy-three";

/**
 * An interactor can have one hover target, one grabbed object, and many attached objects.
 * The grabbed object will be dropped when the grab end action is true.
 * The grabbed object should also be added to the attached objects array.
 * An object that should be attached on grab should be added to the attachedObjects array, but not
 * set to the grabTarget. The object is then in control of when it should be dropped, it should however
 * update the grabEnded
 */
export class Interactor extends Component {
  static schema = {
    hoverEntity: { type: PropTypes.Object },
    grabbedEntity: { type: PropTypes.Object },
    attachedEntities: { type: PropTypes.Array },
    hoverStarted: { type: PropTypes.Boolean },
    hovering: { type: PropTypes.Boolean },
    hoverEnded: { type: PropTypes.Boolean },
    grabStarted: { type: PropTypes.Boolean },
    grabbing: { type: PropTypes.Boolean },
    grabEnded: { type: PropTypes.Boolean },
    attachedEntitiesAdded: { type: PropTypes.Boolean },
    attachedEntitiesRemoved: { type: PropTypes.Boolean },
    hoverActionSet: { type: PropTypes.String },
    grabStartActionPath: { type: PropTypes.String },
    grabEndActionPath: { type: PropTypes.String }
  };

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
}

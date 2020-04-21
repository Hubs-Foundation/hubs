export function EntityMixin(Object3DClass) {
  return class extends Object3DClass {
    constructor(...args) {
      super(...args);

      this._entityManager = null;

      this.alive = false;

      // List of components types the entity has
      this._ComponentTypes = [];

      // Instance of the components
      this._components = {};

      this._componentsToRemove = {};

      // Used for deferred removal
      this._ComponentTypesToRemove = [];

      //if there are state components on a entity, it can't be removed completely
      this._numStateComponents = 0;

      this.isEntity = true;
    }

    getComponent(Component, includeRemoved) {
      return this._entityManager.entityGetComponent(Component, includeRemoved);
    }

    getRemovedComponent(Component) {
      return this._entityManager.getRemovedComponent(this, Component);
    }

    getComponents() {
      return this._entityManager.getComponents(this);
    }

    getComponentsToRemove() {
      return this._entityManager.entityGetComponentsToRemove(this);
    }

    getComponentTypes() {
      return this._entityManager.entityGetComponentTypes(this);
    }

    getMutableComponent(Component) {
      return this._entityManager.entityGetMutableComponent(this, Component);
    }

    addComponent(Component, values) {
      return this._entityManager.entityAddComponent(this, Component, values);
    }

    removeComponent(Component, forceImmediate) {
      return this._entityManager.entityRemoveComponent(this, Component, forceImmediate);
    }

    hasComponent(Component, includeRemoved) {
      return this._entityManager.entityHasComponent(this, Component, includeRemoved);
    }

    hasRemovedComponent(Component) {
      return this._entityManager.entityHasRemovedComponent(this, Component);
    }

    hasAllComponents(Components) {
      return this._entityManager.entityHasAllComponents(Components);
    }

    hasAnyComponents(Components) {
      return this._entityManager.entityHasAnyComponents(this, Components);
    }

    removeAllComponents(forceImmediate) {
      this._entityManager.entityRemoveAllComponents(this, forceImmediate);
    }

    traverseEntities(callback) {
      this.traverse(object => {
        if (object.isEntity) {
          callback(object);
        }
      });
    }

    add(object) {
      const result = super.add(object);

      if (this._entityManager) {
        object.traverse(child => {
          if (child.isEntity) {
            this._entityManager.addEntity(child);
          }
        });
      }

      return result;
    }

    remove(object) {
      if (this._entityManager) {
        object.traverse(child => {
          if (child.isEntity) {
            this._entityManager.disposeEntity(child);
          }
        });
      }

      return super.remove(object);
    }

    dispose(forceImmediate) {
      this._entityManager.disposeEntity(this, forceImmediate);
    }
  };
}

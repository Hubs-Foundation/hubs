export const EntitySymbol = Symbol("Entity");

export function EntityMixin(Object3DClass) {
  const EntityClass = class extends Object3DClass {
    constructor(...args) {
      super(...args);

      this.world = null;
      this.isEntity = true;
      this.components = [];
      this.componentsByType = new Map();
      this.tags = [];
      this.isStatic = false;
      this.matrixAutoUpdate = true;
    }

    onAdded() {}

    onRemoved() {}

    add(entity) {
      super.add(entity);

      if (this.world) {
        entity.traverse(child => {
          if (child.isEntity) {
            this.world.onEntityAdded(child);
          }
        });
      }

      return this;
    }

    remove(entity) {
      super.remove(entity);

      entity.traverse(child => {
        if (child.isEntity) {
          this.world.onEntityRemoved(child);
        }
      });

      return this;
    }

    addComponent(ComponentClass, ...args) {
      const component = new ComponentClass(...args);
      this.components.push(component);
      this.componentsByType.set(ComponentClass, component);

      if (this.world) {
        this.world.onComponentAdded(this, ComponentClass);
      }

      return component;
    }

    removeComponent(ComponentClass) {
      if (!this.componentsByType.has(ComponentClass)) {
        return false;
      }

      const index = this.components.findIndex(component => component.constructor === ComponentClass);

      if (index !== -1) {
        this.components.splice(index, 1);
      }

      this.componentsByType.delete(ComponentClass);

      if (this.world) {
        this.world.onComponentRemoved(this, ComponentClass);
      }

      return true;
    }

    getComponent(ComponentClass) {
      return this.componentsByType.get(ComponentClass);
    }

    hasComponent(ComponentClass) {
      return this.componentsByType.has(ComponentClass);
    }

    addTag(tag) {
      if (this.tag.indexOf(tag) !== -1) {
        return false;
      }

      this.tags.push(tag);

      if (this.world) {
        this.world.onTagAdded(this, tag);
      }

      return true;
    }

    removeTag(tag) {
      const index = this.tags.indexOf(tag);

      if (index === -1) {
        return false;
      }

      this.tags.splice(index, 1);

      if (this.world) {
        this.world.onTagRemoved(this, tag);
      }

      return true;
    }

    hasTag(tag) {
      return this.tags.indexOf(tag) !== -1;
    }

    findChildEntityByType(EntityType) {
      let entity;

      this.traverseEntitiesEarlyOut(child => {
        if (child !== this && child.constructor === EntityType) {
          entity = child;
          return false;
        }
      });

      return entity;
    }

    getChildEntitiesByType(EntityType, target = []) {
      this.traverseEntities(child => {
        if (child !== this && child.constructor === EntityType) {
          target.push(child);
        }
      });

      return target;
    }

    findChildEntityWithComponent(ComponentClass) {
      let entity;

      this.traverseEntitiesEarlyOut(child => {
        if (child !== this && child.componentsByType.get(ComponentClass)) {
          entity = child;
          return false;
        }
      });

      return entity;
    }

    getChildEntitiesWithComponent(ComponentClass, target = []) {
      this.traverseEntities(child => {
        if (child !== this && child.componentsByType.get(ComponentClass)) {
          target.push(child);
        }
      });

      return target;
    }

    findChildEntityWithTag(tag) {
      let entity;

      this.traverseEntitiesEarlyOut(child => {
        if (child !== this && child.tags.indexOf(tag) !== -1) {
          entity = child;
          return false;
        }
      });

      return entity;
    }

    getChildEntitiesWithTag(tag, target = []) {
      this.traverseEntities(child => {
        if (child !== this && child.tags.indexOf(tag) !== -1) {
          target.push(child);
        }
      });

      return target;
    }

    traverseEntities(callback) {
      callback(this);

      for (let i = 0; i < this.children.length; i++) {
        const child = this.children[i];

        if (child.isEntity) {
          child.traverseEntities(callback);
        }
      }
    }

    traverseEntitiesEarlyOut(callback) {
      if (callback(this) === false) {
        return false;
      }

      for (let i = 0; i < this.children.length; i++) {
        const child = this.children[i];

        if (child.isEntity && child.traverseEntitiesEarlyOut(callback) === false) {
          return false;
        }
      }

      return true;
    }

    // Restore updateMatrixWorld behavior except all static entities will
    // require the force flag to update. For environmnents without a lot of
    // dynamic objects this still works quite well and gives developers the
    // ThreeJS API they are used to.
    updateMatrix() {
      this.matrix.compose(
        this.position,
        this.quaternion,
        this.scale
      );
      this.matrixWorldNeedsUpdate = true;
    }

    updateMatrixWorld(force) {
      if (this.isStatic && !force) {
        return;
      }

      if (this.matrixAutoUpdate) this.updateMatrix();

      if (this.matrixWorldNeedsUpdate || force) {
        if (this.parent === null) {
          this.matrixWorld.copy(this.matrix);
        } else {
          this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
        }

        this.matrixWorldNeedsUpdate = false;

        force = true;
      }

      // update children

      const children = this.children;

      for (let i = 0, l = children.length; i < l; i++) {
        children[i].updateMatrixWorld(force);
      }
    }

    clone(recursive) {
      return new this.constructor().copy(this, recursive);
    }

    copy(source, recursive) {
      super.copy(source, recursive);

      source.components.forEach(component => {
        const clonedComponent = component.clone();
        this.components.push(clonedComponent);
        this.componentsByType.set(clonedComponent.constructor, clonedComponent);
      });

      source.tags.forEach(tag => {
        this.tags.push(tag);
      });

      return this;
    }

    dispose() {}
  };

  EntityClass[EntitySymbol] = true;

  return EntityClass;
}

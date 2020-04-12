import {
  Scene,
  Vector2,
  Vector3,
  Vector4,
  Color,
  Euler,
  Quaternion,
  Matrix3,
  Matrix4,
  Box2,
  Box3,
  Cylindrical,
  Object3D,
  Group,
  Mesh
} from "three";

// Use symbols to ensure registered objects are compatible with the API
const EntitySymbol = Symbol("Entity");
const ComponentSymbol = Symbol("Component");
const SystemSymbol = Symbol("System");

const copyValue = value => value;
const copyObject = value => (value ? JSON.parse(JSON.stringify(value)) : value);
const copyClone = value => (value ? value.clone() : value);

const RegisteredTypes = new Map([
  [undefined, copyValue],
  [null, copyValue],
  [String, copyValue],
  [Number, copyValue],
  [Boolean, copyValue],
  [Symbol, copyValue],
  [Function, copyValue],
  [Object, copyObject],
  [Vector2, copyClone],
  [Vector3, copyClone],
  [Vector4, copyClone],
  [Color, copyClone],
  [Euler, copyClone],
  [Quaternion, copyClone],
  [Matrix3, copyClone],
  [Matrix4, copyClone],
  [Box2, copyClone],
  [Box3, copyClone],
  [Cylindrical, copyClone],
  [Euler]
]);

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
          child.world = null;
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

export class Component {
  static schema = {};

  constructor() {
    this.isComponent = true;
    this.reset();
  }

  clone() {
    return new this.constructor().copy(this);
  }

  copy(source) {
    const schema = this.constructor.schema;

    for (const propName in schema) {
      const prop = schema[propName];
      this[propName] = RegisteredTypes.get(prop.type)(source[propName]);
    }
  }

  reset() {
    const schema = this.constructor.schema;

    for (const propName in schema) {
      const prop = schema[propName];
      this[propName] = RegisteredTypes.get(prop.type)(prop.default);
    }
  }

  dispose() {}
}

Component[ComponentSymbol] = true;

export class System {
  constructor(world) {
    this.world = world;
  }

  update(/* dt */) {}
}

System[SystemSymbol] = true;

export class SceneEntity extends EntityMixin(Scene) {}
export class Object3DEntity extends EntityMixin(Object3D) {}
export class GroupEntity extends EntityMixin(Group) {}
export class MeshEntity extends EntityMixin(Mesh) {}

export class World {
  constructor() {
    // All the entities in the scene.
    this.entities = [];

    // All the entities in the scene by id.
    this.entitiesById = {};

    // All of the registered entity constructors.
    this.entityTypes = [];

    // Key is the entity constructor, values are an array of entities that match the type.
    this.entitiesByType = new Map();

    // All of the registered component constructors.
    this.componentTypes = [];

    // Key is the component constructor, values are an array of entities that match the type.
    this.entitiesByComponent = new Map();

    // Key is the tag, values are the entities with the given tag.
    this.entitiesByTag = {};

    // All of the registered systems. Ordered in the order they will be executed.
    this.systems = [];

    this.registerEntityType(Object3DEntity);
    this.registerEntityType(SceneEntity);
    this.registerEntityType(GroupEntity);
    this.registerEntityType(MeshEntity);

    // The root object3D
    this.root = new SceneEntity();
    this.onEntityAdded(this.root);
  }

  registerType(TypeKey, cloneMethod) {
    if (RegisteredTypes.has(TypeKey)) {
      throw new Error(`Type "${TypeKey}" already registered.`);
    }

    RegisteredTypes.set(TypeKey, cloneMethod);
  }

  registerEntityType(EntityConstructor) {
    if (!EntityConstructor[EntitySymbol]) {
      throw new Error(`Not a valid entity class.`);
    }

    if (this.entityTypes.indexOf(EntityConstructor) !== -1) {
      throw new Error(`Entity "${EntityConstructor.name}" already registered.`);
    }

    this.entityTypes.push(EntityConstructor);
    this.entitiesByType.set(EntityConstructor, []);
  }

  registerComponent(ComponentClass) {
    if (!ComponentClass[ComponentSymbol]) {
      throw new Error(`Not a valid component class.`);
    }

    if (this.entityTypes.indexOf(ComponentClass) !== -1) {
      throw new Error(`Component "${ComponentClass.name}" already registered.`);
    }

    if (!ComponentClass.schema) {
      throw new Error("Component class must have a schema defined");
    }

    for (const propName in ComponentClass.schema) {
      const prop = ComponentClass.schema[propName];

      if (prop.type === undefined) {
        throw new Error("Component schema must have a type defined for each property.");
      }
    }

    this.componentTypes.push(ComponentClass);
    this.entitiesByComponent.set(ComponentClass, []);
  }

  registerSystem(SystemClass) {
    if (!SystemClass[SystemSymbol]) {
      throw new Error(`Not a valid system class.`);
    }

    if (this.systems.findIndex(system => system.constructor === SystemClass) !== -1) {
      throw new Error(`System "${SystemClass.name}" already registered.`);
    }

    this.systems.push(new SystemClass(this));
  }

  onEntityAdded(entity) {
    entity.world = this;

    this.entities.push(entity);
    this.entitiesById[entity.id] = entity;
    this.entitiesByType.get(entity.constructor).push(entity);

    for (let i = 0; i < entity.components.length; i++) {
      const component = entity.components[i];
      this.onComponentAdded(entity, component.constructor);
    }

    for (let i = 0; i < entity.tags.length; i++) {
      const tag = entity.tags[i];
      this.onTagAdded(entity, tag);
    }
  }

  onEntityRemoved(entity) {
    const entityIndex = this.entities.indexOf(entity);

    if (entityIndex !== -1) {
      this.entities.splice(entityIndex, 1);
    }

    delete this.entitiesById[entity.id];

    const entityByType = this.entitiesByType.get(entity.constructor);

    const entityByTypeIndex = entityByType.indexOf(entity);

    if (entityByTypeIndex !== -1) {
      entityByType.splice(entityByTypeIndex, 1);
    }

    for (let i = 0; i < entity.components.length; i++) {
      const component = entity.components[i];
      this.onComponentRemoved(entity, component.constructor);
    }

    for (let i = 0; i < entity.tags.length; i++) {
      const tag = entity.tags[i];
      this.onTagRemoved(entity, tag);
    }
  }

  onComponentAdded(entity, ComponentClass) {
    this.entitiesByComponent.get(ComponentClass).push(entity);
  }

  onComponentRemoved(entity, ComponentClass) {
    const entityByComponent = this.entitiesByComponent.get(ComponentClass);
    const entityByComponentIndex = entityByComponent.indexOf(entity);

    if (entityByComponentIndex !== -1) {
      entityByComponent.splice(entityByComponentIndex, 1);
    }
  }

  onTagAdded(entity, tag) {
    if (!this.entitiesByTag[tag]) {
      this.entitiesByTag[tag] = [];
    }

    this.entitiesByTag[tag].push(entity);
  }

  onTagRemoved(entity, tag) {
    const entityByTag = this.entitiesByTag[tag];
    const entityByTagIndex = entityByTag.indexOf(entity);

    if (entityByTagIndex !== -1) {
      entityByTag.splice(entityByTagIndex, 1);
    }
  }
}

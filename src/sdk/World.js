import { Object3DEntity, SceneEntity, GroupEntity, MeshEntity, ImageEntity } from "./entities";
import { types } from "./types";
import { EntitySymbol } from "./EntityMixin";
import { ComponentSymbol } from "./Component";
import { SystemSymbol } from "./System";

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
    this.registerEntityType(ImageEntity);

    // The root object3D
    this.root = new SceneEntity();
    this.onEntityAdded(this.root);
  }

  registerType(TypeKey, cloneMethod) {
    if (types.has(TypeKey)) {
      throw new Error(`Type "${TypeKey}" already registered.`);
    }

    types.set(TypeKey, cloneMethod);
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

  registerSystem(SystemClass, ...args) {
    if (!SystemClass[SystemSymbol]) {
      throw new Error(`Not a valid system class.`);
    }

    if (this.systems.findIndex(system => system.constructor === SystemClass) !== -1) {
      throw new Error(`System "${SystemClass.name}" already registered.`);
    }

    this.systems.push(new SystemClass(this, ...args));
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

    entity.onAdded();
  }

  onEntityRemoved(entity) {
    entity.world = null;

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

    entity.onRemoved();
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

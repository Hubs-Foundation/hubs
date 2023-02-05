- [Intro](#org71ab195)
- [Entities, components, systems.](#org739a535)
  - [`bitECS`](#org0bfe8ab)
  - [Disclaimer](#orgff3efea)
- [Writing systems](#org751fbe1)
  - [Systems are functions](#org775dcd0)
  - [The game loop](#orga589afa)
  - [Queries are useful](#org1d5d556)
  - [Replacing `async` functions with `coroutines`](#org2233e62)
- [Writing components](#org7331485)
  - [Defining components](#org18a6d0b)
  - [Data types](#org3db6503)
  - [Avoid holding references](#org589f3d9)
  - [Entity ID&rsquo;s are recycled](#org31d40f6)
  - [String data](#orgdf10967)
  - [Flags](#org70bd5dd)
  - [Tag components](#org58d595d)
  - [The escape hatch](#orga5547d0)
  - [Associating entities with `Object3D` s](#orgf29a631)
  - [Avoid duplicating state](#orgfe9fb09)
- [Adding entities](#orgbad6d63)
  - [Entity basics](#org9d285be)
  - [Creating `EntityDef` s](#orgdd790f5)
  - [Creating model files](#org156c909)
  - [Entity creation is synchronous](#org2319bae)
  - [Inflation](#org628683b)
    - [What does `renderAsEntity` do?](#org20a38aa)
    - [`Inflator` s](#org357d40d)
    - [Default inflators](#orga810c47)
    - [Associating `Object3D` s (`eid2obj`)](#org4f9fcd3)
    - [Loading model files](#org7a41123)
    - [Common inflators, `jsxInflators`, and `gltfInflators`](#org8ca2b33)
    - [Entity `Ref` s and `__mhc_link_type` : `"node"`](#orgfcfa191)
    - [Associating `Material` s (`eid2mat`)](#org7fe068b)
- [Custom clients and addons](#org1a8110a)
  - [Addons are not ready yet (February 2023)](#org2b06d43)
  - [Creating an add-on](#org35960ac)
  - [`preload`](#orge79e4e1)
  - [Inserting prefabs](#org1d14013)
  - [Inserting inflators](#org86ae847)
  - [Inserting system calls](#org354b138)
  - [Handling interactions](#org306c661)
  - [Handling networking](#org19b999f)

\#+TITLE Core Concepts for Gameplay Code

Core Concepts for Gameplay Code


<a id="org71ab195"></a>

# Intro

This document gives an overview of the core concepts for writing gameplay code in the Hubs client.


<a id="org739a535"></a>

# Entities, components, systems.

ECS became a popular topic in recent years.

-   Unity&rsquo;s `DOTS` emphasizes data-oriented design for speed and control, separates behavior from data, and helps developers build multi-threaded game loops.
-   Supermedium&rsquo;s `A-Frame` emphasizes ease of use and a low barrier to entry, exposes three.js through familiar HTML, and enables rapid prototyping with many built-in components and hundreds more from the community.

Originally built with `A-Frame`, Hubs switched to `bitECS` and using `three.js` directly. Motivation, goals, and non-goals about the transition can be found in this PR from June, 2022. <https://github.com/mozilla/hubs/pull/5536>


<a id="org0bfe8ab"></a>

## `bitECS`

The `bitECS` API is minimal, and its own documentation should be consulted for details. The main ideas from the Hubs gameplay code perspective are:

-   Component data are structs of arrays. <https://en.wikipedia.org/wiki/AoS_and_SoA>
-   Entities are indices into these arrays.
-   Queries filter entities by their associated components.

`bitECS` has no built-in concept of systems. We frequently refer the functions invoked during the game loop as &ldquo;systems&rdquo;, but there is no formal construct.


<a id="orgff3efea"></a>

## Disclaimer

Much has been written about the philosophy of various ECS frameworks and design choices. Our choices should not be interpreted fanatically.

We need to store game state somehow, and conventions are useful. We use three.js, which means a lot of game state is stored in various `Object3D` subtypes. We store the rest in `bitECS` entities and components, or `map` s from entity to struct in cases where `bitECS` components won&rsquo;t do.

In other words, our game state is not &ldquo;purely&rdquo; in ECS, nor do we care to make it so. The PR linked above states the (relatively humble) goals and non-goals of our entity framework.


<a id="org751fbe1"></a>

# Writing systems


<a id="org775dcd0"></a>

## Systems are functions

`bitECS` has no built-in concept of systems. We frequently refer the functions invoked during the game loop as &ldquo;systems&rdquo;, but there is no formal construct.


<a id="orga589afa"></a>

## The game loop

We provide the browser&rsquo;s `requestAnimationFrame` with our game loop function (`mainTick`), to be invoked each frame.


<a id="org1d5d556"></a>

## Queries are useful

`bitECS` queries allow us to find entities based on the components that are attached to them. `enterQuery` and `exitQuery` wrap regular queries so that we handle when an entity first matches or stops matching a given query. The `bitECS` documentation should be consulted for more details.


<a id="org2233e62"></a>

## Replacing `async` functions with `coroutines`

TODO: Describe `JobRunner` and `coroutine` s.


<a id="org7331485"></a>

# Writing components


<a id="org18a6d0b"></a>

## Defining components

`bitECS` components are defined with `defineComponent`.


<a id="org3db6503"></a>

## Data types

`bitECS` components only store numeric types: `i8`, `ui8`, `ui8c`, `i16`, `ui16`, `i32`, `ui32`, `f32`, `f64`, and `eid`.

The sections below describe what we do when we need to store non-numeric data.


<a id="org589f3d9"></a>

## Avoid holding references

The `eid` type indicates that the property values will be entity IDs. Be careful when storing references to entities. If the referenced entity is removed from the world with `removeEntity`, then you should consider the entity reference in the component to be invalid! You can use `entityExists` to check whether the referenced entity still exists, but in general it is best to avoid storing entity references if you can.

The most common scenario for using the `eid` type is when building multi-entity objects, such as in-world menus. The `VideoMenu` component stores references to each entity so that it can manage them all easily.

```typescript
export const VideoMenu = defineComponent({
  videoRef: Types.eid,
  timeLabelRef: Types.eid,
  trackRef: Types.eid,
  headRef: Types.eid,
  playIndicatorRef: Types.eid,
  pauseIndicatorRef: Types.eid
});
```


<a id="org31d40f6"></a>

## Entity ID&rsquo;s are recycled

After an entity is removed (by `removeEntity`), its `EntityID` can later be reused in subsequent calls to `addEntity`. This does not happen right away, but is something you should be aware of, and is all the more reason to avoid holding onto entity references.


<a id="orgdf10967"></a>

## String data

We sometimes want to be able to store string data in components. Since `bitECS` does not allow strings in components, we store numeric string ID&rsquo;s instead.

For example, consider a `SceneLoader` component with a `src` property, which we wish was a string.

```typescript
export const SceneLoader = defineComponent({ src: Types.ui32 });
SceneLoader.src[$isStringType] = true;
```

The symbol `$isStringType`, defined in `bit-components.js`, indicates that this property is a string handle. Code that handles component state anonymously (e.g. `createDefaultInflator`) use this to correctly handle the property values.

Strings are converted to numeric `StringID` s by the `getSid` function. `StringID` s can be converted back to strings by the `getString` function.

```typescript
const src = APP.getString(SceneLoader.src[loaderEid]);
console.log(`Loading scene from this url: ${src}`);
```


<a id="org70bd5dd"></a>

## Flags

`bitECS` components do not support `boolean` properties. In lieu of boolean properties, we often define a single `flags` property as an unsigned integer type to use as a bitmask:

```typescript
export const Waypoint = defineComponent({
  flags: Types.ui8
});

// Use bit shifting to create values we can use instead of booleans
export enum WaypointFlags {
  canBeSpawnPoint = 1 << 0,
  canBeOccupied = 1 << 1,
  canBeClicked = 1 << 2,
  willDisableMotion = 1 << 3,
  willDisableTeleporting = 1 << 4,
  willMaintainInitialOrientation = 1 << 5,
  snapToNavMesh = 1 << 6
}

// These values are booleans because they originate from an external source, like json in a gltf file.
export interface WaypointParams {
  canBeSpawnPoint: boolean;
  canBeOccupied: boolean;
  canBeClicked: boolean;
  willDisableMotion: boolean;
  willDisableTeleporting: boolean;
  willMaintainInitialOrientation: boolean;
  snapToNavMesh: boolean;
}

// When we inflate a waypoint component, we pack the booleans into the flags property
export function inflateWaypoint(world: HubsWorld, eid: number, props: WaypointParams) {
  addComponent(world, Waypoint, eid);
  let flags = 0;
  if (props.canBeSpawnPoint) flags |= WaypointFlags.canBeSpawnPoint;
  if (props.canBeOccupied) flags |= WaypointFlags.canBeOccupied;
  if (props.canBeClicked) flags |= WaypointFlags.canBeClicked;
  if (props.willDisableMotion) flags |= WaypointFlags.willDisableMotion;
  if (props.willDisableTeleporting) flags |= WaypointFlags.willDisableTeleporting;
  if (props.willMaintainInitialOrientation) flags |= WaypointFlags.willMaintainInitialOrientation;
  if (props.snapToNavMesh) flags |= WaypointFlags.snapToNavMesh;
  Waypoint.flags[eid] = flags;

  // More lines omitted
}

// Later, we can read the waypoint flags using bitwise &:
const canBeSpawnPoint = Waypoint.flags[eid] & WaypointFlags.canBeSpawnPoint;
```


<a id="org58d595d"></a>

## Tag components

`bitECS` components with no properties are called tag components. It is useful to be able to tag an entity so that it appears in queries.


<a id="orga5547d0"></a>

## The escape hatch

Sometimes, we need to store data that is just numbers and strings. Since we can&rsquo;t store the data in `bitECS` components, we store it in regular `Map` s instead.

For example, the `MediaPDF` component stores a numeric `pageNumber`, and separately has a (uninspiringly named) `map` property:

```typescript
export const MediaPDF = defineComponent({
  pageNumber: Types.ui8
});
MediaPDF.map = new Map();
```

In typescript, we specify the data types we will store in the map:

```typescript
export interface PDFResources {
  pdf: PDFDocumentProxy;
  material: MeshBasicMaterial;
  canvasContext: CanvasRenderingContext2D;
}
export const PDFResourcesMap = (MediaPDF as any).map as Map<EntityID, PDFResources>;
```

It is our responsibility to clean up anything we put into the map:

```typescript
pdfExitQuery(world).forEach(function (eid) {
  const resources = PDFResourcesMap.get(eid)!;
  resources.pdf.cleanup();
  disposeMaterial(resources.material);
  PDFResourcesMap.delete(eid);
});
```


<a id="orgf29a631"></a>

## Associating entities with `Object3D` s

We often associate an entity with an `Object3D`. We do this by adding an `Object3DTag` component to the entity, storing the association in `world.eid2obj`, and setting `obj.eid` to the `EntityID`.

An entity can only be associated with a single `Object3D`.

You may find it strange that we have a different pattern for `world.eid2obj`, and that we do not simply use the same pattern as the one shown above for `MediaPDF`. Well, I do too. We wrote `world.eid2obj` long before we wrote `MediaPDF`, so this may be an accident. Perhaps we&rsquo;ll change `world.eid2obj` to `Object3DTag.map`, since the `eid2obj` map is meant to be kept in sync with the `Object3DTag` component.


<a id="orgfe9fb09"></a>

## Avoid duplicating state

`Object3D` and its subtypes have many properties that change at runtime. Rather than storing a duplicate copy of these properties in `bitECS` components, we use tag components on the entity so that they show up in the necessary queries, and then operate on the associated `Object3D` directly.

For example, `TroikaText` extends `Mesh`, which extends `Object3D`. `TroikaText` s have a `text` string property and a function `sync` that will flush the `text` to the underlying shader program.

In Hubs, we define the `Text` component as a tag (i.e. with no properties):

```typescript
export const Text = defineComponent();
```

We do not duplicate the `text` string in a `bitECS` component. We simply operate on the underlying `Object3D` (a `TroikaText`):

```typescript
const timeLabel = world.eid2obj.get(VideoMenu.timeLabelRef[eid])! as TroikaText;
timeLabel.text = `${timeFmt(video.currentTime)} / ${timeFmt(video.duration)}`;
timeLabel.sync();
```


<a id="orgbad6d63"></a>

# Adding entities


<a id="org9d285be"></a>

## Entity basics

Entities are added to the world with `addEntity` and removed from the world with `removeEntity`. In `bitECS`, component state is stored in large, pre-allocated `TypedArrays`. In other words, entities are not objects with components inside them. Entities are simply numbers (`EntityID` s), and the `World` keeps track of things like whether an entity has a given component (`hasComponent(world, MyComponent, eid)`).

You will rarely need to call `addEntity` yourself. Instead, you will write entity definitions (`EntityDef` s) using `jsx` or create model files (`gltf`) with that add entities and components when the models are loaded.

Note: We support both `glTF` formats, where binary data buffers contain base64-encoded strings (as in `.gltf`) or raw byte arrays (as in `.glb`). We refer to `gltf` and `glb` files interchangably.


<a id="orgdd790f5"></a>

## Creating `EntityDef` s

`EntityDef` s are `jsx` expressions that can be passed to `renderAsEntity` to add entities and components to the world. `EntityDef` s are commonly returned from `template` functions, which take some `InitialData` and return an `EntityDef` with the that `InitialData` applied.

For example, the commonly used `MediaPrefab` function is a `template` that takes `MediaLoaderParams` as its `InitialData`, and returns an `EntityDef` for an interactable object.

```typescript
export function MediaPrefab(params: MediaLoaderParams): EntityDef {
  return (
    <entity
      name="Interactable Media"
      networked
      networkedTransform
      mediaLoader={params}
      deletable
      grabbable={{ cursor: true, hand: true }}
      destroyAtExtremeDistance
      floatyObject={{
        flags: FLOATY_OBJECT_FLAGS.MODIFY_GRAVITY_ON_RELEASE,
        releaseGravity: 0
      }}
      networkedFloatyObject={{
        flags: FLOATY_OBJECT_FLAGS.MODIFY_GRAVITY_ON_RELEASE
      }}
      rigidbody={{ collisionGroup: COLLISION_LAYERS.INTERACTABLES, collisionMask: COLLISION_LAYERS.HANDS }}
      physicsShape={{ halfExtents: [0.22, 0.14, 0.1] }} /* TODO Physics shapes*/
      scale={[1, 1, 1]}
    />
  );
}
```

Although `EntityDef` s are written with `jsx` syntax, this is not `React`. The `jsx` syntax allows us to describe our desired scene graph, entities, and components. The definition is static, and there should be no expectation of &ldquo;re-rendering&rdquo; (as in `React` or `three-fiber`). Semantically, an `EntityDef` is equivalent to a model file with component data. `EntityDef` s are meant to be easy to edit by hand and to version control.

For `network instantiated` entities, `template` functions are grouped together with `permission` information to form a named `Prefab`. More information about `network instantiated` entities can be found in the networking documentation.


<a id="org156c909"></a>

## Creating model files

Equivalently, hubs components can be added to nodes in a GLTF file with the `MOZ_hubs_components` extension.

The `hubs-blender-exporter` is a Blender add-on that helps artists do this.

Spoke also includes component data in the gltf files that it exports and uploads.


<a id="org2319bae"></a>

## Entity creation is synchronous

It is important to realize that `renderAsEntity` is a synchronous function. That is, it will immediately return a valid `EntityID` with a corresponding `Object3D` added to the scene graph.

The presence of some components (like `MediaLoader`) cause systems to begin asynchronous work. In the case of `MediaLoader`, this work can include downloading model or image files, loading them with the GLTF loader, and ultimately creating additional entities and components. But the entity at the root of this `Object3D` hierarchy will be created synchronously/immediately when `renderAsEntity` runs.


<a id="org628683b"></a>

## Inflation


<a id="org20a38aa"></a>

### What does `renderAsEntity` do?

In the example above, we show a `template` function (`MediaPrefab`) that takes some `InitialData` (the `MediaLoaderParams`) and returns an `EntityDef`. We then said that the `EntityDef` can be passed to `renderAsEntity` which will (synchronously) add entities and components to the world. We also said this was equivalent to loading a model file (GLTF).

Question: How does `renderAsEntity` (and whatever loads models) accomplish this? Answer: By running `inflators`.


<a id="org357d40d"></a>

### `Inflator` s

An `inflator` is a function that transforms a <span class="underline">description</span> of some components/entities into real components and real entities.

When `renderAsEntity` is given the `EntityDef` generated by the `MediaPrefab` above, it will run an `inflator` for each of the properties found in the `jsx` expression.

For example, the `jsx` expression contains the following line:

```typescript
  grabbable={{ cursor: true, hand: true }}
```

When `renderAsEntity` parses this line, it checks the `jsxInflators` map (for the key `"grabbable"` ) to find the associated inflator (`inflateGrabbable`), and calls it.

The `inflateGrabbable` function transforms the description into the necessary runtime components:

```typescript
export type GrabbableParams = { cursor: boolean; hand: boolean };
const defaults: GrabbableParams = { cursor: true, hand: true };
export function inflateGrabbable(world: HubsWorld, eid: number, props: GrabbableParams) {
  props = Object.assign({}, defaults, props);
  if (props.hand) {
    addComponent(world, HandCollisionTarget, eid);
    addComponent(world, OffersHandConstraint, eid);
  }
  if (props.cursor) {
    addComponent(world, CursorRaycastable, eid);
    addComponent(world, RemoteHoverTarget, eid);
    addComponent(world, OffersRemoteConstraint, eid);
  }
  addComponent(world, Holdable, eid);
}
```

Notice that `GrabbableParams` do not map one-to-one with runtime components. That is, there is no `Grabbable` component. This is common in situations where we want to expose user-friendly options (for use in Blender, Spoke, or when writing `EntityDef` s), while representing the information differently at runtime.


<a id="orga810c47"></a>

### Default inflators

For many components, the `EntityDef` or `GLTF` representation DOES match the runtime component, and writing individual inflators for each would be unnecessary boilerplate.

For example, the `SceneLoader` component has a single property, a string `src`:

```typescript
export const SceneLoader = defineComponent({ src: Types.ui32 });
SceneLoader.src[$isStringType] = true;
```

It can be specified in the following `EntityDef` :

```typescript
export function ScenePrefab(src: string): EntityDef {
  return <entity name="Scene" sceneRoot sceneLoader={{ src }} />;
}
```

Writing the inflator for the `SceneLoader` component is simple, except for the fact that we have to remember to convert the `string` to a `StringID`, so that the `bitECS` component can hold onto it:

```typescript
export function inflateSceneLoader(world: HubsWorld, eid: number, props: { src: string }) {
  addComponent(world, SceneLoader, eid);
  SceneLoader.src[eid] = APP.getSid(props.src); // Convert string to string id
}
```

In our `jsxInflators` map, we would associate `"sceneLoader"` with `inflateSceneLoader` :

```typescript
  sceneLoader: inflateSceneLoader,
```

This situation is so common that we have a helper function, `createDefaultInflator`, that we can use instead of writing `inflateSceneLoader` manually. We simply pass the component we want to inflate to `createDefaultInflator` and we&rsquo;re done:

```typescript
  sceneLoader: createDefaultInflator(SceneLoader),
```

The default inflator handles the conversion from `string` s to `StringID`, and will log an error if a property name is passed to the `inflator` that does not have a corresponding property in the underlying component.


<a id="org4f9fcd3"></a>

### Associating `Object3D` s (`eid2obj`)

Most of the time, we add a component definition to an `EntityDef` or model file just to cause some component data to be associated with an entity. Sometimes, we want to control the `Object3D` that will be inserted into the scene graph for this entity.

We do this by calling `addObject3DComponent` from within an `inflator`.

For example, when a `simpleWater` component is found within a node of a GLTF file, the `inflateSimpleWater` inflator will create a `SimpleWaterMesh` with the given params and associate it with the given `EntityID` :

```typescript
export function inflateSimpleWater(world: HubsWorld, eid: EntityID, params: SimpleWaterParams) {
  params = Object.assign({}, DEFAULTS, params);
  const lowQuality = APP.store.state.preferences.materialQualitySetting !== "high";
  const simpleWater = new SimpleWaterMesh({ lowQuality });
  simpleWater.opacity = params.opacity;
  simpleWater.color.set(params.color);
  simpleWater.tideHeight = params.tideHeight;
  simpleWater.tideScale.fromArray(params.tideScale);
  simpleWater.tideSpeed.fromArray(params.tideSpeed);
  simpleWater.waveHeight = params.waveHeight;
  simpleWater.waveScale.fromArray(params.waveScale);
  simpleWater.waveSpeed.fromArray(params.waveSpeed);
  simpleWater.ripplesScale = params.ripplesScale;
  simpleWater.ripplesSpeed = params.ripplesSpeed;

  addObject3DComponent(world, eid, simpleWater);
  addComponent(world, SimpleWater, eid);
}
```

Only one inflator per entity can create and assign an `Object3D`. An `EntityDef` that describes an entity that is both a `SimpleWaterMesh` and a `DirectionalLight` will fail to load:

```typescript
renderAsEntity(
  <entity
      name="Buggy Entity"
      simpleWater
      directionalLight
  />
); // throws Error("Tried to add an object3D tag to an entity that already has one");

```

By default, if no `inflator` creates an `Object3D` for the entity, then `renderAsEntity` will create and assign it a `Group`.


<a id="org7a41123"></a>

### Loading model files

The sections above explain how `renderAsEntity` transforms a `jsx` `EntityDef` into an entity and components, and claims that the process for loading a `gltf` file is equivalent.

We are now ready to understand why, and will explain by example.

The `EntityDef` returned by the `MediaPrefab` template (above) includes a `mediaLoader`, which will cause `renderAsEntity` to invoke the `inflateMediaLoader` inflator and assign a `MediaLoader` component to the entity.

Assume the `MediaPrefab` template is initialized with `src` set to the url of a `gltf` file. In other words, we are trying to use the `MediaPrefab` load a `gltf` file that we can grab and interact with.

We pass the `EntityDef` to `renderAsEntity`, an entity is returned synchronously, and execution continues as normal.

When the `mediaLoading` system runs, it notices the new `MediaLoader` component and starts an asynchronous `coroutine` that determines the media type pointed to by the `src` property, downloads the `gltf` file and loads it as Three.js scene graph via a `GLTFLoader`. Finally, the loaded scene graph is passed into an `EntityDef`&rsquo;s `model` parameter:

```typescript
export function* loadModel(world: HubsWorld, src: string, contentType: string, useCache: boolean) {
  const { scene, animations } = yield loadGLTFModel(src, contentType, useCache, null);
  scene.animations = animations;
  scene.mixer = new THREE.AnimationMixer(scene);
  return renderAsEntity(world, <entity model={{ model: scene }} />);
}
```

In other words, the asynchronous work of loading the model is done `before` an entity is created for the loaded `gltf`. Despite being called after some asynchronous work, the entity creation step that happens in `renderAsEntity` itself happens synchronously.

The `model` inflator (`inflateModel`) is to `gltf` files as `renderAsEntity` is to `EntityDef` s. You will notice that `inflateModel` invokes other component inflators and adds many entities to the world to match the `Object3D` hierarchy that was provided within the `ModelParams`.

This is what we mean when we say that loading from `gltf` files is &ldquo;equivalent&rdquo; to loading from `EntityDef` s.


<a id="org8ca2b33"></a>

### Common inflators, `jsxInflators`, and `gltfInflators`

We can now explain why there are three collections of `inflators`:

-   `commonInflators` are for components can be loaded (identically) whether they are defined in `EntityDef` s or `gltf` files.
-   `jsxInflators` are for components that are specified in `EntityDef` s.
-   `gltfInflators` are for components that are specified in `gltf` files.

Notice that in the sentences above, we overload the word `components`. As we have shown, the data in `EntityDef` s or `gltf` files are not `bitECS` components, but need to be transformed (via `inflator` s) to their runtime formats (which is usually `bitECS` components).

While it might be helpful to define a `new` word (like &ldquo;pre-components&rdquo;) to describe these data, we think this is overly complicated. From the perspective of the Blender add-on for example, its job is to add components (specifically, &ldquo;`MOZ_hubs_components`&rdquo;) to nodes in the `.blend` scene and exported `gltf` files.


<a id="orgfcfa191"></a>

### Entity `Ref` s and `__mhc_link_type` : `"node"`


<a id="org7fe068b"></a>

### Associating `Material` s (`eid2mat`)


<a id="org1a8110a"></a>

# Custom clients and addons


<a id="org2b06d43"></a>

## Addons are not ready yet (February 2023)

We are exploring ways to enable add-ons within the Hubs client. This work is not complete, so expect this section to change in the near future.

We will need to start versioning each client deliberately so that developers can test and report which clients versions their add-on are compatible with. We will need to aim for backwards-compatibility and avoid breaking addons with changes, but we should things to be bumpy as we learn how best to structure the client.

Add-ons will require us to change how we update the hubs client on Managed or Hubs Cloud instances. If an add-on is installed on the instance that is not compatible with a new client version, we cannot auto-update the client without risking breaking the installed add-on.

Wordpress and Blender are good models to follow here. In general, if an add-on is not compatible with a new client version, upgrading the instance can be a user-initiated action. However, we may be required in some cases to push updates or partial updates that fix critical security vulnerabilities.

We will need to figure out how / where these addons will be hosted, how they will be installed, and to what extent Mozilla verifies that a given add-on is safe. We suspect that in the early days, add-ons will likely be installed via the admin interface, with a warning from us saying that you must trust the add-on developer is not doing anything nefarious, and that we have not validated or audited the code. This is similar to the warning that appears when installing add-ons to Firefox.

It will be easier for us to support custom clients than to support add-ons. Users should expect better support for writing, loading, and sharing custom clients soon, including on Managed instances.

In order for addons to do meaningful work, we need to expose a number of functions and data structures (and relax their types). The sections below describe the extension points we expect add-ons and custom clients will need to access.


<a id="org35960ac"></a>

## Creating an add-on

Hubs client add-ons will work similarly to how add-ons work in Blender. An addon will be a module that exports an `info : AddonInfo`, a `load` function, and an `unload` function:

```typescript
export const info : AddonInfo = {
  name: "My Special Addon",
  // etc
}

export function load( params : LoadCallbackParams ) {
  // Do whatever initialization you need to do when your add on is loaded
}

export function unload () {
  // Do whatever cleanup you need to do when your add on is unloaded

  // TODO Is it even possible for add-ons to be unloaded at runtime like this?
  //      If they are added/removed from the admin panel for the whole hub, then maybe unload is not needed.
}
```

Where the types will look something like this:

```typescript
type AddonInfo = {
  name: string;
  author?: string;
  description?; string;
  compatibleWith?: ClientVersion[];
  version?: AddonVersion;
  location?: string;
  wikiUrl?: string;
  trackerUrl?: string;
  warning?: string;
  category?: AddonCategory;
  tags: AddonTag[];
}

interface LoadCallbackParams = {
  world: HubsWorld
  // Maybe other things?
}
```


<a id="orge79e4e1"></a>

## `preload`

If your addon needs to complete some work before the main tick game loop runs, pass a `Promise` to the `preload` function that resolves once you are ready.


<a id="org1d14013"></a>

## Inserting prefabs

`Network instantiated` entities must be registered in the `prefabs` map. See the `networking` documentation for more information.


<a id="org86ae847"></a>

## Inserting inflators

Custom components require you to register `inflator` s. Be sure to insert your `inflator` s into `commonInflators`, `jsxInflators`, or `gltfInflators` before calling `renderAsEntity` or invoking `inflateModel`.


<a id="org354b138"></a>

## Inserting system calls

The `mainTick` function calls all of the systems that need to run in a given animation frame. You will need to insert your system calls into this main game loop in the appropriate spot. We are not sure yet how we will expose this to addons. Custom client developers can insert it directly into the file that defines `mainTick`.


<a id="org306c661"></a>

## Handling interactions

Basic interactions like hovering, holding, and moving objects can be achieved with built-in components or inflators (like `inflateGrabbable`).

Custom interactions that define their own `actions`, `action sets`, and `device bindings` need to be able to append their `device bindings` and change the logic of `resolveActionSets`. We are not sure yet how we will expose these capabilities.

More information can be found in the interactions documentation.


<a id="org19b999f"></a>

## Handling networking

Add-ons and custom clients can define their own networked components. Developers will need to be especially careful when saving data to the database, as maintaining backwards compatibility with their chosen schema will be their responsibility. More information can be found in the networking documentation.

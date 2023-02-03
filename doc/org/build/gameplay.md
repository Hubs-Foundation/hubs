
# Table of Contents

1.  [Intro](#org991feb0)
2.  [Entities, components, systems.](#org949b2be)
    1.  [`bitECS`](#org52e4c14)
    2.  [Disclaimer](#org6abd7d0)
3.  [Writing systems](#org4059b4f)
    1.  [Systems are functions](#org6b83742)
    2.  [The game loop](#org5030fa5)
    3.  [Queries are useful](#orgaad10d1)
    4.  [Replacing `async` functions with `JobRunner`](#org239ab65)
4.  [Writing components](#orgb52fe0d)
    1.  [Defining components](#org8bc2f74)
    2.  [Data types](#org8414c54)
    3.  [Avoid holding references](#org5941dae)
    4.  [String data](#orgbde4b78)
    5.  [Flags](#org7538757)
    6.  [Tag components](#org28d3295)
    7.  [The escape hatch](#org68cb175)
    8.  [Associating entities with `Object3D` s](#org54bec2b)
    9.  [Avoid duplicating state](#org2ab4512)
5.  [Creating entities](#orgad19bee)
    1.  [Entities are numbers](#orgb093be1)
    2.  [Loading from prefabs](#org473a107)
        1.  [`EntityDef` s](#orgd065b36)
        2.  [JSX without React](#org44b9d51)
    3.  [Loading from glb files](#org9fa25f0)
        1.  [The Hubs Blender add-on](#org12e5028)
    4.  [Entity creation is synchronous](#orgac98852)
    5.  [Component inflators](#org70713be)
        1.  [Inflator rules](#org668d885)
        2.  [Default inflators](#org34cc0c5)
        3.  [Associating `Object3D` s (`eid2obj`)](#org4e42a5c)
        4.  [Associating `Material` s (`eid2mat`)](#orgc1810aa)
        5.  [`Ref` s and node](#org8a5936a)
        6.  [Common inflators](#org65377c5)
        7.  [`JSX`](#orga149a6f)
        8.  [`GLB`](#orgeade883)
    6.  [Entity ID&rsquo;s are recycled](#orgfddb016)
6.  [Custom clients and addons](#org95d4be1)
    1.  [Addons aren&rsquo;t ready yet (February 2023)](#org3fbd0bb)
    2.  [preload](#org6b91832)
    3.  [Inserting prefabs](#org13261de)
    4.  [Inserting inflators](#orga05a4e5)
    5.  [Inserting system calls](#org7cd9bc6)
    6.  [Handling interactions](#org3be1e68)
    7.  [Handling networking](#org52f6add)

\#+TITLE Core Concepts for Gameplay Code

Core Concepts for Gameplay Code


<a id="org991feb0"></a>

# Intro

This document gives an overview of the core concepts for writing gameplay code in the Hubs client.


<a id="org949b2be"></a>

# Entities, components, systems.

ECS became a popular topic in recent years.

-   Unity&rsquo;s `DOTS` emphasizes data-oriented design for speed and control, separates behavior from data, and helps developers build multi-threaded game loops.
-   Supermedium&rsquo;s `A-Frame` emphasizes ease of use and a low barrier to entry, exposes three.js through familiar HTML, and enables rapid prototyping with many built-in components and hundreds more from the community.

Originally built with `A-Frame`, Hubs switched to `bitECS` and using `three.js` directly. Motivation, goals, and non-goals about the transition can be found in this PR from June, 2022. <https://github.com/mozilla/hubs/pull/5536>


<a id="org52e4c14"></a>

## `bitECS`

The `bitECS` API is minimal, and its own documentation should be consulted for details. The main ideas from the Hubs gameplay code perspective are:

-   Component data are structs of arrays. <https://en.wikipedia.org/wiki/AoS_and_SoA>
-   Entities are indices into these arrays.
-   Queries filter entities by their associated components.

`bitECS` has no built-in concept of systems. We frequently refer the functions invoked during the game loop as &ldquo;systems&rdquo;, but there is no formal construct.


<a id="org6abd7d0"></a>

## Disclaimer

Much has been written about the philosophy of various ECS frameworks and design choices. Our choices should not be interpreted fanatically.

We need to store game state somehow, and conventions are useful. We use three.js, which means a lot of game state is stored in various `Object3D` subtypes. We store the rest in `bitECS` entities and components, or `map` s from entity to struct in cases where `bitECS` components won&rsquo;t do.

In other words, our game state is not &ldquo;purely&rdquo; in ECS, nor do we care to make it so. The PR linked above states the (relatively humble) goals and non-goals of our entity framework.


<a id="org4059b4f"></a>

# Writing systems


<a id="org6b83742"></a>

## Systems are functions

`bitECS` has no built-in concept of systems. We frequently refer the functions invoked during the game loop as &ldquo;systems&rdquo;, but there is no formal construct.

We provide the browser&rsquo;s `requestAnimationFrame` with our game loop function (`mainTick`), to be invoked each frame.


<a id="org5030fa5"></a>

## The game loop


<a id="orgaad10d1"></a>

## Queries are useful


<a id="org239ab65"></a>

## Replacing `async` functions with `JobRunner`


<a id="orgb52fe0d"></a>

# Writing components


<a id="org8bc2f74"></a>

## Defining components

`bitECS` components are defined with `defineComponent`.


<a id="org8414c54"></a>

## Data types

`bitECS` components only store numeric types:

-   `i8`
-   `ui8`
-   `ui8c`
-   `i16`
-   `ui16`
-   `i32`
-   `ui32`
-   `f32`
-   `f64`
-   `eid`


<a id="org5941dae"></a>

## Avoid holding references

The `eid` type indicates that the property values will be entity IDs. Be careful when storing references to entities. If the referenced entity is removed from the world with `removeEntity`, then you should consider the entity reference in the component to be invalid! You can use `entityExists` to check whether the referenced entity still exists, but in general it is best to avoid storing entity references if you can.

The most common scenario for using the `eid` type is when building multi-entity objects, such as in-world menus. The `VideoMenu` component stores references to each entity so that it can manage them all easily.

    export const VideoMenu = defineComponent({
      videoRef: Types.eid,
      timeLabelRef: Types.eid,
      trackRef: Types.eid,
      headRef: Types.eid,
      playIndicatorRef: Types.eid,
      pauseIndicatorRef: Types.eid
    });


<a id="orgbde4b78"></a>

## String data

We sometimes want to be able to store string data in components. Since `bitECS` does not allow strings in components, we store numeric string ID&rsquo;s instead.

For example, consider a `SceneLoader` component with a `src` property, which we wish was a string.

    export const SceneLoader = defineComponent({ src: Types.ui32 });
    SceneLoader.src[$isStringType] = true;

The symbol `$isStringType`, defined in `bit-components.js`, indicates that this property is a string handle. Code that handles component state anonymously (e.g. `createDefaultInflator`) use this to correctly handle the property values.

Strings are converted to numeric `StringID` s by the `getSid` function. `StringID` s can be converted back to strings by the `getString` function.

    const src = APP.getString(SceneLoader.src[loaderEid]);
    console.log(`Loading scene from this url: ${src}`);


<a id="org7538757"></a>

## Flags

`bitECS` components do not support `boolean` properties. In lieu of boolean properties, we often define a single `flags` property as an unsigned integer type to use as a bitmask:

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
    
    // These values are booleans because they originate from an external source, like json in a glb file.
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


<a id="org28d3295"></a>

## Tag components

`bitECS` components with no properties are called tag components. It is useful to be able to tag an entity so that it appears in queries.


<a id="org68cb175"></a>

## The escape hatch

Sometimes, we need to store data that is just numbers and strings. Since we can&rsquo;t store the data in `bitECS` components, we store it in regular `Map` s instead.

For example, the `MediaPDF` component stores a numeric `pageNumber`, and separately has a (uninspiringly named) `map` property:

    export const MediaPDF = defineComponent({
      pageNumber: Types.ui8
    });
    MediaPDF.map = new Map();

In typescript, we specify the data types we will store in the map:

    export interface PDFResources {
      pdf: PDFDocumentProxy;
      material: MeshBasicMaterial;
      canvasContext: CanvasRenderingContext2D;
    }
    export const PDFResourcesMap = (MediaPDF as any).map as Map<EntityID, PDFResources>;

It is our responsibility to clean up anything we put into the map:

    pdfExitQuery(world).forEach(function (eid) {
      const resources = PDFResourcesMap.get(eid)!;
      resources.pdf.cleanup();
      disposeMaterial(resources.material);
      PDFResourcesMap.delete(eid);
    });


<a id="org54bec2b"></a>

## Associating entities with `Object3D` s

We often associate an entity with an `Object3D`. We do this by adding an `Object3DTag` component to the entity, storing the association in `world.eid2obj`, and setting `obj.eid` to the `EntityID`.

An entity can only be associated with a single `Object3D`.

You may find it strange that we have a different pattern for `world.eid2obj`, and that we do not simply use the same pattern as the one shown above for `MediaPDF`. Well, I do too. We wrote `world.eid2obj` long before we wrote `MediaPDF`, so this may be an accident. Perhaps we&rsquo;ll change `world.eid2obj` to `Object3DTag.map`, since the `eid2obj` map is meant to be kept in sync with the `Object3DTag` component.


<a id="org2ab4512"></a>

## Avoid duplicating state

`Object3D` and its subtypes have many properties that change at runtime. Rather than storing a duplicate copy of these properties in `bitECS` components, we use tag components on the entity so that they show up in the necessary queries, and then operate on the associated `Object3D` directly.

For example, `TroikaText` extends `Mesh`, which extends `Object3D`. `TroikaText` s have a `text` string property and a function `sync` that will flush the `text` to the underlying shader program.

In Hubs, we define the `Text` component as a tag (i.e. with no properties):

    export const Text = defineComponent();

We do not duplicate the `text` string in a `bitECS` component. We simply operate on the underlying `Object3D` (a `TroikaText`):

    const timeLabel = world.eid2obj.get(VideoMenu.timeLabelRef[eid])! as TroikaText;
    timeLabel.text = `${timeFmt(video.currentTime)} / ${timeFmt(video.duration)}`;
    timeLabel.sync();


<a id="orgad19bee"></a>

# Creating entities


<a id="orgb093be1"></a>

## Entities are numbers


<a id="org473a107"></a>

## Loading from prefabs


<a id="orgd065b36"></a>

### `EntityDef` s


<a id="org44b9d51"></a>

### JSX without React


<a id="org9fa25f0"></a>

## Loading from glb files


<a id="org12e5028"></a>

### The Hubs Blender add-on


<a id="orgac98852"></a>

## Entity creation is synchronous


<a id="org70713be"></a>

## Component inflators


<a id="org668d885"></a>

### Inflator rules


<a id="org34cc0c5"></a>

### Default inflators


<a id="org4e42a5c"></a>

### Associating `Object3D` s (`eid2obj`)


<a id="orgc1810aa"></a>

### Associating `Material` s (`eid2mat`)


<a id="org8a5936a"></a>

### `Ref` s and node


<a id="org65377c5"></a>

### Common inflators


<a id="orga149a6f"></a>

### `JSX`


<a id="orgeade883"></a>

### `GLB`


<a id="orgfddb016"></a>

## Entity ID&rsquo;s are recycled


<a id="org95d4be1"></a>

# Custom clients and addons


<a id="org3fbd0bb"></a>

## Addons aren&rsquo;t ready yet (February 2023)


<a id="org6b91832"></a>

## preload


<a id="org13261de"></a>

## Inserting prefabs


<a id="orga05a4e5"></a>

## Inserting inflators


<a id="org7cd9bc6"></a>

## Inserting system calls


<a id="org3be1e68"></a>

## Handling interactions


<a id="org52f6add"></a>

## Handling networking



# Table of Contents

1.  [Intro](#orgb119da2)
2.  [The `Networked` Component](#org2bbd35c)
3.  [Message Types](#orgad43d30)
    1.  [`CreateMessage`](#orgdae0b06)
    2.  [`UpdateMessage`](#orgbd864df)
    3.  [`DeleteMessage`](#org1c7f55f)
    4.  [`ClientJoin`](#orge92e4e5)
    5.  [`ClientLeave`](#org2695677)
    6.  [`CreatorChange`](#orgc99342a)
4.  [Eventual Consistency](#orgc85401e)
5.  [Creating Networked Entities](#orgcc2964d)
6.  [Writing Networked Components](#org7110b85)
7.  [Persisting Networked Entity State](#org22fd151)
8.  [Networked Entity Hierarchies](#org7edeaa3)


<a id="orgb119da2"></a>

# Intro

This document describes the way that entity state is networked across clients and optionally persisted to the database.

Entity state includes things like what objects should be created by each client in a room, where those objects are, and various properties about them. `WebRTC` (voice, video, screenshare) connections are out of scope for this document: Those are handled separately by `dialog` and the `DialogAdapter`.

Each client is connected to a reticulum node via a phoenix channel. The relevant channel for entity state networking is the `HubChannel`. Each client sends and receives `"nn"` messages containing entity state information over the `HubChannel`.

Clients send messages at fixed intervals in the `networkSendSystem`. Messages are sent at fixed intervals (rather than anytime entity state is updated) so that frequently updated components (like `NetworkedTransform`) do not cause a client to flood the network with an unnecessary amount of `UpdateMessage` s.

Clients receive messages outside of frame boundaries, and simply queue them for processing. Clients process queued messages each frame in the `networkReceiveSystem`.


<a id="org2bbd35c"></a>

# The `Networked` Component

Networked entities are any entities with the `Networked` component. The `Networked` component contains:

-   A (networked) `id`, which clients use to uniquely identify this entity across the network. This cannot simply be the `eid` of an entity, because `eid` s are assigned locally to each client.
-   A `creator`, which is used at various times to determine whether or not an entity should be created or removed.
-   An `owner`, which is used to determine which `client` has authority to update the state of this entity.
-   A `lastOwnerTime`, which is used to determine the most recent time that an `owner` was assigned.
-   A `timestamp`, which is the most recent time the networked state of this entity has been updated.

The `creator` can be set to a `ClientId`, `"reticulum"` , or a `NetworkID` .

-   When the `creator` is a `ClientID`, it means that a client in the room has caused this &ldquo;root&rdquo; entity (and its descendants) to be created, and the entity (and its descendants) should be removed when the client leaves the room.
-   When the `creator` is `"reticulum"` , it means that the Reticulum is responsible for deciding whether this &ldquo;root&rdquo; entity should be created or removed.
-   When the `creator` is a `NetworkID`, it means that the entity is a descendant of a &ldquo;root&rdquo; entity, and its creation/removal will be subject to its ancestor.

Conceptually, the `creator` and the `owner` act as authorities over two facets of a networked entity.

-   The `creator` is the authority over the entity&rsquo;s existence. Thus, it is checked when processing `CreateMessage` s and before an entity may be removed. For an entity to be created, its `creator` must have the appropriate permission. An entity&rsquo;s `creator` changes infrequently. It only happens when a client `pins` (or `unpins`) an entity, which changes the `creator` to (or from) `"reticulum"`.
-   The `owner` is the authority over the entity&rsquo;s current state. Thus, it is associated with `UpdateMessage` s. The `owner` is expected to change regularly, whenever a new client performs an action on an entity. The `takeOwnership` and `takeSoftOwnership` functions allow a client to establish itself as the `owner` of an entity.


<a id="orgad43d30"></a>

# Message Types

Clients send and receive these types of messages:

-   `CreateMessage`
-   `UpdateMessage`
-   `DeleteMessage`
-   `ClientJoin`
-   `ClientLeave`
-   `CreatorChange`

Event handlers that queue messages for later processing can be found in `listenForNetworkMessages`.

Note that this is a slight simplification. The message types are not represented in these exact terms throughout the client. For example, clients may combine `CreateMessage` s, `UpdateMessage` s, and `DeleteMessage` s into a single outgoing message, which receiving clients then separate and parse. There are also two variants of `UpdateMessage`, which will be explained below.


<a id="orgdae0b06"></a>

## `CreateMessage`

These tell a client to create an entity. Each `CreateMessage` contains:

-   A `networkId`, which clients will use to uniquely identify this entity.
-   A `prefabName`, to know which prefab to initialize,
-   An `initialData` struct, to know how to initialize the prefab,

Reticulum inserts a `fromClientId` into `"nn"` messages, so that clients who receive a `CreateMessage` can check whether the sending client has permission to create the entity. These `fromClientId` s are guaranteed to be sent by reticulum in a way that clients are unable to spoof.

Entities that are created by calling `createNetworkedEntity` or receiving a `CreateMessage` are said to be `network instantiated`. `Network instantiated` entities may have many descendants. We do not say that the descendants are `network instantiated`.


<a id="orgbd864df"></a>

## `UpdateMessage`

These tell a client to update an entity. Each `UpdateMessage` contains:

-   A `networkId`, which clients use to uniquely identify which entity the message refers to,
-   A `lastOwnerTime`, which tells clients when the sender of this message most recently witnessed ownership being transferred.
-   A `timestamp`, which indicates when a message was sent.
-   An `owner`, which indicates which `client` should have authority over updating this entity&rsquo;s state.

Update messages also have the `data` needed to update an entity&rsquo;s state. An entity&rsquo;s state is simply the component data associated with this entity. Updates can be partial (updating only some components) or full (updating all components). Update messages also have two variants, depending on whether they are can be saved for long term storage in the database. This topic will be covered in another section.


<a id="org1c7f55f"></a>

## `DeleteMessage`

These tell a client to `delete` an entity. Each `DeleteMessage` contains simply the `NetworkID` of the entity to be deleted. We distinguish between entities that have been `deleted` and those that are simply `removed`:

-   A `deleted` entity was explicitly deleted by a client. That is, someone pressed a button or took some action to delete it on purpose. Entities that have been `deleted` cannot be recreated.
-   A `removed` entity was removed incidentally. For example, it may have been removed when the `creator` disconnected from the room. If the `creator` reconnects and sends a `CreateMessage` with a matching `networkId`, it is acceptable to recreate the entity.


<a id="orge92e4e5"></a>

## `ClientJoin`

These tell a client that a new client has connected. The next time the `networkSendSystem` runs, the receiving client will send the new client messages about entities it is the `creator` of, and update messages for entities it is the `owner` of.


<a id="org2695677"></a>

## `ClientLeave`

These tell a client that another client has disconnected. The next time the `networkReceiveSystem` runs, the receiving client will `remove` entities that the disconnected client was the `creator` of.


<a id="orgc99342a"></a>

## `CreatorChange`

These tell a client that the `creator` of an entity has been reassigned. Typically, this means that an entity has been `pinned` (or `unpinned`), and reticulum has assigned (or unassigned) itself as the entity&rsquo;s `creator`.


<a id="orgc85401e"></a>

# Eventual Consistency

Reticulum does not enforce a single, consistent networked entity state. In fact, reticulum knows very little about the messages it is passing between clients. Furthermore, messages are not guaranteed to be received in the same order by all clients. Therefore, it is each client&rsquo;s responsibility to handle messages in such a way that all clients will eventually recreate identical entity state. This general concept is called eventual consistency.

Most of the complexity in the `networkSendSystem` and the `networkReceiveSystem` stem from this property of the network. Here are some examples where this complexity reveals itself:

-   The `lastOwnerTime` is used to ensure that ownership transfer is handled identically by all clients, even when messages arrive out of order.
-   The `deletedNids` collection ensures that out-of-order `CreateMessage` s do not cause `deleted` entities to be accidentally recreated.
-   The `storedUpdates` allows a client to save `UpdateMessage` s it has received but has no way to process, as can happen when it receives an `UpdateMessage` from the `owner` of an entity before it receives a `CreateMessage` from its `creator`.
-   The `takeSoftOwnership` function allows clients to take ownership of unowned entities in such a way that only clients with the most recent information about that entity will be eligible as the new owner.

For the most part, users of the networking systems do not need to understand these concepts. These are handled internally by the systems themselves. However, users do need to understand that ownership is not transactional or guaranteed. That is, ownership is not &ldquo;requested and then transferred&rdquo;, and just because one client claims ownership of an entity does not mean that other clients will respect that claim.

Users can inspect the state the `Networked` or `Owned` components as needed in cases when their ownership claims matter. They may find themselves writing coroutines that looks like this:

    takeSoftOwnership(world, eid);
    yield sleep( 3000 ); // Wait a few seconds to see if we "win" ownership
    if (!hasComponent(world, Owned, eid)) return;

If this becomes a common and error-prone pattern, then we may introduce helper functions or additional semantics to cover these cases.


<a id="orgcc2964d"></a>

# Creating Networked Entities

Client code creates networked entities by calling `createNetworkedEntity`, passing:

-   A `prefabName`, to indicate which prefab to initialize,
-   An `initialData` struct, to know how to initialize the prefab.

Prefabs must be registered in `prefabs` , a map from `PrefabName` to `PrefabDefinition`.

`PrefabDefinition` s include `template` functions that take `InitialData` and return `EntityDef` s. `EntityDef` s are defined in `jsx`, using the `createElementEntity` transformer (not `React` &rsquo;s `createEntity` transformer).

For example, the commonly used `"media"` prefab&rsquo;s `template` is:

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

When supplied with `MediaLoaderParams` as its `InitialData`, this prefab `template` creates an entity with several components, including a `Networked` and `NetworkedTransform` component.

Calling `createNetworkedEntity(world, "media", mediaLoaderParams)` would cause the `networkSendSystem` to send a `CreateMessage` the next time it sends messages.


<a id="org7110b85"></a>

# Writing Networked Components

Networked components are `Component` s that have been associated with a `NetworkSchema` in the `schemas` map.

A `NetworkSchema` indicates how to pack networked component data into `UpdateMessage` s, and has the following properties:

-   A `componentName` that uniquely identifies the component.
-   A `serialize` (and `deserialize`) function that defines how component data is packed into (and unpacked from) `UpdateMessage` s.
-   An optional `serializeForStorage` (and `deserializeForStorage`) function that defines how component data is packed into (and unpacked from) `StorableUpdateMessages` s, able to be saved (and loaded) from the database.

The `serialize` and `deserialize` functions can be generated by calling `defineNetworkSchema`.

The `serializeForStorage` and `deserializeForStorage` functions need careful authoring to allow for reading component state that has been saved to the database in a backwards-compatible way. More information about this will be written later.

Note that `NetworkSchema` s are likely to change in the near future, as we are looking for ways to simplify the complexity that `serializeForStorage` and `deserializeForStorage` introduce.


<a id="org22fd151"></a>

# Persisting Networked Entity State

By default, `network instantiated` entities are removed when its `creator` (a client) disconnects. In order to persist these entities (and its descendants) the entity must be `pinned`. Only `network instantiated` entities can be `pinned`.

To `pin` an `network instantiated` entity, a client calls `createEntityState` . This will save the current state of the entity (and its descendants) to the database. We say that the entity (and its descendants) are `persistent`.

To update the state of a persistent entity, a client calls `updateEntityState`.

To delete the saved entity state of a persistent entity, a client calls `deleteEntityState`. Note that deleting the saved entity state is not the same as deleting the entity. It simply means that the information saved to the database about this entity will be deleted.

When the client connects to a hub channel, it calls `listEntityStates` in order to receive the entity states that have been saved to the database.

Saved entity states include `CreateMessage` s for the `network instantiated` entity and `UpdateMessage` s for itself and its descendants. These messages are queued and later processed by the `networkReceiveSystem` like any other messages. The client&rsquo;s eventually consistent properties guarantee that if entity state updates that come from the database are out-of-date, they will be appropriately handled (i.e. ignored).


<a id="org7edeaa3"></a>

# Networked Entity Hierarchies

When `createNetworkedEntity` is called, a `network instantiated` entity is created synchronously. That is, any asynchronous loading that an entity needs to do to be &ldquo;fully realized&rdquo; will happen later.

For example, consider a call to `createNetworkedEntity(world, "media", params)` . The media prefab&rsquo;s template function (shown in a previous section) will cause an entity with a `MediaLoader` to be created.

If `params.src` point at a URL where a GLB model file is hosted, then the model will be downloaded, loaded by the THREE GLTFLoader, its nested components will be inflated by inflators, and finally those `object3D` s will be added to the scene graph.

Between the time that the `network instantiated` entity is created (e.g. upon receiving a `CreateMessage`) and the time that the descendant entities are created (with associated `object3D` s), clients may receive `UpdateMessage` s about descendant entities it does not recognize.

Clients store these `UpdateMessage` s until they can be applied.

A critical property of the networked system that enables this to work is that descendants of `networked instantiated` entities are assigned network IDs deterministically, even in cases where some parts of a descendant hierarchy fails to load. This ensures that the descendants can load in any order (or even fail to load) without causing a client to delete, overwrite, or ignore descendant updates.


# Creating New Networked Interactables

We often get asked how you can create new interactable objects in Hubs. This guide is a tutorial on how to do that. I'm going to be working on a new iframe object that you can spawn in the world, move around, and change the web page. For the sake of this tutorial I'll be focusing on the basics that you need to create your own interactable.

## Step 1: Add a New Button to the Place Menu

You need to be able to spawn the object in Hubs, so we'll need to add a button to the UI that spawns the object in front of you.

To add a button, we'll add the following item to the `nextItems` array in [PlacePopoverContainer.js](/src/react-components/room/PlacePopoverContainer.js):
```js
{
  id: "iframe",
  icon: BrowserIcon,
  color: "orange",
  label: <FormattedMessage id="place-popover.item-type.iframe" defaultMessage="Web Page" />,
  onSelect: () => scene.emit("spawn-iframe")
}
```

When we click the button, a `spawn-iframe` event will be emitted on the scene. We can listen for this event in systems/components. 

The end result should look something like this:
```js
export function PlacePopoverContainer({ scene, mediaSearchStore, showNonHistoriedDialog, hubChannel }) {
  const [items, setItems] = useState([]);

  useEffect(
    () => {
      function updateItems() {
        // ...

        let nextItems = [
          // ...
        ];

        if (hubChannel.can("spawn_and_move_media")) {
          nextItems = [
            ...nextItems,
            // ...
            {
              id: "iframe",
              icon: BrowserIcon,
              color: "orange",
              label: <FormattedMessage id="place-popover.item-type.iframe" defaultMessage="Web Page" />,
              onSelect: () => scene.emit("spawn-iframe")
            },
            // ...
          ];
        }

        setItems(nextItems);
      }

      hubChannel.addEventListener("permissions_updated", updateItems);

      updateItems();

      // ...

      return () => {
        hubChannel.removeEventListener("permissions_updated", updateItems);
        // ...
      };
    },
    [hubChannel, mediaSearchStore, showNonHistoriedDialog, scene]
  );

  return <PlacePopoverButton items={items} />;
}
```

Note that we only add the button ony if the user can spawn and move media.

## Step 2: Create and register a system to handle the spawn event

We need to handle the `spawn-iframe` event that we just emitted on the scene. Our recommended way of doing so is to create a Hubs System. This is just a javascript class that is registered in [hubs-systems.js](/src/systems/hubs-systems.js). They contain a `tick()` method which is called in the `hubs-systems` AFrame system in the order you determine. This makes it so that we get a predictable execution order vs AFrame systems which are somewhat hard to predict.

We'll start with creating a new file `iframe-system.js` in `/src/systems/`. We'll create a basic class that just registers an event listener in the constructor and creates a simple red cube entity in the center of the scene.

[iframe-system.js](/src/systems/iframe-system.js)
```js
export class IframeSystem {
  constructor(scene) {
    this.scene = scene;

    this.scene.addEventListener("spawn-iframe", this.onSpawnIframe);
  }

  onSpawnIframe = () => {
    const entity = document.createElement("a-entity");
    entity.setAttribute("position", "0 1 0");
    entity.setAttribute("geometry", { primitive: "box", width: 1, height: 1, depth: 1 });
    entity.setAttribute("material", { color: "red" });
    this.scene.appendChild(entity);
  }
}
```

We'll then register it in [hubs-systems.js](/src/systems/hubs-systems.js).
```js
//...
import { IframeSystem } from "./iframe-system";

AFRAME.registerSystem("hubs-systems", {
  init() {
    // ...
    this.iframeSystem = new IframeSystem(this.el);
  }
  //...
});
```

At this point you should be able to click the "Web Page" button and it should spawn a cube in the center of the scene.

## Step 3: Spawn in front of the player

To get the cube to spawn in front of the player we can use the `offset-relative-to` component.

[iframe-system.js](/src/systems/iframe-system.js)
```diff
export class IframeSystem {
  constructor(scene) {
    this.scene = scene;

    this.scene.addEventListener("spawn-iframe", this.onSpawnIframe);
  }

  onSpawnIframe = () => {
    const entity = document.createElement("a-entity");
-    entity.setAttribute("position", "0 1 0");
+    entity.setAttribute("offset-relative-to", { target: "#avatar-pov-node", offset: { x: 0, y: 0, z: -1.5 } });
    entity.setAttribute("geometry", { primitive: "box", width: 1, height: 1, depth: 1 });
    entity.setAttribute("material", { color: "red" });
    this.scene.appendChild(entity);
  }
}
```

## Step 4: Make the cube interactable

The `interactable` css class and `is-remote-hover-target` component are necessary to make the object interactable with your cursor. And the `isHandCollisionTarget` and `

[iframe-system.js](/src/systems/iframe-system.js)
```diff
+import { TYPE } from "three-ammo/constants";
+
export class IframeSystem {
  constructor(scene) {
    this.scene = scene;

    this.scene.addEventListener("spawn-iframe", this.onSpawnIframe);
  }

  onSpawnIframe = () => {
    const entity = document.createElement("a-entity");
    entity.setAttribute("offset-relative-to", { target: "#avatar-pov-node", offset: { x: 0, y: 0, z: -1.5 } });
    entity.setAttribute("geometry", { primitive: "box", width: 1, height: 1, depth: 1 });
    entity.setAttribute("material", { color: "red" });
+    entity.setAttribute("class", "interactable"); // This makes the object targetable by the cursor-targetting-system
+    entity.setAttribute("is-remote-hover-target", ""); // This makes the object hoverable in the interaction system
+    entity.setAttribute("tags", { isHandCollisionTarget: true }); // This makes the object hoverable by your hands in VR
+    entity.setAttribute("body-helper", { type: TYPE.KINEMATIC }); // This registers a kinematic body with the physics system so you we can detect collisions with your hands
    this.scene.appendChild(entity);
  }
}
```

After you add these attributes we should be able to hover over the cube and our cursor should change. At this point, the `interaction` system will have the held object state set for the cursor (`scene.systems.interaction.state.rightRemote.hovered`) or other interactor (left hand, right hand, left cursor), but you can't grab or move it yet.

## Step 5: Display the hover effect

For this object we want to display the default hover effect (the blue sweeping effect). Internally it uses that `hovered` state to check to see if it his being hovered. You can use this state yourself to implement other hover behaviors.

[iframe-system.js](/src/systems/iframe-system.js)
```diff
export class IframeSystem {
  constructor(scene) {
    this.scene = scene;

    this.scene.addEventListener("spawn-iframe", this.onSpawnIframe);
  }

  onSpawnIframe = () => {
    const entity = document.createElement("a-entity");
    entity.setAttribute("offset-relative-to", { target: "#avatar-pov-node", offset: { x: 0, y: 0, z: -1.5 } });
    entity.setAttribute("geometry", { primitive: "box", width: 1, height: 1, depth: 1 });
    entity.setAttribute("material", { color: "red" });
    entity.setAttribute("class", "interactable"); // This makes the object targetable by the cursor-targetting-system
    entity.setAttribute("is-remote-hover-target", ""); // This makes the object hoverable in the interaction system
    entity.setAttribute("tags", { isHandCollisionTarget: true }); // This makes the object hoverable by your hands in VR
    entity.setAttribute("body-helper", { type: "kinematic" }); // This registers a kinematic body with the physics system so you we can detect collisions with your hands
+    entity.setAttribute("hoverable-visuals", ""); // This adds the hoverable effect to the object
    this.scene.appendChild(entity);
  }
}
```

## Step 6: Make the object grabbable
Now that we can hover on on object, we want to be able to grab and move it around. This is accomplished by adding some tags that register the object with the physics and interaction systems and a number of other supporting components.

[iframe-system.js](/src/systems/iframe-system.js)
```diff
-import { TYPE } from "three-ammo/constants";
+import { COLLISION_LAYERS } from "../constants";
+import { SHAPE, TYPE } from "three-ammo/constants";
+
export class IframeSystem {
  constructor(scene) {
    this.scene = scene;

    this.scene.addEventListener("spawn-iframe", this.onSpawnIframe);
  }

  onSpawnIframe = () => {
    const entity = document.createElement("a-entity");
    entity.setAttribute("offset-relative-to", { target: "#avatar-pov-node", offset: { x: 0, y: 0, z: -1.5 } });
    entity.setAttribute("geometry", { primitive: "box", width: 1, height: 1, depth: 1 });
    entity.setAttribute("material", { color: "red" });
    entity.setAttribute("class", "interactable"); // This makes the object targetable by the cursor-targetting-system
    entity.setAttribute("is-remote-hover-target", ""); // This makes the object hoverable in the interaction system
-    entity.setAttribute("tags", { isHandCollisionTarget: true }); // This makes the object hoverable by your hands in VR
-    entity.setAttribute("body-helper", { type: "kinematic" }); // This registers a kinematic body with the physics system so you we can detect collisions with your hands
+    entity.setAttribute("tags", {
+      // This makes the object hoverable by your hands in VR
+      isHandCollisionTarget: true,
+      // The interaction system will set it's held state to this object
+      isHoldable: true, 
+      // The physics system will create a constraint between your cursor and the object when grabbed allowing you to move it
+      offersRemoteConstraint: true
+      // The physics system will create a constraint between your hand and the object when grabbed allowing you to move it
+      offersHandConstraint: true
+    });
+    entity.setAttribute("body-helper", {
+      type: TYPE.DYNAMIC, // Now that the body can be grabbed, let's make it respond to gravity
+      mass: 1, // We'll give it a mass of 1kg
+      collisionFilterGroup: COLLISION_LAYERS.INTERACTABLES, 
+      collisionFilterMask: COLLISION_LAYERS.DEFAULT_INTERACTABLE
+    });
+    entity.setAttribute("shape-helper", { type: SHAPE.BOX }); // Create a physics shape that is automatically sized to the bounding box
+    entity.setAttribute("set-unowned-body-kinematic", ""); // When the object has no owner (hasn't been grabbed yet, etc.) use a kinematic body
+    entity.setAttribute("floaty-object", { // Manages the gravity of an object so that it doesn't fall straight to the floor
+      modifyGravityOnRelease: true,
+      autoLockOnLoad: true,
+      gravitySpeedLimit: 0,
+      reduceAngularFloat: true
+    });
    entity.setAttribute("hoverable-visuals", ""); // This adds the hoverable effect to the object
    this.scene.appendChild(entity);
  }
}
```

You should now be able to move the cube around with your cursor. It should float around in 3D space and eventually slow to a stop.

## Step 7: Network the object

So far all this object is only visible locally. If we want to spawn in the other user's scenes we need to add some networking logic.

First we need to add a network template to [hub.html](/src/hub.html). This template is used by networked aframe to instantiate an entity remotely. We can also use this templat to create the entity locally. Let's move all of the logic we've added so far to a template.

And we'll also add a few new components:

- `set-yxz-order`: This sets the rotation order to `yxz` which solves some networked rotation issues.
- `destroy-at-extreme-distances`: This destroys the networked object if it goes too far away from the origin
- `matrix-auto-update`: This undoes our matrix optimizations for this object and make it so that it updates every frame

It is also important that your template id match one of the [existing template categories set in Reticulum](https://github.com/mozilla/reticulum/blob/master/lib/ret_web/channels/hub_channel.ex#L695). In this case we set our template id to `interactable-iframe-media`, the `-media` suffix allows our object to be passed through reticulum and allowed for any user that has the `spawn_and_move_media` permission.

[hub.html](/src/hub.html)
```diff
<!DOCTYPE html>
<html>

<head>
<!-- ...  -->
</head>

<body>
    <!-- ...  -->

    <a-scene>
        <a-assets>
          <!-- ...  -->

+          <template id="interactable-iframe-media">
+            <a-entity
+                geometry="primitive: box; width: 1; height: 1; depth: 1"
+                material="color: red"
+                class="interactable"
+                is-remote-hover-target
+                hoverable-visuals
+                tags="isHandCollisionTarget: true; isHoldable: true; offersRemoteConstraint: true; offersHandConstraint: true;"
+                body-helper="type: dynamic; mass: 1; collisionFilterGroup: 1; collisionFilterMask: 31;"
+                shape-helper="type: box"
+                set-unowned-body-kinematic
+                floaty-object="modifyGravityOnRelease: true; autoLockOnLoad: true; gravitySpeedLimit: 0; reduceAngularFloat: true;"
+                set-yxz-order
+                destroy-at-extreme-distances
+                matrix-auto-update
+            ></a-entity>
+          </template>

        <!-- ...  -->
      </a-assets>
      <!-- ...  -->
    </a-scene>

    <!-- ...  -->
</body>

</html>
```

With the template in place our system can be simplified to:

[iframe-system.js](/src/systems/iframe-system.js)
```js
export class IframeSystem {
  constructor(scene) {
    this.scene = scene;

    this.scene.addEventListener("spawn-iframe", this.onSpawnIframe);
  }

  onSpawnIframe = () => {
    const entity = document.createElement("a-entity");
    this.scene.appendChild(entity);
    entity.setAttribute("offset-relative-to", { target: "#avatar-pov-node", offset: { x: 0, y: 0, z: -1.5 } });
    entity.setAttribute("networked", { template: "#interactable-iframe-media" });
  };
}
```

We set the local position with the `offset-relative-to` component and `networked` handles attaching the components from the template to the entity both locally and remotely. The `offset-relative-to` component will not be attached locally because it is not in the template.

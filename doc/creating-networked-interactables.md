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
    entity.setAttribute("geometry", "primitive: box; width: 1; height: 1; depth: 1");
    entity.setAttribute("material", "color: red");
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
    entity.setAttribute("geometry", "primitive: box; width: 1; height: 1; depth: 1");
    entity.setAttribute("material", "color: red");
    this.scene.appendChild(entity);
  }
}
```

## Step 4: Make the cube interactable

The `interactable` css class and `is-remote-hover-target` component are necessary to make the object interactable.

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
    entity.setAttribute("geometry", "primitive: box; width: 1; height: 1; depth: 1");
    entity.setAttribute("material", "color: red");
+    entity.setAttribute("class", "interactable"); // This makes the object targetable by the cursor-targetting-system
+    entity.setAttribute("is-remote-hover-target", ""); // This makes the object hoverable in the interaction system
    this.scene.appendChild(entity);
  }
}
```

After you add these two attributes we should be able to hover over the cube and our cursor should change. At this point, the `interaction` system will have the held object state set for the cursor (`scene.systems.interaction.state.rightRemote.hovered`). You can't grab or move it yet, interactables don't have to be grabbable.

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
    entity.setAttribute("geometry", "primitive: box; width: 1; height: 1; depth: 1");
    entity.setAttribute("material", "color: red");
    entity.setAttribute("class", "interactable"); // This makes the object targetable by the cursor-targetting-system
    entity.setAttribute("is-remote-hover-target", ""); // This makes the object hoverable in the interaction system
+    entity.setAttribute("hoverable-visuals", ""); // This adds the hoverable effect to the object
    this.scene.appendChild(entity);
  }
}
```

## Step 6: Make the object grabbable



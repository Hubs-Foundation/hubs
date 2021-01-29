# Creating New Networked Interactables

We often get asked how you can create new interactable objects in Hubs. This guide is a tutorial on how to do that.

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

## Step 2: Spawn an entity in front of the player


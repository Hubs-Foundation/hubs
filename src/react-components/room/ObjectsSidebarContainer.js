import React, { useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { NoObjects, ObjectsSidebar, ObjectsSidebarItem } from "./ObjectsSidebar";
import { List } from "../layout/List";
import { useObjectList } from "./useObjectList";

export function ObjectsSidebarContainer({ onClose, hubChannel }) {
  const listRef = useRef();
  const { objects, selectedObject, selectObject, unfocusObject, focusObject } = useObjectList();

  const onUnfocusListItem = useCallback(
    e => {
      if (e.relatedTarget === listRef.current || !listRef.current.contains(e.relatedTarget)) {
        unfocusObject();
      }
    },
    [unfocusObject, listRef]
  );

  return (
    <ObjectsSidebar objectCount={objects.length} onClose={onClose}>
      {objects.length > 0 ? (
        <List ref={listRef}>
          {objects.map(object => (
            <ObjectsSidebarItem
              selected={selectedObject === object}
              object={object}
              key={object.id}
              onClick={() => selectObject(object)}
              onMouseOver={() => focusObject(object)}
              onFocus={() => focusObject(object)}
              onMouseOut={onUnfocusListItem}
              onBlur={onUnfocusListItem}
            />
          ))}
        </List>
      ) : (
        <NoObjects canAddObjects={hubChannel.can("spawn_and_move_media")} />
      )}
    </ObjectsSidebar>
  );
}

ObjectsSidebarContainer.propTypes = {
  hubChannel: PropTypes.object.isRequired,
  onClose: PropTypes.func
};

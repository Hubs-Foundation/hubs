import React from "react";
import PropTypes from "prop-types";
import { ObjectsSidebar, ObjectsSidebarItem } from "./ObjectsSidebar";
import { useObjectList } from "./useObjectList";

export function ObjectsSidebarContainer({ onClose }) {
  const { selectObject, unfocusObject, focusObject, objects } = useObjectList();

  return (
    <ObjectsSidebar objectCount={objects.length} onClose={onClose}>
      {objects.map(object => (
        <ObjectsSidebarItem
          object={object}
          key={object.id}
          onClick={() => selectObject(object)}
          onMouseOut={unfocusObject}
          onMouseOver={() => focusObject(object)}
          onFocus={() => focusObject(object)}
          onBlur={unfocusObject}
        />
      ))}
    </ObjectsSidebar>
  );
}

ObjectsSidebarContainer.propTypes = {
  onClose: PropTypes.func
};

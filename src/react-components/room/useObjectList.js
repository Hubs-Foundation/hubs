import React, { useState, useEffect, useContext, createContext, useCallback, Children, cloneElement } from "react";
import PropTypes from "prop-types";
import { mediaSort, getMediaType } from "../../utils/media-sorting.js";

function getDisplayString(el) {
  // Having a listed-media component does not guarantee the existence of a media-loader component,
  // so don't crash if there isn't one.
  const url = (el.components["media-loader"] && el.components["media-loader"].data.src) || "";
  const split = url.split("/");
  const resourceName = split[split.length - 1].split("?")[0];
  let httpIndex = -1;
  for (let i = 0; i < split.length; i++) {
    if (split[i].indexOf("http") !== -1) {
      httpIndex = i;
    }
  }

  let host = "";
  let lessHost = "";
  if (httpIndex !== -1 && split.length > httpIndex + 3) {
    host = split[httpIndex + 2];
    const hostSplit = host.split(".");
    if (hostSplit.length > 1) {
      lessHost = `${hostSplit[hostSplit.length - 2]}.${hostSplit[hostSplit.length - 1]}`;
    }
  }

  const firstPart =
    url.indexOf("poly.google") !== -1
      ? "Google Poly"
      : url.indexOf("sketchfab.com") !== -1
        ? "Sketchfab"
        : url.indexOf("youtube.com") !== -1
          ? "YouTube"
          : lessHost;

  return `${firstPart} ... ${resourceName.substr(0, 4)}`;
}

const ObjectListContext = createContext({
  objects: [],
  focusedObject: null,
  selectedObject: null,
  focusObject: () => {},
  unfocusObject: () => {},
  inspectObject: () => {},
  uninspectObject: () => {}
});

export function ObjectListProvider({ scene, children }) {
  const [objects, setObjects] = useState([]);
  const [focusedObject, setFocusedObject] = useState(null); // The object currently shown in the viewport
  const [selectedObject, setSelectedObject] = useState(null); // The object currently selected in the object list

  useEffect(
    () => {
      function updateMediaEntities() {
        const objects = scene.systems["listed-media"].els.sort(mediaSort).map(el => ({
          id: el.object3D.id,
          name: getDisplayString(el),
          type: getMediaType(el),
          el,
          enableLights: false
        }));

        setObjects(objects);
      }

      let timeout;

      function onListedMediaChanged() {
        // HACK: The listed-media component exists before the media-loader component does, in cases where an entity is created from a network template because of an incoming message, so don't updateMediaEntities right away.
        // Sorry in advance for the day this comment is out of date.
        timeout = setTimeout(() => updateMediaEntities(), 0);
      }

      scene.addEventListener("listed_media_changed", onListedMediaChanged);

      updateMediaEntities();

      return () => {
        scene.removeEventListener("listed_media_changed", updateMediaEntities);
        clearTimeout(timeout);
      };
    },
    [scene, setObjects]
  );

  useEffect(
    () => {
      function onInspectTargetChanged() {
        const cameraSystem = scene.systems["hubs-systems"].cameraSystem;

        const inspectedEl = cameraSystem.inspectable && cameraSystem.inspectable.el;

        if (inspectedEl) {
          setSelectedObject({
            id: inspectedEl.object3D.id,
            name: getDisplayString(inspectedEl),
            type: getMediaType(inspectedEl),
            el: inspectedEl,
            enableLights: true
          });
        } else {
          setSelectedObject(null);
        }
      }

      scene.addEventListener("inspect-target-changed", onInspectTargetChanged);

      return () => {
        scene.removeEventListener("inspect-target-changed", onInspectTargetChanged);
      };
    },
    [scene, setSelectedObject, objects, selectedObject]
  );

  const selectObject = useCallback(
    object => {
      const cameraSystem = scene.systems["hubs-systems"].cameraSystem;

      setSelectedObject(object);

      if (object.el.object3D !== cameraSystem.inspectable) {
        if (cameraSystem.inspectable) {
          cameraSystem.uninspect(false);
        }

        cameraSystem.enableLights = object.enableLights;
        cameraSystem.inspect(object.el, 1.5, true, false);
      }
    },
    [scene, setSelectedObject]
  );

  const deselectObject = useCallback(
    () => {
      const cameraSystem = scene.systems["hubs-systems"].cameraSystem;

      setSelectedObject(null);

      cameraSystem.enableLights = true;
      cameraSystem.uninspect(false);

      if (focusedObject) {
        cameraSystem.enableLights = focusedObject.enableLights;
        cameraSystem.inspect(focusedObject.el, 1.5, true, false);
      }
    },
    [scene, setSelectedObject, focusedObject]
  );

  const focusObject = useCallback(
    object => {
      const cameraSystem = scene.systems["hubs-systems"].cameraSystem;

      setFocusedObject(object);

      if (object.el.object3D !== cameraSystem.inspectable) {
        if (cameraSystem.inspectable) {
          cameraSystem.uninspect(false);
        }

        cameraSystem.enableLights = object.enableLights;
        cameraSystem.inspect(object.el, 1.5, true, false);
      }
    },
    [scene, setFocusedObject]
  );

  const unfocusObject = useCallback(
    () => {
      const cameraSystem = scene.systems["hubs-systems"].cameraSystem;

      setFocusedObject(null);

      cameraSystem.enableLights = true;
      cameraSystem.uninspect(false);

      if (selectedObject) {
        cameraSystem.enableLights = selectedObject.enableLights;
        cameraSystem.inspect(selectedObject.el, 1.5, true, false);
      }
    },
    [scene, setFocusedObject, selectedObject]
  );

  const selectNextObject = useCallback(
    () => {
      const curObjIdx = objects.indexOf(selectedObject);

      if (curObjIdx !== -1) {
        const nextObjIdx = (curObjIdx + 1) % objects.length;
        selectObject(objects[nextObjIdx]);
      }
    },
    [selectObject, objects, selectedObject]
  );

  const selectPrevObject = useCallback(
    () => {
      const curObjIdx = objects.indexOf(selectedObject);

      if (curObjIdx !== -1) {
        const nextObjIdx = curObjIdx === 0 ? objects.length - 1 : curObjIdx - 1;
        selectObject(objects[nextObjIdx]);
      }
    },
    [selectObject, objects, selectedObject]
  );

  const context = {
    objects,
    activeObject: focusedObject || selectedObject,
    focusedObject,
    selectedObject,
    focusObject,
    unfocusObject,
    selectObject,
    deselectObject,
    selectPrevObject,
    selectNextObject
  };

  // Note: If we move ui-root to a functional component and use hooks,
  // we can use the useObjectList hook instead of cloneElement.

  return (
    <ObjectListContext.Provider value={context}>
      {Children.map(children, child => cloneElement(child, { ...context }))}
    </ObjectListContext.Provider>
  );
}

ObjectListProvider.propTypes = {
  scene: PropTypes.object.isRequired,
  children: PropTypes.node
};

export function useObjectList() {
  return useContext(ObjectListContext);
}

import React, { useState, useEffect, useContext, createContext, useCallback } from "react";
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
        const objects = scene.systems["listed-media"].els.sort(mediaSort).map((el, i) => ({
          id: i,
          name: getDisplayString(el),
          type: getMediaType(el),
          el
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

  const unfocusObject = useCallback(
    () => {
      setFocusedObject(null);
    },
    [setFocusedObject]
  );

  const deselectObject = useCallback(
    () => {
      setSelectedObject(null);
    },
    [setSelectedObject]
  );

  useEffect(
    () => {
      const activeObject = focusedObject || selectedObject;

      if (activeObject) {
        scene.systems["hubs-systems"].cameraSystem.inspect(
          activeObject.el.object3D,
          activeObject.el.object3D,
          1.5,
          true
        );
      } else {
        scene.systems["hubs-systems"].cameraSystem.uninspect();
      }

      return () => {
        scene.systems["hubs-systems"].cameraSystem.uninspect();
      };
    },
    [scene, focusedObject, selectedObject]
  );

  return (
    <ObjectListContext.Provider
      value={{
        objects,
        focusedObject,
        selectedObject,
        focusObject: setFocusedObject,
        unfocusObject,
        selectObject: setSelectedObject,
        deselectObject
      }}
    >
      {children}
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

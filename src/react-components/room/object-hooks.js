import { useEffect, useState, useCallback } from "react";
import { removeNetworkedObject } from "../../utils/removeNetworkedObject";
import { rotateInPlaceAroundWorldUp, affixToWorldUp } from "../../utils/three-utils";
import { getPromotionTokenForFile } from "../../utils/media-utils";

function getPinnedState(el) {
  return el.components.pinnable && el.components.pinnable.data.pinned;
}

function hasIsStaticTag(el) {
  return el.components.tags && el.components.tags.data.isStatic;
}

export function getObjectUrl(object) {
  const mediaLoader = object.el.components["media-loader"];
  return (mediaLoader && mediaLoader.data.src) || "#";
}

export function usePinObject(hubChannel, scene, object) {
  const [isPinned, setIsPinned] = useState(getPinnedState(object.el));

  const pinObject = useCallback(
    () => {
      const el = object.el;
      if (!NAF.utils.isMine(el) && !NAF.utils.takeOwnership(el)) return;
      el.setAttribute("pinnable", "pinned", true);
      el.emit("pinned", { el });
    },
    [object]
  );

  const unpinObject = useCallback(
    () => {
      const el = object.el;
      if (!NAF.utils.isMine(el) && !NAF.utils.takeOwnership(el)) return;
      el.setAttribute("pinnable", "pinned", false);
      el.emit("unpinned", { el });
    },
    [object]
  );

  const togglePinned = useCallback(
    () => {
      if (isPinned) {
        unpinObject();
      } else {
        pinObject();
      }
    },
    [isPinned, pinObject, unpinObject]
  );

  useEffect(
    () => {
      const el = object.el;

      function onPinStateChanged() {
        setIsPinned(getPinnedState(el));
      }

      el.addEventListener("pinned", onPinStateChanged);
      el.addEventListener("unpinned", onPinStateChanged);

      return () => {
        el.removeEventListener("pinned", onPinStateChanged);
        el.removeEventListener("unpinned", onPinStateChanged);
      };
    },
    [object]
  );

  const el = object.el;
  const { fileIsOwned, fileId } = el.components["media-loader"].data;

  const canPin = !!(
    scene.is("entered") &&
    !hasIsStaticTag(el) &&
    hubChannel.can("pin_objects") &&
    (fileIsOwned || (fileId && getPromotionTokenForFile(fileId)))
  );

  return { canPin, isPinned, togglePinned, pinObject, unpinObject };
}

export function useGoToSelectedObject(scene) {
  const [canGoTo] = useState(() => {
    const uiRoot = document.getElementById("ui-root");
    return !(uiRoot && uiRoot.firstChild && uiRoot.firstChild.classList.contains("isGhost"));
  });

  const goToSelectedObject = useCallback(
    () => {
      const viewingCamera = document.getElementById("viewing-camera");
      const targetMatrix = new THREE.Matrix4();
      const translation = new THREE.Matrix4();
      viewingCamera.object3DMap.camera.updateMatrices();
      targetMatrix.copy(viewingCamera.object3DMap.camera.matrixWorld);
      affixToWorldUp(targetMatrix, targetMatrix);
      translation.makeTranslation(0, -1.6, 0.15);
      targetMatrix.multiply(translation);
      rotateInPlaceAroundWorldUp(targetMatrix, Math.PI, targetMatrix);

      scene.systems["hubs-systems"].characterController.enqueueWaypointTravelTo(targetMatrix, true, {
        willDisableMotion: false,
        willDisableTeleporting: false,
        snapToNavMesh: false,
        willMaintainInitialOrientation: false
      });
    },
    [scene]
  );

  return { canGoTo, goToSelectedObject };
}

export function useRemoveObject(hubChannel, scene, object) {
  const removeObject = useCallback(
    () => {
      removeNetworkedObject(scene, object.el);
    },
    [scene, object]
  );

  const el = object.el;

  const canRemoveObject = !!(
    scene.is("entered") &&
    !getPinnedState(el) &&
    !hasIsStaticTag(el) &&
    hubChannel.can("spawn_and_move_media")
  );

  return { removeObject, canRemoveObject };
}

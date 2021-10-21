import { useEffect, useState, useCallback, useMemo } from "react";
import { removeNetworkedObject } from "../../utils/removeNetworkedObject";
import { rotateInPlaceAroundWorldUp, affixToWorldUp } from "../../utils/three-utils";
import { getPromotionTokenForFile } from "../../utils/media-utils";

function getPinnedState(el) {
  return !!(el.components.pinnable && el.components.pinnable.data.pinned);
}

function hasIsStaticTag(el) {
  return !!(el.components.tags && el.components.tags.data.isStatic);
}

export function isMe(object) {
  return object.el.id === "avatar-rig";
}

export function isPlayer(object) {
  return !!object.el.components["networked-avatar"];
}

export function getObjectUrl(object) {
  const mediaLoader = object.el.components["media-loader"];

  const url =
    mediaLoader && ((mediaLoader.data.mediaOptions && mediaLoader.data.mediaOptions.href) || mediaLoader.data.src);

  if (url && !url.startsWith("hubs://")) {
    return url;
  }

  return null;
}

export function usePinObject(hubChannel, scene, object) {
  const [isPinned, setIsPinned] = useState(getPinnedState(object.el));

  const pinObject = useCallback(
    () => {
      const el = object.el;
      if (!NAF.utils.isMine(el) && !NAF.utils.takeOwnership(el)) return;
      window.APP.pinningHelper.setPinned(el, true);
    },
    [object]
  );

  const unpinObject = useCallback(
    () => {
      const el = object.el;
      if (!NAF.utils.isMine(el) && !NAF.utils.takeOwnership(el)) return;
      window.APP.pinningHelper.setPinned(el, false);
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
      setIsPinned(getPinnedState(el));
      return () => {
        el.removeEventListener("pinned", onPinStateChanged);
        el.removeEventListener("unpinned", onPinStateChanged);
      };
    },
    [object]
  );

  const el = object.el;

  let userOwnsFile = false;

  if (el.components["media-loader"]) {
    const { fileIsOwned, fileId } = el.components["media-loader"].data;
    userOwnsFile = fileIsOwned || (fileId && getPromotionTokenForFile(fileId));
  }

  const canPin = !!(
    scene.is("entered") &&
    !isPlayer(object) &&
    !hasIsStaticTag(el) &&
    hubChannel.can("pin_objects") &&
    userOwnsFile
  );

  return { canPin, isPinned, togglePinned, pinObject, unpinObject };
}

export function useGoToSelectedObject(scene, object) {
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

  const uiRoot = useMemo(() => document.getElementById("ui-root"), []);
  const isSpectating = uiRoot && uiRoot.firstChild && uiRoot.firstChild.classList.contains("isGhost");
  const canGoTo = !isSpectating && !isPlayer(object);

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
    !isPlayer(object) &&
    !getPinnedState(el) &&
    !hasIsStaticTag(el) &&
    hubChannel.can("spawn_and_move_media")
  );

  return { removeObject, canRemoveObject };
}

export function useHideAvatar(hubChannel, avatarEl) {
  const hideAvatar = useCallback(
    () => {
      if (avatarEl.components.networked) {
        const clientId = avatarEl.components.networked.data.owner;

        if (clientId && clientId !== NAF.clientId) {
          hubChannel.hide(clientId);
        }
      }
    },
    [hubChannel, avatarEl]
  );

  return hideAvatar;
}

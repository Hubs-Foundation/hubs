import { useEffect, useState, useCallback, useMemo } from "react";
import { removeNetworkedObject } from "../../utils/removeNetworkedObject";
import { findAncestorWithComponent, shouldUseNewLoader } from "../../utils/bit-utils";
import { rotateInPlaceAroundWorldUp, affixToWorldUp } from "../../utils/three-utils";
import { getPromotionTokenForFile } from "../../utils/media-utils";
import { hasComponent } from "bitecs";
import { isPinned as getPinnedState } from "../../bit-systems/networking";
import { deleteTheDeletableAncestor } from "../../bit-systems/delete-entity-system";
import { isAEntityPinned } from "../../systems/hold-system";
import { AEntity, LocalAvatar, MediaInfo, RemoteAvatar, Static, MediaContentBounds } from "../../bit-components";
import { setPinned } from "../../utils/bit-pinning-helper";
import { debounce } from "lodash";

export function isMe(object) {
  if (shouldUseNewLoader()) {
    return hasComponent(APP.world, LocalAvatar, object.eid);
  } else {
    return object.id === "avatar-rig";
  }
}

export function isPlayer(object) {
  if (shouldUseNewLoader()) {
    return hasComponent(APP.world, RemoteAvatar, object.eid);
  } else {
    return !!object.el.components["networked-avatar"];
  }
}

export function getObjectUrl(object) {
  let url;
  if (shouldUseNewLoader()) {
    const urlSid = MediaInfo.accessibleUrl[object.eid];
    url = APP.getString(urlSid);
  } else {
    const mediaLoader = object.el.components["media-loader"];
    url =
      mediaLoader && ((mediaLoader.data.mediaOptions && mediaLoader.data.mediaOptions.href) || mediaLoader.data.src);
  }

  if (url && !url.startsWith("hubs://")) {
    return url;
  }

  return null;
}

function isObjectPinned(world, eid) {
  if (hasComponent(world, AEntity, eid)) {
    return isAEntityPinned(APP.world, eid);
  } else {
    // This hook is making decisions based on components attached to the root MediaLoader entity
    // and the child media entity. ie. The MediaInfo component lives in the child media but the
    // networked state lives in the root. This is not great, there is a lot of places where we need to
    // do component searches to find either the media root or the actual media. It's not even reasonable
    // to look for a component name MediaContentBounds just to get the MediaLoader (as we remove that
    // after loading the media).
    // We should probably find a better way of dealing with spawned media entity hierarchies.
    const mediaRootEid = findAncestorWithComponent(APP.world, MediaContentBounds, eid);
    return getPinnedState(mediaRootEid);
  }
}

export function usePinObject(hubChannel, scene, object) {
  const [isPinned, setIsPinned] = useState(isObjectPinned(APP.world, object.eid));

  const pinObject = useCallback(() => {
    if (shouldUseNewLoader()) {
      const mediaRootEid = findAncestorWithComponent(APP.world, MediaContentBounds, object.eid);
      setPinned(hubChannel, APP.world, mediaRootEid, true);
    } else {
      const el = object.el;
      if (!NAF.utils.isMine(el) && !NAF.utils.takeOwnership(el)) return;
      window.APP.pinningHelper.setPinned(el, true);
    }
  }, [object, hubChannel]);

  const unpinObject = useCallback(() => {
    if (shouldUseNewLoader()) {
      const mediaRootEid = findAncestorWithComponent(APP.world, MediaContentBounds, object.eid);
      setPinned(hubChannel, APP.world, mediaRootEid, false);
    } else {
      const el = object.el;
      if (!NAF.utils.isMine(el) && !NAF.utils.takeOwnership(el)) return;
      window.APP.pinningHelper.setPinned(el, false);
    }
  }, [object, hubChannel]);

  const _togglePinned = useCallback(() => {
    if (isPinned) {
      unpinObject();
    } else {
      pinObject();
    }
  }, [isPinned, pinObject, unpinObject]);

  const togglePinned = useMemo(() => debounce(_togglePinned, 100), [_togglePinned]);
  useEffect(() => {
    return () => {
      togglePinned.cancel();
    };
  }, [togglePinned]);

  useEffect(() => {
    if (shouldUseNewLoader()) {
      const handler = setInterval(() => {
        setIsPinned(isObjectPinned(APP.world, object.eid));
      }, 100);
      return () => {
        clearInterval(handler);
      };
    }

    const el = object.el;

    function onPinStateChanged() {
      setIsPinned(isObjectPinned(APP.world, object.eid));
    }
    el.addEventListener("pinned", onPinStateChanged);
    el.addEventListener("unpinned", onPinStateChanged);
    setIsPinned(isObjectPinned(APP.world, object.eid));
    return () => {
      el.removeEventListener("pinned", onPinStateChanged);
      el.removeEventListener("unpinned", onPinStateChanged);
    };
  }, [object]);

  let userOwnsFile = true;
  if (!shouldUseNewLoader()) {
    const el = object.el;
    if (el.components["media-loader"]) {
      const { fileIsOwned, fileId } = el.components["media-loader"].data;
      userOwnsFile = fileIsOwned || (fileId && getPromotionTokenForFile(fileId));
    }
  }

  let targetEid;
  if (shouldUseNewLoader()) {
    targetEid = findAncestorWithComponent(APP.world, MediaContentBounds, object.eid);
  } else {
    targetEid = object.el.eid;
  }
  const isStatic = hasComponent(APP.world, Static, targetEid);

  const canPin = !!(
    scene.is("entered") &&
    !isPlayer(object) &&
    !isStatic &&
    hubChannel.can("pin_objects") &&
    userOwnsFile
  );

  return { canPin, isPinned, togglePinned, pinObject, unpinObject };
}

export function useGoToSelectedObject(scene, object) {
  const goToSelectedObject = useCallback(() => {
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
  }, [scene]);

  const uiRoot = useMemo(() => document.getElementById("ui-root"), []);
  const isSpectating = uiRoot && uiRoot.firstChild && uiRoot.firstChild.classList.contains("isGhost");
  const canGoTo = !isSpectating && !isPlayer(object);

  return { canGoTo, goToSelectedObject };
}

export function useRemoveObject(hubChannel, scene, object) {
  const removeObject = useCallback(() => {
    if (shouldUseNewLoader()) {
      deleteTheDeletableAncestor(APP.world, object.eid);
    } else {
      removeNetworkedObject(scene, object.el);
    }
  }, [scene, object]);

  const eid = object.eid;

  const canRemoveObject = !!(
    scene.is("entered") &&
    !isPlayer(object) &&
    !isObjectPinned(APP.world, eid) &&
    !hasComponent(APP.world, Static, eid) &&
    hubChannel.can("spawn_and_move_media")
  );

  return { removeObject, canRemoveObject };
}

export function useHideAvatar(hubChannel, avatarObj) {
  const hideAvatar = useCallback(() => {
    let avatarEl;
    if (shouldUseNewLoader()) {
      // TODO This should be updated when we migrate avatars to bitECS
      const avatarEid = avatarObj.eid;
      avatarEl = APP.world.eid2obj.get(avatarEid).el;
    } else {
      avatarEl = avatarObj.el;
    }
    if (avatarEl && avatarEl.components.networked) {
      const clientId = avatarEl.components.networked.data.owner;

      if (clientId && clientId !== NAF.clientId) {
        hubChannel.hide(clientId);
      }
    }
  }, [hubChannel, avatarObj]);

  return hideAvatar;
}

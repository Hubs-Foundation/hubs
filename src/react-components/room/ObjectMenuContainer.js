import React from "react";
import PropTypes from "prop-types";
import { ObjectMenu, ObjectMenuButton } from "./ObjectMenu";
import { useObjectList } from "./useObjectList";
import { usePinObject, useRemoveObject, useGoToSelectedObject, getObjectUrl, getPlayerInfo } from "./object-hooks";
import { ReactComponent as PinIcon } from "../icons/Pin.svg";
import { ReactComponent as LinkIcon } from "../icons/Link.svg";
import { ReactComponent as GoToIcon } from "../icons/GoTo.svg";
import { ReactComponent as DeleteIcon } from "../icons/Delete.svg";
import { ReactComponent as AvatarIcon } from "../icons/Avatar.svg";

export function ObjectMenuContainer({ hubChannel, scene, onOpenProfile }) {
  const { objects, activeObject, deselectObject } = useObjectList();
  const { canPin, isPinned, togglePinned } = usePinObject(hubChannel, scene, activeObject);
  const { canRemoveObject, removeObject } = useRemoveObject(hubChannel, scene, activeObject);
  const { canGoTo, goToSelectedObject } = useGoToSelectedObject(scene, activeObject);
  const url = getObjectUrl(activeObject);
  const isPlayer = getPlayerInfo(activeObject);

  return (
    <ObjectMenu
      title="Object"
      currentObjectIndex={objects.indexOf(activeObject)}
      objectCount={objects.length}
      onClose={deselectObject}
      onBack={deselectObject}
    >
      {canPin && (
        <ObjectMenuButton onClick={togglePinned}>
          <PinIcon />
          <span>{isPinned ? "Unpin" : "Pin"}</span>
        </ObjectMenuButton>
      )}
      {url && (
        <ObjectMenuButton as="a" href={url} target="_blank" rel="noopener noreferrer">
          <LinkIcon />
          <span>Link</span>
        </ObjectMenuButton>
      )}
      {canGoTo && (
        <ObjectMenuButton
          onClick={() => {
            goToSelectedObject();
            deselectObject();
          }}
        >
          <GoToIcon />
          <span>View</span>
        </ObjectMenuButton>
      )}
      {canRemoveObject && (
        <ObjectMenuButton
          onClick={() => {
            removeObject();
            deselectObject();
          }}
        >
          <DeleteIcon />
          <span>Delete</span>
        </ObjectMenuButton>
      )}
      {isPlayer && (
        <ObjectMenuButton onClick={onOpenProfile}>
          <AvatarIcon />
          <span>Edit Avatar</span>
        </ObjectMenuButton>
      )}
    </ObjectMenu>
  );
}

ObjectMenuContainer.propTypes = {
  hubChannel: PropTypes.object.isRequired,
  scene: PropTypes.object.isRequired,
  onOpenProfile: PropTypes.func.isRequired
};

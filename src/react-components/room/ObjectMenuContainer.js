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

function PlayerMenuItems({ onOpenProfile }) {
  return (
    <ObjectMenuButton onClick={onOpenProfile}>
      <AvatarIcon />
      <span>Edit Avatar</span>
    </ObjectMenuButton>
  );
}

PlayerMenuItems.propTypes = {
  onOpenProfile: PropTypes.func.isRequired
};

function ObjectMenuItems({ hubChannel, scene, activeObject, deselectObject }) {
  const { canPin, isPinned, togglePinned } = usePinObject(hubChannel, scene, activeObject);
  const { canRemoveObject, removeObject } = useRemoveObject(hubChannel, scene, activeObject);
  const { canGoTo, goToSelectedObject } = useGoToSelectedObject(scene, activeObject);
  const url = getObjectUrl(activeObject);

  return (
    <>
      <ObjectMenuButton disabled={!canPin} onClick={togglePinned}>
        <PinIcon />
        <span>{isPinned ? "Unpin" : "Pin"}</span>
      </ObjectMenuButton>
      <ObjectMenuButton disabled={!url} as="a" href={url} target="_blank" rel="noopener noreferrer">
        <LinkIcon />
        <span>Link</span>
      </ObjectMenuButton>
      <ObjectMenuButton
        disabled={!canGoTo}
        onClick={() => {
          goToSelectedObject();
          deselectObject();
        }}
      >
        <GoToIcon />
        <span>View</span>
      </ObjectMenuButton>
      <ObjectMenuButton
        disabled={!canRemoveObject}
        onClick={() => {
          removeObject();
          deselectObject();
        }}
      >
        <DeleteIcon />
        <span>Delete</span>
      </ObjectMenuButton>
    </>
  );
}

ObjectMenuItems.propTypes = {
  hubChannel: PropTypes.object.isRequired,
  scene: PropTypes.object.isRequired,
  activeObject: PropTypes.object.isRequired,
  deselectObject: PropTypes.func.isRequired
};

export function ObjectMenuContainer({ hubChannel, scene, onOpenProfile }) {
  const { objects, activeObject, deselectObject, selectNextObject, selectPrevObject } = useObjectList();
  const isPlayer = getPlayerInfo(activeObject);

  return (
    <ObjectMenu
      title="Object"
      currentObjectIndex={objects.indexOf(activeObject)}
      objectCount={objects.length}
      onClose={deselectObject}
      onBack={deselectObject}
      onNextObject={selectNextObject}
      onPrevObject={selectPrevObject}
    >
      {isPlayer ? (
        <PlayerMenuItems onOpenProfile={onOpenProfile} />
      ) : (
        <ObjectMenuItems
          hubChannel={hubChannel}
          scene={scene}
          activeObject={activeObject}
          deselectObject={deselectObject}
        />
      )}
    </ObjectMenu>
  );
}

ObjectMenuContainer.propTypes = {
  hubChannel: PropTypes.object.isRequired,
  scene: PropTypes.object.isRequired,
  onOpenProfile: PropTypes.func.isRequired
};

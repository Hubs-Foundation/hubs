import React, { useContext } from "react";
import styles from "./InvitePopover.scss";
import { RoomContext } from "./RoomContext";
import { CopyableTextInputField } from "../input/CopyableTextInputField";

export function InvitePopover() {
  const { url, code, embed } = useContext(RoomContext);

  return (
    <div className={styles.invitePopover}>
      <CopyableTextInputField label="Room Link" value={url} buttonPreset="green" />
      <CopyableTextInputField label="Room Code" value={code} buttonPreset="blue" />
      <CopyableTextInputField label="Embed Code" value={embed} buttonPreset="purple" />
    </div>
  );
}

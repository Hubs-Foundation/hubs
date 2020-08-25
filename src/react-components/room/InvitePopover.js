import React, { useCallback, useContext } from "react";
import styles from "./InvitePopover.scss";
import { TextInputField } from "../input/TextInputField";
import { Button } from "../input/Button";
import { RoomContext } from "./RoomContext";

export function InvitePopover() {
  const { url, code, embed } = useContext(RoomContext);
  const copyToClipboard = useCallback(e => console.log(e.target.value));

  return (
    <div className={styles.invitePopover}>
      <TextInputField
        label="Room Link"
        value={url}
        afterInput={
          <Button preset="green" value={url} onClick={copyToClipboard}>
            Copy
          </Button>
        }
      />
      <TextInputField
        label="Room Code"
        value={code}
        afterInput={
          <Button preset="blue" value={url} onClick={copyToClipboard}>
            Copy
          </Button>
        }
      />
      <TextInputField
        label="Embed Code"
        value={embed}
        afterInput={
          <Button preset="purple" value={url} onClick={copyToClipboard}>
            Copy
          </Button>
        }
      />
    </div>
  );
}

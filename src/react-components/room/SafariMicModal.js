import React from "react";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import { Column } from "../layout/Column";

export function SafariMicModal() {
  return (
    <Modal title="Microphone Access Required">
      <Column center padding>
        <p>Hubs requires microphone permissions in Safari.</p>
        <p>Please reload and allow microphone access to continue.</p>
        <Button preset="green" onClick={() => location.reload()}>
          Reload
        </Button>
      </Column>
    </Modal>
  );
}

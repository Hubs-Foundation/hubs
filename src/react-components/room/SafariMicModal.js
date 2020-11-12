import React from "react";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import styles from "./SafariMicModal.scss";

export function SafariMicModal() {
  return (
    <Modal title="Microphone Access Required">
      <div className={styles.safariMicModal}>
        <p>Hubs requires microphone permissions in Safari.</p>
        <p>Please reload and allow microphone access to continue.</p>
        <Button preset="green" onClick={() => location.reload()}>
          Reload
        </Button>
      </div>
    </Modal>
  );
}

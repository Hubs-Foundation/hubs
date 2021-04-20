import React from "react";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import { Column } from "../layout/Column";
import { FormattedMessage } from "react-intl";

export function SafariMicModal() {
  return (
    <Modal title={<FormattedMessage id="safari-mic-modal.title" defaultMessage="Microphone Access Required" />}>
      <Column center padding>
        <FormattedMessage
          id="safari-mic-modal.message"
          defaultMessage="<p>Hubs requires microphone permissions in Safari.</p><p>Please reload and allow microphone access to continue.</p>"
          values={{
            // eslint-disable-next-line react/display-name
            p: chunks => <p>{chunks}</p>
          }}
        />
        <Button preset="accept" onClick={() => location.reload()}>
          <FormattedMessage id="safari-mic-modal.reload-button" defaultMessage="Reload" />
        </Button>
      </Column>
    </Modal>
  );
}

import React from "react";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import { Column } from "../layout/Column";
import { FormattedMessage } from "react-intl";

export function SafariMicModal() {
  return (
    <Modal title={<FormattedMessage id="safari-mic-modal.title" defaultMessage="マイクの使用を許可してください" />}>
      <Column center padding>
        <FormattedMessage
          id="safari-mic-modal.message"
          defaultMessage="<p>マイクの使用を許可してください。</p><p>マイクの使用を許可して、再読み込みしてください。</p>"
          values={{
            // eslint-disable-next-line react/display-name
            p: chunks => <p>{chunks}</p>
          }}
        />
        <Button preset="accept" onClick={() => location.reload()}>
          <FormattedMessage id="safari-mic-modal.reload-button" defaultMessage="再読み込み" />
        </Button>
      </Column>
    </Modal>
  );
}

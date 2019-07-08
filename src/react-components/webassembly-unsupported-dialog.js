import React, { Component } from "react";
import DialogContainer from "./dialog-container.js";

export default class WebAssemblyUnsupportedDialog extends Component {
  render() {
    return (
      <DialogContainer title="WebAssembly Unsupported" {...this.props}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p>
            Your browser doesn&apos;t seem to support WebAssembly.
            <br />
            Please update or switch to a newer browser.
          </p>
        </div>
      </DialogContainer>
    );
  }
}

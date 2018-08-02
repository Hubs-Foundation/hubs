import React, { Component } from "react";
import PropTypes from "prop-types";

import giphyLogo from "../assets/images/giphy_logo.png";

const attributionHostnames = {
  "giphy.com": giphyLogo
};

const DEFAULT_OBJECT_URL = "https://asset-bundles-prod.reticulum.io/interactables/Ducky/DuckyMesh-438ff8e022.gltf";
const isMobile = AFRAME.utils.device.isMobile();
const instructions = "Paste a URL or upload a file";
const desktopTips = "Tip: You can paste links directly into Hubs with Ctrl+V";
const mobileInstructions = <div>{instructions}</div>;
const desktopInstructions = (
  <div>
    {instructions}
    <br />
    {desktopTips}
  </div>
);

let lastUrl = "";

export default class CreateObjectDialog extends Component {
  state = {
    url: "",
    file: null,
    fileName: ""
  };

  static propTypes = {
    onCreateObject: PropTypes.func,
    onCloseDialog: PropTypes.func
  };

  componentDidMount() {
    this.setState({ url: lastUrl });
  }

  componentWillUnmount() {
    lastUrl = this.state.url;
  }

  onUrlChange = e => {
    let url;
    try {
      url = new URL(e.target.value);
    } catch (_) {
      this.setState({
        url: e.target && e.target.value
      });
      return;
    }
    this.setState({
      url: e.target && e.target.value,
      attributionImage: e.target && e.target.value && e.target.validity.valid && attributionHostnames[url.hostname]
    });
  };

  onFileChange = e => {
    this.setState({
      file: e.target.files[0],
      fileName: e.target.files[0].name
    });
  };

  onCreateClicked = () => {
    this.props.onCreateObject(this.state.file || this.state.url || DEFAULT_OBJECT_URL);
    this.props.onCloseDialog();
  };

  reset = e => {
    e.preventDefault();
    this.setState({
      url: "",
      file: null,
      fileName: ""
    });
  };

  onHover = e => {
    e.currentTarget.children[0].classList.add("hover");
    e.currentTarget.children[0].classList.remove("unhover");
  };

  onHoverExit = e => {
    e.currentTarget.children[0].classList.remove("hover");
    e.currentTarget.children[0].classList.add("unhover");
  };

  render() {
    const withContent = (
      <label className="small-button" onClick={this.reset} onMouseEnter={this.onHover} onMouseLeave={this.onHoverExit}>
        <svg id="cancel-svg" viewBox="0 0 512 512">
          /* font awesome : times-circle-regular*/
          <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm101.8-262.2L295.6 256l62.2 62.2c4.7 4.7 4.7 12.3 0 17l-22.6 22.6c-4.7 4.7-12.3 4.7-17 0L256 295.6l-62.2 62.2c-4.7 4.7-12.3 4.7-17 0l-22.6-22.6c-4.7-4.7-4.7-12.3 0-17l62.2-62.2-62.2-62.2c-4.7-4.7-4.7-12.3 0-17l22.6-22.6c4.7-4.7 12.3-4.7 17 0l62.2 62.2 62.2-62.2c4.7-4.7 12.3-4.7 17 0l22.6 22.6c4.7 4.7 4.7 12.3 0 17z" />
        </svg>
      </label>
    );
    const withoutContent = (
      <label htmlFor="file-input" className="small-button" onMouseEnter={this.onHover} onMouseLeave={this.onHoverExit}>
        <svg id="upload-svg" viewBox="0 0 512 512">
          /* font awesome : upload-solid*/
          <path d="M296 384h-80c-13.3 0-24-10.7-24-24V192h-87.7c-17.8 0-26.7-21.5-14.1-34.1L242.3 5.7c7.5-7.5 19.8-7.5 27.3 0l152.2 152.2c12.6 12.6 3.7 34.1-14.1 34.1H320v168c0 13.3-10.7 24-24 24zm216-8v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h136v8c0 30.9 25.1 56 56 56h80c30.9 0 56-25.1 56-56v-8h136c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z" />
        </svg>
      </label>
    );
    const fileName = <label className="file-name">{this.state.fileName}</label>;
    const urlInput = (
      <input
        className="url-input"
        placeholder="Image/Video/glTF URL"
        onChange={this.onUrlChange}
        value={this.state.url}
      />
    );

    return (
      <div>
        {isMobile ? mobileInstructions : desktopInstructions}
        <form onSubmit={this.onCreateClicked}>
          <div className="add-media-form">
            <input id="file-input" className="hide-file-input" type="file" onChange={this.onFileChange} />
            <div className="input-border">
              {this.state.file ? fileName : urlInput}
              {this.state.url || this.state.fileName ? withContent : withoutContent}
            </div>
            <div className="add-media-form__buttons">
              <button className="add-media-form__action-button">
                <span>create</span>
              </button>
            </div>
            {this.state.attributionImage ? (
              <div>
                <img src={this.state.attributionImage} />
              </div>
            ) : null}
          </div>
        </form>
      </div>
    );
  }
}

import React, { Component } from "react";
import PropTypes from "prop-types";
import giphyLogo from "../assets/images/giphy_logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperclip, faTimes } from "@fortawesome/free-solid-svg-icons";
import styles from "../assets/stylesheets/create-object-dialog.scss";
import cx from "classnames";

const attributionHostnames = {
  "giphy.com": giphyLogo,
  "media.giphy.com": giphyLogo
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
const fileInputId = "file-input";

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
        // Not a valid URL, so don't try to set attributeImage using url.hostname
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

  render() {
    const cancelButton = (
      <label className={cx(styles.smallButton, styles.cancelIcon)} onClick={this.reset}>
        <FontAwesomeIcon icon={faTimes} />
      </label>
    );
    const uploadButton = (
      <label htmlFor={fileInputId} className={cx(styles.smallButton, styles.uploadIcon)}>
        <FontAwesomeIcon icon={faPaperclip} />
      </label>
    );
    const filenameLabel = (<label className={cx(styles.fileNameLabel, "add-media-form__link_field")}>{this.state.fileName}</label>);
    const urlInput = (
      <input
        className={cx(styles.urlInput, "add-media-form__link_field")}
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
            <input id={fileInputId} className={styles.hideFileInput} type="file" onChange={this.onFileChange} />
            <div className={styles.inputBorder}>
              {this.state.file ? filenameLabel : urlInput}
              {this.state.url || this.state.fileName ? cancelButton : uploadButton}
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

import React, { Component } from "react";
import PropTypes from "prop-types";

import giphyLogo from "../assets/images/giphy_logo.png";

const attributionHostnames = {
  "giphy.com": giphyLogo
};

const DEFAULT_OBJECT_URL = "https://asset-bundles-prod.reticulum.io/interactables/Ducky/DuckyMesh-438ff8e022.gltf";

let lastUrl = "";

export default class CreateObjectDialog extends Component {
  state = {
    url: "",
    file: null,
    text: ""
  };

  static propTypes = {
    onCreateObject: PropTypes.func,
    onCloseDialog: PropTypes.func
  };

  componentDidMount() {
    this.setState({ url: lastUrl }, () => {
      this.onUrlChange({ target: this.input });
    });
  }

  componentWillUnmount() {
    lastUrl = this.state.url;
  }

  onUrlChange = e => {
    if (e && e.target.value && e.target.value !== "") {
      this.setState({
        url: e.target.value,
        text: e.target.value,
        attributionImage: e.target.validity.valid && attributionHostnames[new URL(e.target.value).hostname]
      });
    } else {
      this.setState({
        text: ""
      });
    }
  };

  onFileChange = (e) =>{
    this.setState({
      file: e.target.files[0],
      text: e.target.files[0].name
    });
  };

  onCreateClicked = () => {
    this.props.onCreateObject(this.state.file || this.state.url || DEFAULT_OBJECT_URL);
    this.props.onCloseDialog();
  };

  render() {
    return (
      <div>
        {!AFRAME.utils.device.isMobile() ? (
          <div>
            Paste a URL from the web to create an object in the room.
            <br />
            Tip: You can paste directly into Hubs using Ctrl+V
          </div>
        ) : (
          <div>Paste a URL from the web to create an object in the room.</div>
        )}

        <form onSubmit={this.onCreateClicked}>
          <div className="add-media-form">
            <div className="add-media-form__input_fields">
              <input
                ref={el => (this.input = el)}
                type={this.state.file ? "text" : "url"}
                placeholder="Image, Video, or GLTF URL"
                className="add-media-form__link_field"
                value={this.state.text}
                onChange={this.onUrlChange}
              />
              <input className="add-media-form__file"
                id="file"
                type="file"
                onChange={this.onFileChange}
              />
              <label className="add-media-form__file_label" htmlFor="file">Choose a file</label>
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

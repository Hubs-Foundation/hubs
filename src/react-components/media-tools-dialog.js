import React, { Component } from "react";
import PropTypes from "prop-types";

let lastAddMediaUrl = "";
export default class MediaToolsDialog extends Component {
  state = {
    addMediaUrl: ""
  };

  static propTypes = {
    onAddMedia: PropTypes.func,
    onCloseDialog: PropTypes.func
  };

  constructor() {
    super();
    this.onAddMediaClicked = this.onAddMediaClicked.bind(this);
    this.onUrlChange = this.onUrlChange.bind(this);
  }

  componentDidMount() {
    this.setState({ addMediaUrl: lastAddMediaUrl });
  }

  componentWillUnmount() {
    lastAddMediaUrl = this.state.addMediaUrl;
  }

  onUrlChange(e) {
    this.setState({ addMediaUrl: e.target.value });
  }

  onAddMediaClicked() {
    this.props.onAddMedia(this.state.addMediaUrl);
    this.props.onCloseDialog();
  }

  render() {
    return (
      <div>
        <div>Tip: You can paste media urls directly into hubs with ctrl+v</div>
        <form onSubmit={this.onAddMediaClicked}>
          <div className="add-media-form">
            <input
              ref={el => (this.input = el)}
              type="url"
              placeholder="Image, Video, or GLTF URL"
              className="add-media-form__link_field"
              value={this.state.addMediaUrl}
              onChange={this.onUrlChange}
              required
            />
            <div className="add-media-form__buttons">
              <button className="add-media-form__action-button">
                <span>Add</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

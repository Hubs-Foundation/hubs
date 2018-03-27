import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl, FormattedMessage } from 'react-intl';

class AvatarSelector extends Component {
  static propTypes = {
    avatars: PropTypes.array,
    avatar: PropTypes.string,
    onChange: PropTypes.func,
  }

  getAvatarIndex(direction=0) {
    const currAvatarIndex = this.props.avatars.findIndex(avatar => avatar.id === this.props.avatar);
    const numAvatars = this.props.avatars.length;
    return ((currAvatarIndex + direction) % numAvatars + numAvatars) % numAvatars;
  }

  nextAvatar = () => {
    const newAvatarIndex = this.getAvatarIndex(1);
    this.props.onChange(this.props.avatars[newAvatarIndex].id);
  }

  prevAvatar = () => {
    const newAvatarIndex = this.getAvatarIndex(-1);
    this.props.onChange(this.props.avatars[newAvatarIndex].id);
  }

  componentDidMount() {
    const start = performance.now();
    this.scene.addEventListener('loaded', () => {
      this.loading.style.display = 'none';
    });
  }

  render () {
    const avatarAssets = this.props.avatars.map(avatar => (
      <a-progressive-asset
        id={avatar.id}
        key={avatar.id}
        response-type="arraybuffer"
        high-src={`./src/assets/avatars/${avatar.models.high}`}
        low-src={`./src/assets/avatars/${avatar.models.low}`}
      ></a-progressive-asset>
    ));

    const avatarEntities = this.props.avatars.map((avatar, i) => (
      <a-entity key={avatar.id} position="0 0 0" rotation={`0 ${360 * i / this.props.avatars.length} 0`}>
        <a-gltf-entity position="0 0 5" rotation="0 0 0" src={'#' + avatar.id} inflate="true">
          <template data-selector=".RootScene">
            <a-entity animation-mixer></a-entity>
          </template>
          <a-animation attribute="rotation" dur="2000" to="0 360 0" fill="forwards" repeat="indefinite"></a-animation>
        </a-gltf-entity>
      </a-entity>
    ));

    return (
      <div className="avatar-selector">
      <span className="avatar-selector__loading" ref={ldg => this.loading = ldg}>
        <FormattedMessage id="profile.avatar-selector.loading"/>
      </span>
      <a-scene vr-mode-ui="enabled: false" ref={sce => this.scene = sce}>
        <a-assets>
          {avatarAssets}
          <a-asset-item
            id="meeting-space1-mesh"
            response-type="arraybuffer"
            src="./src/assets/environments/MeetingSpace1_mesh.glb"
          ></a-asset-item>
        </a-assets>

        <a-entity rotation={`0 ${360 * -this.getAvatarIndex() / this.props.avatars.length + 180} 0`}>
        {avatarEntities}
        </a-entity>

        <a-entity position="0 1.5 -5.6" rotation="-10 180 0" camera></a-entity>

        <a-entity
          hide-when-quality="low"
          light="type: directional; color: #F9FFCE; intensity: 0.6"
          position="0 5 -15"
        ></a-entity>
        <a-entity
          hide-when-quality="low"
          light="type: ambient; color: #FFF"
        ></a-entity>
        <a-gltf-entity
          id="meeting-space"
          src="#meeting-space1-mesh"
          position="0 0 0"
        ></a-gltf-entity>
      </a-scene>
      <button className="avatar-selector__prev-button" onClick={this.prevAvatar}>
        <i className="avatar-selector__button-icon material-icons">keyboard_arrow_left</i>
      </button>
      <button className="avatar-selector__next-button" onClick={this.nextAvatar}>
        <i className="avatar-selector__button-icon material-icons">keyboard_arrow_right</i>
      </button>
      </div>
    );
  }
}

export default injectIntl(AvatarSelector);

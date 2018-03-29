import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl, FormattedMessage } from 'react-intl';

class AvatarSelector extends Component {
  static propTypes = {
    avatars: PropTypes.array,
    avatar: PropTypes.string,
    onChange: PropTypes.func,
  }

  getAvatarIndex = (direction=0) => {
    const currAvatarIndex = this.props.avatars.findIndex(avatar => avatar.id === this.props.avatar);
    const numAvatars = this.props.avatars.length;
    return ((currAvatarIndex + direction) % numAvatars + numAvatars) % numAvatars;
  }
  nextAvatarIndex = () => this.getAvatarIndex(1)
  previousAvatarIndex = () => this.getAvatarIndex(-1)

  emitChangeToNext = () => {
    const nextAvatarId = this.props.avatars[nextAvatarIndex()].id;
    this.props.onChange(nextAvatarId);
  }

  emitChangeToPrevious = () => {
    const prevAvatarId = this.props.avatars[prevAvatarIndex()].id;
    this.props.onChange(prevAvatarId);
  }

  componentDidUpdate() {
    // HACK - a-animation ought to restart the animation when the `to` attribute changes, but it doesn't
    // so we need to force it here.
    const currRot = this.animation.parentNode.getAttribute('rotation');
    this.animation.setAttribute('from', `${currRot.x} ${currRot.y} ${currRot.z}`);
    this.animation.stop();
    this.animation.handleMixinUpdate();
    this.animation.start();
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
      <a-entity key={avatar.id} position="0 0 0" rotation={`0 ${360 * -i / this.props.avatars.length} 0`}>
        <a-gltf-entity position="0 0 5" rotation="0 0 0" src={'#' + avatar.id} inflate="true">
          <template data-selector=".RootScene">
            <a-entity animation-mixer></a-entity>
          </template>
          <a-animation
            attribute="rotation"
            dur="2000"
            to={`0 ${this.getAvatarIndex() === i ? 360 : 0} 0`}
            repeat="indefinite">
          </a-animation>
        </a-gltf-entity>
      </a-entity>
    ));

    return (
      <div className="avatar-selector">
      <span className="avatar-selector__loading">
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

        <a-entity data-avatar={this.props.avatar}>
          <a-animation
            ref={anm => this.animation = anm}
            attribute="rotation"
            dur="1000"
            easing="ease-out"
            to={`0 ${360 * this.getAvatarIndex() / this.props.avatars.length + 180} 0`}>
          </a-animation>
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
      <button className="avatar-selector__prev-button" onClick={this.emitChangeToPrevious}>
        <i className="avatar-selector__button-icon material-icons">keyboard_arrow_left</i>
      </button>
      <button className="avatar-selector__next-button" onClick={this.emitChangeToNext}>
        <i className="avatar-selector__button-icon material-icons">keyboard_arrow_right</i>
      </button>
      </div>
    );
  }
}

export default injectIntl(AvatarSelector);

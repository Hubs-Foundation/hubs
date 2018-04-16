import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import faAngleLeft from "@fortawesome/fontawesome-free-solid/faAngleLeft";
import faAngleRight from "@fortawesome/fontawesome-free-solid/faAngleRight";

// TODO: we should make a bundle for avatar picker with it's own geometry, for now just use the indoor part of the meting room
const meetingSpace = "https://asset-bundles-prod.reticulum.io/rooms/meetingroom/MeetingSpace1_mesh-d48250ebc6.gltf";

class AvatarSelector extends Component {
  static propTypes = {
    avatars: PropTypes.array,
    avatarId: PropTypes.string,
    onChange: PropTypes.func
  };

  getAvatarIndex = (direction = 0) => {
    const currAvatarIndex = this.props.avatars.findIndex(avatar => avatar.id === this.props.avatarId);
    const numAvatars = this.props.avatars.length;
    return ((currAvatarIndex + direction) % numAvatars + numAvatars) % numAvatars;
  };
  nextAvatarIndex = () => this.getAvatarIndex(-1);
  previousAvatarIndex = () => this.getAvatarIndex(1);

  emitChangeToNext = () => {
    const nextAvatarId = this.props.avatars[this.nextAvatarIndex()].id;
    this.props.onChange(nextAvatarId);
  };

  emitChangeToPrevious = () => {
    const previousAvatarId = this.props.avatars[this.previousAvatarIndex()].id;
    this.props.onChange(previousAvatarId);
  };

  componentDidUpdate(prevProps) {
    if (this.props.avatarId !== prevProps.avatarId) {
      // HACK - a-animation ought to restart the animation when the `to` attribute changes, but it doesn't
      // so we need to force it here.
      const currRot = this.animation.parentNode.getAttribute("rotation");
      const currY = currRot.y;
      const toRot = this.animation.getAttribute("to").split(" ");
      const toY = toRot[1];
      const step = 360.0 / this.props.avatars.length;
      const brokenlyBigRotation = Math.abs(toY - currY) > 3 * step;
      let fromY = currY;
      if (brokenlyBigRotation) {
        // Rotation in Y wrapped around 360. Adjust the "from" to prevent a dramatic rotation
        fromY = currY < toY ? currY + 360 : currY - 360;
      }
      this.animation.setAttribute("from", `${currRot.x} ${fromY} ${currRot.z}`);
      this.animation.stop();
      this.animation.handleMixinUpdate();
      this.animation.start();
    }
  }

  render() {
    const avatarAssets = this.props.avatars.map(avatar => (
      <a-asset-item id={avatar.id} key={avatar.id} response-type="arraybuffer" src={`${avatar.model}`} />
    ));

    const avatarEntities = this.props.avatars.map((avatar, i) => (
      <a-entity key={avatar.id} position="0 0 0" rotation={`0 ${360 * -i / this.props.avatars.length} 0`}>
        <a-entity position="0 0 5" rotation="0 0 0" gltf-model-plus={`src: #${avatar.id}`} inflate="true">
          <template data-selector=".RootScene">
            <a-entity animation-mixer />
          </template>
          <a-animation
            attribute="rotation"
            dur="2000"
            to={`0 ${this.getAvatarIndex() === i ? 360 : 0} 0`}
            repeat="indefinite"
          />
        </a-entity>
      </a-entity>
    ));

    return (
      <div className="avatar-selector">
        <span className="avatar-selector__loading">
          <FormattedMessage id="profile.avatar-selector.loading" />
        </span>
        <a-scene vr-mode-ui="enabled: false" ref={sce => (this.scene = sce)}>
          <a-assets>
            {avatarAssets}
            <a-asset-item id="meeting-space1-mesh" response-type="arraybuffer" src={meetingSpace} />
          </a-assets>

          <a-entity>
            <a-animation
              ref={anm => (this.animation = anm)}
              attribute="rotation"
              dur="1000"
              easing="ease-out"
              to={`0 ${(360 * this.getAvatarIndex() / this.props.avatars.length + 180) % 360} 0`}
            />
            {avatarEntities}
          </a-entity>

          <a-entity position="0 1.5 -5.6" rotation="-10 180 0" camera />

          <a-entity
            hide-when-quality="low"
            light="type: directional; color: #F9FFCE; intensity: 0.6"
            position="0 5 -15"
          />
          <a-entity hide-when-quality="low" light="type: ambient; color: #FFF" />
          <a-entity id="meeting-space" gltf-model-plus="src: #meeting-space1-mesh" position="0 0 0" />
        </a-scene>
        <button className="avatar-selector__previous-button" onClick={this.emitChangeToPrevious}>
          <FontAwesomeIcon icon={faAngleLeft} />
        </button>
        <button className="avatar-selector__next-button" onClick={this.emitChangeToNext}>
          <FontAwesomeIcon icon={faAngleRight} />
        </button>
      </div>
    );
  }
}

export default injectIntl(AvatarSelector);

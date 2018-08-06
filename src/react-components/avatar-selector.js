import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl } from "react-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons/faAngleLeft";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons/faAngleRight";

// TODO: we should make a bundle for avatar picker with it's own geometry, for now just use the indoor part of the meting room
const meetingSpace = "https://asset-bundles-prod.reticulum.io/rooms/meetingroom/MeetingSpace1_mesh-d48250ebc6.gltf";

class AvatarSelector extends Component {
  static propTypes = {
    avatars: PropTypes.array,
    avatarId: PropTypes.string,
    onChange: PropTypes.func
  };

  static getAvatarIndex = (props, offset = 0) => {
    const currAvatarIndex = props.avatars.findIndex(avatar => avatar.id === props.avatarId);
    const numAvatars = props.avatars.length;
    return (((currAvatarIndex + offset) % numAvatars) + numAvatars) % numAvatars;
  };
  static nextAvatarIndex = props => AvatarSelector.getAvatarIndex(props, -1);
  static previousAvatarIndex = props => AvatarSelector.getAvatarIndex(props, 1);

  state = {
    initialAvatarIndex: 0,
    avatarIndices: []
  };

  getAvatarIndex = (offset = 0) => AvatarSelector.getAvatarIndex(this.props, offset);
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

  constructor(props) {
    super(props);
    this.state.initialAvatarIndex = AvatarSelector.getAvatarIndex(props);
    this.state.avatarIndices = [
      AvatarSelector.nextAvatarIndex(props),
      this.state.initialAvatarIndex,
      AvatarSelector.previousAvatarIndex(props)
    ];
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // Push new avatar indices onto the array if necessary.
    this.setState(state => {
      const numAvatars = nextProps.avatars.length;
      if (state.avatarIndices.length === numAvatars) return;

      const lastIndex = numAvatars - 1;
      const currAvatarIndex = this.getAvatarIndex();
      const nextAvatarIndex = AvatarSelector.getAvatarIndex(nextProps);
      const avatarIndices = Array.from(state.avatarIndices);
      const increasing = currAvatarIndex - nextAvatarIndex < 0;

      let direction = -1;
      let push = false;

      if (nextAvatarIndex === 0) {
        if (currAvatarIndex === lastIndex) {
          direction = 1;
          push = avatarIndices.indexOf(lastIndex) !== 0;
        } else {
          direction = -1;
          push = avatarIndices.indexOf(1) !== 0;
        }
      } else if (nextAvatarIndex === lastIndex) {
        if (currAvatarIndex === 0) {
          direction = -1;
          push = avatarIndices.indexOf(0) === 0;
        } else {
          direction = 1;
          push = avatarIndices.indexOf(lastIndex - 1) !== 0;
        }
      } else {
        direction = increasing ? 1 : -1;
        push = increasing;
      }

      const addIndex = AvatarSelector.getAvatarIndex(nextProps, direction);
      if (avatarIndices.includes(addIndex)) return;

      if (push) {
        avatarIndices.push(addIndex);
      } else {
        avatarIndices.unshift(addIndex);
      }
      return { avatarIndices };
    });
  }

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
    const avatarData = this.state.avatarIndices.map(i => [this.props.avatars[i], i]);
    const avatarEntities = avatarData.map(([avatar, i]) => (
      <a-entity key={avatar.id} rotation={`0 ${(360 * -i) / this.props.avatars.length} 0`}>
        <a-entity position="0 0 5" gltf-model-plus={`src: #${avatar.id}`} inflate="true">
          <template data-selector=".RootScene">
            <a-entity animation-mixer="" />
          </template>

          <a-animation
            attribute="rotation"
            dur="12000"
            to={`0 ${this.getAvatarIndex() === i ? 360 : 0} 0`}
            repeat="indefinite"
          />
        </a-entity>
      </a-entity>
    ));

    const rotationFromIndex = index => ((360 * index) / this.props.avatars.length + 180) % 360;
    const initialRotation = rotationFromIndex(this.state.initialAvatarIndex);
    const toRotation = rotationFromIndex(this.getAvatarIndex());

    return (
      <div className="avatar-selector">
        <a-scene vr-mode-ui="enabled: false" ref={sce => (this.scene = sce)}>
          <a-assets>
            {avatarAssets}
            <a-asset-item id="meeting-space1-mesh" response-type="arraybuffer" src={meetingSpace} />
          </a-assets>

          <a-entity rotation={`0 ${initialRotation} 0`}>
            <a-animation
              ref={anm => (this.animation = anm)}
              attribute="rotation"
              dur="2000"
              easing="ease-out"
              to={`0 ${toRotation} 0`}
            />
            {avatarEntities}
          </a-entity>

          <a-entity position="0 1.5 -5.6" rotation="-10 180 0">
            <a-entity camera="" />
          </a-entity>

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

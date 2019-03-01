import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl } from "react-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons/faAngleLeft";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons/faAngleRight";
import { WithHoverSound } from "./wrap-with-audio";

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

  componentDidMount() {
    // <a-scene> component not initialized until scene element mounted and loaded.
    this.scene.addEventListener("loaded", () => {
      this.scene.setAttribute("light", {
        defaultLightsEnabled: false
      });
      this.scene.setAttribute("shadow", { type: "pcfsoft", enabled: window.APP.quality !== "low" });
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.avatarId !== prevProps.avatarId) {
      // HACK - animation ought to restart the animation when the `to` attribute changes, but it doesn't
      // so we need to force it here.
      const currRot = this.animation.getAttribute("rotation");
      const currY = currRot.y;
      const toRot = this.animation
        .getAttribute("animation")
        .to.split(" ")
        .map(Number);
      const toY = toRot[1];
      const step = 360.0 / this.props.avatars.length;
      const brokenlyBigRotation = Math.abs(toY - currY) > 3 * step;
      let fromY = currY;
      if (brokenlyBigRotation) {
        // Rotation in Y wrapped around 360. Adjust the "from" to prevent a dramatic rotation
        fromY = currY < toY ? currY + 360 : currY - 360;
      }
      this.animation.setAttribute("animation", "from", `${currRot.x} ${fromY} ${currRot.z}`);
    }
  }

  render() {
    const avatarAssets = this.props.avatars.map(avatar => (
      <a-asset-item id={avatar.id} key={avatar.id} response-type="arraybuffer" src={`${avatar.model}`} />
    ));
    const avatarData = this.state.avatarIndices.map(i => [this.props.avatars[i], i]);
    const avatarEntities = avatarData.map(([avatar, i]) => (
      <a-entity key={avatar.id} rotation={`0 ${(360 * -i) / this.props.avatars.length} 0`}>
        <a-entity
          position="0 0 5"
          gltf-model-plus={`src: #${avatar.id}`}
          animation={`property: rotation; dur: 12000; from: 0.5 0.5 0.5; to: 0 ${
            this.getAvatarIndex() === i ? 360 : 0
          } 0; loop: true;`}
        />
      </a-entity>
    ));

    const rotationFromIndex = index => ((360 * index) / this.props.avatars.length + 180) % 360;
    const initialRotation = rotationFromIndex(this.state.initialAvatarIndex);
    const toRotation = rotationFromIndex(this.getAvatarIndex());

    return (
      <div className="avatar-selector">
        <a-scene
          vr-mode-ui="enabled: false"
          ref={sce => (this.scene = sce)}
          background="color: #aaa"
          environment-map=""
          renderer="antialias: true; colorManagement: true; sortObjects: true; physicallyCorrectLights: true; alpha: false; gammaOutput: true;"
        >
          <a-assets>{avatarAssets}</a-assets>

          <a-entity skybox="turbidity: 20; rayleigh: 0.03; luminance: 0.175; mieCoefficient: 0.004; mieDirectionalG: 0.098; azimuth: 0.37; inclination: 0.14;" />

          <a-entity
            ref={anm => (this.animation = anm)}
            rotation={`0 ${initialRotation} 0`}
            animation={`property: rotation; dur: 2000; easing: easeOutQuad; to: 0 ${toRotation} 0;`}
          >
            {avatarEntities}
          </a-entity>

          <a-entity position="0 1.5 -5.6" rotation="-10 180 0">
            <a-entity camera="far: 1.5;" />
          </a-entity>

          <a-entity
            hide-when-quality="low"
            light="type: directional; color: #fdf5c2; intensity: 12"
            position="0 10 -15"
          />

          <a-entity
            hide-when-quality="low"
            light="type: hemisphere; color: #b1e3ff; groundColor: #b1e3ff; intensity: 1.5;"
          />
        </a-scene>
        <WithHoverSound>
          <button className="avatar-selector__previous-button" onClick={this.emitChangeToPrevious}>
            <FontAwesomeIcon icon={faAngleLeft} />
          </button>
        </WithHoverSound>
        <WithHoverSound>
          <button className="avatar-selector__next-button" onClick={this.emitChangeToNext}>
            <FontAwesomeIcon icon={faAngleRight} />
          </button>
        </WithHoverSound>
      </div>
    );
  }
}

export default injectIntl(AvatarSelector);

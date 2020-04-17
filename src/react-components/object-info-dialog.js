import React, { Component } from "react";
import { rotateInPlaceAroundWorldUp, affixToWorldUp } from "../utils/three-utils";
import classNames from "classnames";
import PropTypes from "prop-types";
import DialogContainer from "./dialog-container.js";
import styles from "../assets/stylesheets/client-info-dialog.scss";
import rootStyles from "../assets/stylesheets/ui-root.scss";
import objectInfoDialogStyles from "../assets/stylesheets/object-info-dialog.scss";
import { FormattedMessage } from "react-intl";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons/faChevronLeft";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons/faChevronRight";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import entryStyles from "../assets/stylesheets/entry.scss";
import { mediaSort } from "../utils/media-sorting.js";
import circle from "../assets/images/circle.png";
import smallCircle from "../assets/images/small-circle.png";
import chevronLeft from "../assets/images/chevron-left.png";
import chevronRight from "../assets/images/chevron-right.png";
import remove from "../assets/images/remove.png";
import unpin from "../assets/images/unpin.png";
import pin from "../assets/images/pin.png";
import goTo from "../assets/images/goto.png";

function actionBarItem(ariaLabel, onClickHandler, backgroundImageSrc, foregroundImageSrc, messageId) {
  return (
    <div className={objectInfoDialogStyles.actionBarItem}>
      <button
        className={classNames({
          [objectInfoDialogStyles.noDefaultButtonStyle]: true,
          [objectInfoDialogStyles.flex]: true
        })}
        aria-label={ariaLabel}
        onClick={onClickHandler}
      >
        <div className={objectInfoDialogStyles.imageStack}>
          {backgroundImageSrc ? <img className={objectInfoDialogStyles.stackedImage} src={backgroundImageSrc} /> : null}
          {foregroundImageSrc ? <img className={objectInfoDialogStyles.stackedImage} src={foregroundImageSrc} /> : null}
        </div>
      </button>
      {messageId && (
        <div className={objectInfoDialogStyles.subtitle}>
          <FormattedMessage id={messageId} />
        </div>
      )}
    </div>
  );
}

function actionBarItemPlaceholder(showCircle) {
  return actionBarItem("", () => {}, showCircle ? circle : null);
}

let uiRoot;
export default class ObjectInfoDialog extends Component {
  static propTypes = {
    scene: PropTypes.object,
    el: PropTypes.object,
    pinned: PropTypes.bool,
    src: PropTypes.string,
    onClose: PropTypes.func,
    onPinChanged: PropTypes.func,
    onNavigated: PropTypes.func,
    hubChannel: PropTypes.object
  };

  state = {
    enableLights: false,
    mediaEntities: []
  };

  componentDidMount() {
    this.updateMediaEntities = this.updateMediaEntities.bind(this);
    this.navigateNext = this.navigateNext.bind(this);
    this.navigatePrev = this.navigatePrev.bind(this);
    this.navigate = this.navigate.bind(this);
    this.viewingCamera = document.getElementById("viewing-camera");
    this.pin = this.pin.bind(this);
    this.unpin = this.unpin.bind(this);
    this.props.scene.addEventListener("uninspect", this.props.onClose);
    const cameraSystem = this.props.scene.systems["hubs-systems"].cameraSystem;
    this.setState({ enableLights: cameraSystem.enableLights });
    this.updateMediaEntities();
    this.props.scene.addEventListener("listed_media_changed", () => this.updateMediaEntities());
  }

  updateMediaEntities() {
    const mediaEntities = [...this.props.scene.systems["listed-media"].els];
    mediaEntities.sort(mediaSort);
    this.setState({ mediaEntities });
  }

  pin() {
    if (!NAF.utils.isMine(this.props.el) && !NAF.utils.takeOwnership(this.props.el)) return;
    this.props.el.setAttribute("pinnable", "pinned", true);
    this.props.el.emit("pinned", { el: this.props.el });
    this.props.onPinChanged && this.props.onPinChanged();
  }

  unpin() {
    if (!NAF.utils.isMine(this.props.el) && !NAF.utils.takeOwnership(this.props.el)) return;
    this.props.el.setAttribute("pinnable", "pinned", false);
    this.props.el.emit("unpinned", { el: this.props.el });
    this.props.onPinChanged && this.props.onPinChanged();
  }

  toggleLights() {
    const cameraSystem = this.props.scene.systems["hubs-systems"].cameraSystem;
    cameraSystem.enableLights = !cameraSystem.enableLights;
    localStorage.setItem("show-background-while-inspecting", cameraSystem.enableLights.toString());
    this.setState({ enableLights: cameraSystem.enableLights });
    if (cameraSystem.enableLights) {
      cameraSystem.showEverythingAsNormal();
    } else {
      cameraSystem.hideEverythingButThisObject(this.props.el.object3D);
    }
  }

  enqueueWaypointTravel = (function() {
    const targetMatrix = new THREE.Matrix4();
    const translation = new THREE.Matrix4();
    return function enqueueWaypointTravel() {
      this.viewingCamera.object3D.updateMatrices();
      targetMatrix.copy(this.viewingCamera.object3D.matrixWorld);
      affixToWorldUp(targetMatrix, targetMatrix);
      translation.makeTranslation(0, -1.6, 0.15);
      targetMatrix.multiply(translation);
      rotateInPlaceAroundWorldUp(targetMatrix, Math.PI, targetMatrix);

      this.props.scene.systems["hubs-systems"].characterController.enqueueWaypointTravelTo(targetMatrix, true, {
        willDisableMotion: false,
        willDisableTeleporting: false,
        snapToNavMesh: false,
        willMaintainInitialOrientation: false
      });
      this.props.onClose();
    };
  })().bind(this);

  navigateNext() {
    this.navigate(1);
  }

  navigatePrev() {
    this.navigate(-1);
  }

  navigate(direction) {
    const { mediaEntities } = this.state;
    let targetIndex = (mediaEntities.indexOf(this.props.el) + direction) % mediaEntities.length;
    targetIndex = targetIndex === -1 ? mediaEntities.length - 1 : targetIndex;
    this.props.onNavigated && this.props.onNavigated(mediaEntities[targetIndex]);
  }

  remove() {
    if (this._isRemoving) return;
    this._isRemoving = true;

    const targetEl = this.props.el;

    if (!NAF.utils.isMine(targetEl) && !NAF.utils.takeOwnership(targetEl)) return;

    targetEl.setAttribute("animation__remove", {
      property: "scale",
      dur: 200,
      to: { x: 0.01, y: 0.01, z: 0.01 },
      easing: "easeInQuad"
    });

    targetEl.addEventListener("animationcomplete", () => {
      const exitAfterRemove = this.state.mediaEntities.length <= 1;
      this.props.scene.systems["hubs-systems"].cameraSystem.uninspect();
      NAF.utils.takeOwnership(targetEl);
      targetEl.parentNode.removeChild(targetEl);

      if (exitAfterRemove) {
        this.props.onClose();
      } else {
        this.navigateNext();
      }

      this._isRemoving = false;
    });
  }

  render() {
    const { pinned, onClose } = this.props;
    const isStatic = this.props.el.components.tags && this.props.el.components.tags.data.isStatic;
    const showNavigationButtons = this.state.mediaEntities.length > 1;
    uiRoot = uiRoot || document.getElementById("ui-root");
    const isGhost = uiRoot && uiRoot.firstChild && uiRoot.firstChild.classList.contains("isGhost");
    const showGoToButton = this.props.scene.is("entered") || isGhost;
    const showPinOrUnpin =
      this.props.scene.is("entered") && !isStatic && this.props.hubChannel && this.props.hubChannel.can("pin_objects");
    const showPinButton = showPinOrUnpin && !pinned;
    const showUnpinButton = showPinOrUnpin && pinned;
    const showRemoveButton =
      this.props.scene.is("entered") &&
      !pinned &&
      !isStatic &&
      this.props.hubChannel &&
      this.props.hubChannel.can("spawn_and_move_media");

    return window.innerWidth < 450 ? (
      <div className={rootStyles.uiDialog}>
        <div className={classNames({ [rootStyles.uiDialogBoxContents]: true, [rootStyles.uiInteractive]: true })}>
          <div className={objectInfoDialogStyles.topBar}>
            <button
              aria-label={`Close object info panel`}
              autoFocus
              className={classNames({
                [objectInfoDialogStyles.collapseButton]: true,
                [objectInfoDialogStyles.noDefaultButtonStyle]: true
              })}
              onClick={onClose}
            >
              <i>
                <FontAwesomeIcon icon={faTimes} />
              </i>
            </button>
            <div className={objectInfoDialogStyles.openLink}>
              <a className={rootStyles.linkText} href={this.props.src} target="_blank" rel="noopener noreferrer">
                <FormattedMessage id={`object-info.open-link`} />
              </a>
            </div>
          </div>
          <div className={objectInfoDialogStyles.actionBar}>
            {showNavigationButtons
              ? actionBarItem("Previous Object", this.navigatePrev, smallCircle, chevronLeft)
              : actionBarItemPlaceholder(false)}
            {showGoToButton
              ? actionBarItem("Go To", this.enqueueWaypointTravel, circle, goTo, "object-info.waypoint")
              : actionBarItemPlaceholder(false)}
            {showPinButton ? actionBarItem("Pin", this.pin, circle, pin, "object-info.pin-button") : null}
            {showUnpinButton ? actionBarItem("Unpin", this.unpin, circle, unpin, "object-info.unpin-button") : null}
            {!showPinButton && !showUnpinButton ? actionBarItemPlaceholder(false) : null}
            {showRemoveButton
              ? actionBarItem("Remove", this.remove.bind(this), circle, remove, "object-info.remove-button")
              : actionBarItemPlaceholder(false)}
            {showNavigationButtons
              ? actionBarItem("Next Object", this.navigateNext, smallCircle, chevronRight)
              : actionBarItemPlaceholder(false)}
          </div>
        </div>
      </div>
    ) : (
      <DialogContainer noOverlay={true} wide={true} {...this.props}>
        <div className={styles.roomInfo}>
          <div className={styles.titleAndClose}>
            <button
              aria-label={`Close object info panel`}
              autoFocus
              className={entryStyles.collapseButton}
              onClick={onClose}
            >
              <i>
                <FontAwesomeIcon icon={faTimes} />
              </i>
            </button>
            <a className={styles.objectDisplayString} href={this.props.src} target="_blank" rel="noopener noreferrer">
              <FormattedMessage id={`object-info.open-link`} />
            </a>
          </div>
          <div className={styles.actionButtonSections}>
            <div className={styles.leftActionButtons}>
              {showNavigationButtons && (
                <button aria-label="Previous Object" className={styles.navigationButton} onClick={this.navigatePrev}>
                  <i>
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </i>
                </button>
              )}
            </div>
            <div className={styles.primaryActionButtons}>
              <button onClick={this.toggleLights.bind(this)}>
                <FormattedMessage id={`object-info.${this.state.enableLights ? "lower" : "raise"}-lights`} />
              </button>
              {this.props.scene.is("entered") && (
                <button onClick={this.enqueueWaypointTravel}>
                  <FormattedMessage id="object-info.waypoint" />
                </button>
              )}
              {showRemoveButton ? (
                <button onClick={this.remove.bind(this)}>
                  <FormattedMessage id="object-info.remove-button" />
                </button>
              ) : (
                <div className={styles.actionButtonPlaceholder} />
              )}
              {showPinOrUnpin && (
                <button className={pinned ? "" : styles.primaryActionButton} onClick={pinned ? this.unpin : this.pin}>
                  <FormattedMessage id={`object-info.${pinned ? "unpin-button" : "pin-button"}`} />
                </button>
              )}
              <a className={styles.cancelText} href="#" onClick={onClose}>
                <FormattedMessage id="client-info.cancel" />
              </a>
            </div>
            <div className={styles.rightActionButtons}>
              {showNavigationButtons && (
                <button aria-label="Next Object" className={styles.navigationButton} onClick={this.navigateNext}>
                  <i>
                    <FontAwesomeIcon icon={faChevronRight} />
                  </i>
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContainer>
    );
  }
}

import PropTypes from "prop-types";
import React, { Component } from "react";
import { rotateInPlaceAroundWorldUp, affixToWorldUp } from "../utils/three-utils";
import classNames from "classnames";
import DialogContainer from "./dialog-container.js";
import cStyles from "../assets/stylesheets/client-info-dialog.scss";
import rootStyles from "../assets/stylesheets/ui-root.scss";
import oStyles from "../assets/stylesheets/object-info-dialog.scss";
import { FormattedMessage } from "react-intl";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons/faChevronLeft";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons/faChevronRight";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons/faTrashAlt";
import { faStreetView } from "@fortawesome/free-solid-svg-icons/faStreetView";
import { faLightbulb } from "@fortawesome/free-solid-svg-icons/faLightbulb";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons/faExternalLinkAlt";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import entryStyles from "../assets/stylesheets/entry.scss";
import { faCube } from "@fortawesome/free-solid-svg-icons/faCube";
import { faVideo } from "@fortawesome/free-solid-svg-icons/faVideo";
import { faMusic } from "@fortawesome/free-solid-svg-icons/faMusic";
import { faImage } from "@fortawesome/free-solid-svg-icons/faImage";
import { faNewspaper } from "@fortawesome/free-solid-svg-icons/faNewspaper";
import { faQuestion } from "@fortawesome/free-solid-svg-icons/faQuestion";
import {
  SORT_ORDER_VIDEO,
  SORT_ORDER_AUDIO,
  SORT_ORDER_IMAGE,
  SORT_ORDER_PDF,
  SORT_ORDER_MODEL,
  SORT_ORDER_UNIDENTIFIED,
  mediaSortOrder,
  mediaSort
} from "../utils/media-sorting.js";
import { getPromotionTokenForFile } from "../utils/media-utils";

function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

const DISPLAY_IMAGE = new Map([
  [SORT_ORDER_VIDEO, faVideo],
  [SORT_ORDER_AUDIO, faMusic],
  [SORT_ORDER_IMAGE, faImage],
  [SORT_ORDER_PDF, faNewspaper],
  [SORT_ORDER_UNIDENTIFIED, faQuestion],
  [SORT_ORDER_MODEL, faCube]
]);

const ICON_WIDTH = 60;
const HALF_ICON_WIDTH = 60 / 2;

function headerIcon(icon, size, onClick, ariaLabel) {
  return (
    <button aria-label={ariaLabel} className={classNames(oStyles.noDefaultButtonStyle)} onClick={onClick}>
      <i className={oStyles.flex}>
        <FontAwesomeIcon
          className={classNames(size, oStyles.panelWidgetColor, oStyles.actionLabelColorOnHover)}
          icon={icon}
        />
      </i>
    </button>
  );
}
function headerIconLink(icon, size, href) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <i className={oStyles.flex}>
        <FontAwesomeIcon
          className={classNames(size, oStyles.panelWidgetColor, oStyles.actionLabelColorOnHover)}
          icon={icon}
        />
      </i>
    </a>
  );
}

function actionRowIcon(icon, size, onClick) {
  return (
    <button className={classNames(oStyles.noDefaultButtonStyle)} onClick={onClick}>
      <i className={oStyles.flex}>
        <FontAwesomeIcon className={classNames(size, oStyles.actionLabelColor)} icon={icon} />
      </i>
    </button>
  );
}

function subtitleText(text, ariaLabel) {
  return (
    <span aria-label={ariaLabel} className={oStyles.subtitleLarge}>
      {text}
    </span>
  );
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
    this.props.scene.addEventListener("uninspect", () => {
      this.props.onClose();
    });
    const cameraSystem = this.props.scene.systems["hubs-systems"].cameraSystem;
    this.setState({ enableLights: cameraSystem.enableLights });
    this.updateMediaEntities();
    this.props.scene.addEventListener("listed_media_changed", () => setTimeout(() => this.updateMediaEntities(), 0));
    this.navAreaRef = React.createRef();
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

  navigateTo(el) {
    this.props.onNavigated && this.props.onNavigated(el);
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

  navigationRowItem(entity, isSelected) {
    return (
      <button
        className={classNames(oStyles.noDefaultButtonStyle, oStyles.innerNavigationRowItem)}
        onClick={() => {
          if (this.state.isHandlingTouchInteraction) {
            return;
          }
          this.navigateTo(entity);
        }}
        key={`nav-row-item-${entity.object3D.uuid}`}
      >
        <i className={oStyles.flex}>
          <FontAwesomeIcon
            className={classNames(
              oStyles.s44x44,
              isSelected ? oStyles.actionLabelColor : oStyles.panelWidgetColor,
              oStyles.actionLabelColorOnHover
            )}
            icon={DISPLAY_IMAGE.get(mediaSortOrder(entity))}
          />
        </i>
      </button>
    );
  }

  buttonIndexAtTouchX(touchX, currentLeftOffset) {
    const TOTAL_WIDTH_OF_NAV_ITEMS = ICON_WIDTH * this.state.mediaEntities.length;
    const AVAILABLE_WIDTH_FOR_NAV_ITEMS = parseInt(window.getComputedStyle(this.navAreaRef.current).width);
    const ACTUAL_WIDTH_OF_NAV_ITEMS = Math.min(AVAILABLE_WIDTH_FOR_NAV_ITEMS, TOTAL_WIDTH_OF_NAV_ITEMS);

    const CENTER_PIXEL = window.innerWidth / 2;
    const FIRST_PIXEL = CENTER_PIXEL - ACTUAL_WIDTH_OF_NAV_ITEMS / 2;
    const ICONS_ON_SCREEN = ACTUAL_WIDTH_OF_NAV_ITEMS / ICON_WIDTH;

    const LEFT_OFFSET_FOR_ZEROTH_ITEM = AVAILABLE_WIDTH_FOR_NAV_ITEMS / 2 - HALF_ICON_WIDTH;
    const LEFT_OFFSET_FOR_LAST_ITEM = LEFT_OFFSET_FOR_ZEROTH_ITEM - ICON_WIDTH * (this.state.mediaEntities.length - 1);
    const LEFT_OFFSET_RANGE = LEFT_OFFSET_FOR_LAST_ITEM - LEFT_OFFSET_FOR_ZEROTH_ITEM;
    const leftOffsetZeroToOne = clamp((currentLeftOffset - LEFT_OFFSET_FOR_ZEROTH_ITEM) / LEFT_OFFSET_RANGE, 0, 1);
    const CENTER_ICON_UNFLOORED = leftOffsetZeroToOne * (this.state.mediaEntities.length - 1);
    const FIRST_ICON_UNFLOORED = CENTER_ICON_UNFLOORED - ICONS_ON_SCREEN / 2;
    const LAST_ICON_UNFLOORED = CENTER_ICON_UNFLOORED + ICONS_ON_SCREEN / 2;

    const touchXInNavItemList = touchX - FIRST_PIXEL;
    const touchZeroToOne = clamp((touchX - FIRST_PIXEL) / ACTUAL_WIDTH_OF_NAV_ITEMS, 0, 1);

    return clamp(
      Math.floor(
        TOTAL_WIDTH_OF_NAV_ITEMS <= AVAILABLE_WIDTH_FOR_NAV_ITEMS
          ? (this.state.mediaEntities.length * touchXInNavItemList) / ACTUAL_WIDTH_OF_NAV_ITEMS
          : FIRST_ICON_UNFLOORED + touchZeroToOne * (1 + LAST_ICON_UNFLOORED - FIRST_ICON_UNFLOORED)
      ),
      0,
      this.state.mediaEntities.length - 1
    );
  }

  renderSmallScreen(
    targetIndex,
    selectedEl,
    mediaEntities,
    showNavigationButtons,
    showGoToButton,
    showPinButton,
    showUnpinButton,
    showRemoveButton,
    onClose
  ) {
    const AVAILABLE_WIDTH_FOR_NAV_ITEMS =
      (this.navAreaRef &&
        this.navAreaRef.current &&
        parseInt(window.getComputedStyle(this.navAreaRef.current).width)) ||
      window.innerWidth - 120;
    const TOTAL_WIDTH_OF_NAV_ITEMS = ICON_WIDTH * mediaEntities.length;
    const DISTANCE_TO_CENTER = -1 * HALF_ICON_WIDTH + AVAILABLE_WIDTH_FOR_NAV_ITEMS / 2;
    const willScrollContent = TOTAL_WIDTH_OF_NAV_ITEMS > AVAILABLE_WIDTH_FOR_NAV_ITEMS;
    const UNLOCKED_LEFT_OFFSET = this.state.currentLeftOffset;
    const LOCKED_LEFT_OFFSET = DISTANCE_TO_CENTER - ICON_WIDTH * targetIndex;
    const DRAG_WIDTH_PX = HALF_ICON_WIDTH;
    const showObjectActionRow = showGoToButton || showPinButton || showUnpinButton || showRemoveButton;
    return (
      <div>
        {/* Header  */}
        <div className={classNames(oStyles.header, oStyles.floatContainer, rootStyles.uiInteractive)}>
          <div className={classNames(oStyles.floatLeft)}>
            {headerIcon(faTimes, oStyles.s32x32, onClose, "Close object info panel")}
          </div>
          <div className={classNames(oStyles.floatCenter)}>
            {subtitleText(
              `${1 + targetIndex}/${this.state.mediaEntities.length}`,
              `Showing item ${1 + targetIndex} of ${this.state.mediaEntities.length}`
            )}
          </div>
          <div className={classNames(oStyles.floatRight)}>
            {headerIconLink(faExternalLinkAlt, oStyles.s44x44, this.props.src)}
            {headerIcon(
              faLightbulb,
              oStyles.s44x44,
              this.toggleLights.bind(this),
              "Toggle rendering of the background"
            )}
          </div>
        </div>

        {/* Bottom Panel */}
        <div className={classNames(oStyles.panel, rootStyles.uiInteractive)}>
          <div className={oStyles.navigationRow}>
            {showNavigationButtons && headerIcon(faChevronLeft, oStyles.s44x44, this.navigatePrev, "Previous Object")}
            <div
              ref={this.navAreaRef}
              className={oStyles.innerNavigationRowContainer}
              style={{ justifyContent: willScrollContent ? "unset" : "center" }}
              onWheel={e => {
                if (e.deltaY > 0) {
                  this.navigate(1);
                } else if (e.deltaY < 0) {
                  this.navigate(-1);
                }
              }}
              onTouchStart={e => {
                const touchX = e.touches.item(0).clientX;
                const currentLeftOffset = parseFloat(window.getComputedStyle(e.currentTarget.children[0]).left);
                this.setState({
                  isDragging: false,
                  touchX,
                  initialTouchX: touchX,
                  currentLeftOffset,
                  initialLeftOffset: currentLeftOffset,
                  isHandlingTouchInteraction: true
                });
                if (!willScrollContent) {
                  this.navigateTo(this.state.mediaEntities[this.buttonIndexAtTouchX(touchX, currentLeftOffset)]);
                }
              }}
              onTouchMove={e => {
                const touchX = e.touches.item(0).clientX;
                if (!willScrollContent) {
                  this.navigateTo(
                    this.state.mediaEntities[this.buttonIndexAtTouchX(touchX, this.state.currentLeftOffset)]
                  );
                  this.setState({ touchX });
                } else {
                  const dX = touchX - this.state.initialTouchX;
                  const isDragging = this.state.isDragging || Math.abs(dX) > DRAG_WIDTH_PX;
                  if (isDragging) {
                    const currentLeftOffset = this.state.initialLeftOffset + dX;

                    this.setState({
                      currentLeftOffset
                    });

                    const CENTER_PIXEL = window.innerWidth / 2;
                    this.navigateTo(
                      this.state.mediaEntities[this.buttonIndexAtTouchX(CENTER_PIXEL, currentLeftOffset)]
                    );
                  }
                  this.setState({
                    isDragging,
                    touchX
                  });
                }
              }}
              onTouchEnd={() => {
                const wasDragging = this.state.isDragging;
                this.setState({ isHandlingTouchInteraction: false, isDragging: false });
                if (!wasDragging) {
                  this.navigateTo(
                    this.state.mediaEntities[this.buttonIndexAtTouchX(this.state.touchX, this.state.currentLeftOffset)]
                  );
                }
              }}
            >
              <div
                className={oStyles.innerNavigationRow}
                style={
                  willScrollContent
                    ? this.state.isDragging
                      ? {
                          left: `${UNLOCKED_LEFT_OFFSET}px`
                        }
                      : {
                          left: `${LOCKED_LEFT_OFFSET}px`,
                          transitionProperty: "left",
                          transitionDuration: "0.5s",
                          transitionTimingFunction: "ease-out"
                        }
                    : {}
                }
              >
                {mediaEntities.map(e => {
                  return this.navigationRowItem(e, e === selectedEl);
                })}
              </div>
            </div>
            {showNavigationButtons && headerIcon(faChevronRight, oStyles.s44x44, this.navigateNext, "Next Object")}
          </div>
          {showObjectActionRow && (
            <div className={classNames(oStyles.floatContainer, oStyles.objectActionRow)}>
              {showRemoveButton && (
                <div className={oStyles.floatLeft}>
                  {actionRowIcon(faTrashAlt, oStyles.s44x44, this.remove.bind(this), "Remove Object")}
                </div>
              )}
              {showPinButton && (
                <div className={oStyles.floatCenter}>
                  <button onClick={this.pin} className={oStyles.actionRowActionButton}>
                    <FormattedMessage id={"object-info.pin-button"} />
                  </button>
                </div>
              )}
              {showUnpinButton && (
                <div className={oStyles.floatCenter}>
                  <button onClick={this.unpin} className={oStyles.actionRowActionButtonSecondary}>
                    <FormattedMessage id={"object-info.unpin-button"} />
                  </button>
                </div>
              )}
              {showGoToButton && (
                <div className={oStyles.floatRight}>
                  {actionRowIcon(faStreetView, oStyles.s44x44, this.enqueueWaypointTravel, "Teleport to Object")}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  render() {
    const { pinned, onClose } = this.props;
    const isStatic = this.props.el.components.tags && this.props.el.components.tags.data.isStatic;
    const showNavigationButtons = this.state.mediaEntities.length > 1;
    uiRoot = uiRoot || document.getElementById("ui-root");
    const isGhost = uiRoot && uiRoot.firstChild && uiRoot.firstChild.classList.contains("isGhost");
    const showGoToButton = this.props.scene.is("entered") || isGhost;
    const { fileIsOwned, fileId } = this.props.el.components["media-loader"].data;
    const showPinOrUnpin =
      this.props.scene.is("entered") &&
      !isStatic &&
      this.props.hubChannel &&
      this.props.hubChannel.can("pin_objects") &&
      !!(fileIsOwned || (fileId && getPromotionTokenForFile(fileId)));
    const showPinButton = showPinOrUnpin && !pinned;
    const showUnpinButton = showPinOrUnpin && pinned;
    const showRemoveButton =
      this.props.scene.is("entered") &&
      !pinned &&
      !isStatic &&
      this.props.hubChannel &&
      this.props.hubChannel.can("spawn_and_move_media");

    const isSmallScreen =
      window.APP.store.state.preferences.preferMobileObjectInfoPanel ||
      AFRAME.utils.device.isMobile() ||
      window.innerHeight < 800;
    if (isSmallScreen) {
      let targetIndex = this.state.mediaEntities.indexOf(this.props.el) % this.state.mediaEntities.length;
      targetIndex = targetIndex === -1 ? this.state.mediaEntities.length - 1 : targetIndex;
      return this.renderSmallScreen(
        targetIndex,
        this.props.el,
        this.state.mediaEntities,
        showNavigationButtons,
        showGoToButton,
        showPinButton,
        showUnpinButton,
        showRemoveButton,
        onClose
      );
    }

    return (
      <DialogContainer noOverlay={true} wide={true} {...this.props}>
        <div className={cStyles.roomInfo}>
          <div className={cStyles.titleAndClose}>
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
            <a className={cStyles.objectDisplayString} href={this.props.src} target="_blank" rel="noopener noreferrer">
              <FormattedMessage id={`object-info.open-link`} />
            </a>
          </div>
          <div className={cStyles.actionButtonSections}>
            <div className={cStyles.leftActionButtons}>
              {showNavigationButtons && (
                <button aria-label="Previous Object" className={cStyles.navigationButton} onClick={this.navigatePrev}>
                  <i>
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </i>
                </button>
              )}
            </div>
            <div className={cStyles.primaryActionButtons}>
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
                <div className={cStyles.actionButtonPlaceholder} />
              )}
              {showPinOrUnpin && (
                <button className={pinned ? "" : cStyles.primaryActionButton} onClick={pinned ? this.unpin : this.pin}>
                  <FormattedMessage id={`object-info.${pinned ? "unpin-button" : "pin-button"}`} />
                </button>
              )}
              <a className={cStyles.cancelText} href="#" onClick={onClose}>
                <FormattedMessage id="client-info.cancel" />
              </a>
            </div>
            <div className={cStyles.rightActionButtons}>
              {showNavigationButtons && (
                <button aria-label="Next Object" className={cStyles.navigationButton} onClick={this.navigateNext}>
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

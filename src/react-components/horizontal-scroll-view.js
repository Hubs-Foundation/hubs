import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import oStyles from "../assets/stylesheets/object-info-dialog.scss";
import { mediaSortOrder, DISPLAY_IMAGE } from "../utils/media-sorting";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ICON_WIDTH = 60;
const HALF_ICON_WIDTH = 60 / 2;

function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

function NavigationRowItem(props) {
  const { isHandlingTouchInteraction, entity, isSelected, navigateTo } = props;
  return (
    <button
      className={classNames(oStyles.noDefaultButtonStyle, oStyles.innerNavigationRowItem)}
      onClick={() => {
        if (isHandlingTouchInteraction) {
          return;
        }
        navigateTo(entity);
      }}
      key={`nav-row-item-${entity.object3D.uuid}`}
    >
      <i className={oStyles.flex}>
        <FontAwesomeIcon
          className={classNames(oStyles.navigationRowItem, { [oStyles.selected]: isSelected })}
          icon={DISPLAY_IMAGE.get(mediaSortOrder(entity))}
        />
      </i>
    </button>
  );
}
NavigationRowItem.propTypes = {
  isHandlingTouchInteraction: PropTypes.bool,
  entity: PropTypes.object,
  isSelected: PropTypes.bool,
  navigateTo: PropTypes.func
};

function clampToIndex(x, numItems) {
  return clamp(Math.floor(x), 0, numItems - 1);
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function buttonIndexAtTouchX(navAreaRef, mediaEntities, touchX, currentLeftOffset) {
  const TOTAL_WIDTH_OF_NAV_ITEMS = ICON_WIDTH * mediaEntities.length;
  const AVAILABLE_WIDTH_FOR_NAV_ITEMS =
    (navAreaRef && navAreaRef.current && parseInt(window.getComputedStyle(navAreaRef.current).width)) ||
    window.innerWidth - 120;
  if (!navAreaRef || !navAreaRef.current) {
    console.warn("No navAreaRef!");
  }
  const ACTUAL_WIDTH_OF_NAV_ITEMS = Math.min(AVAILABLE_WIDTH_FOR_NAV_ITEMS, TOTAL_WIDTH_OF_NAV_ITEMS);

  const CENTER_PIXEL = window.innerWidth / 2;
  const FIRST_PIXEL = CENTER_PIXEL - ACTUAL_WIDTH_OF_NAV_ITEMS / 2;
  const ICONS_ON_SCREEN = ACTUAL_WIDTH_OF_NAV_ITEMS / ICON_WIDTH;

  const LEFT_OFFSET_FOR_ZEROTH_ITEM = AVAILABLE_WIDTH_FOR_NAV_ITEMS / 2 - HALF_ICON_WIDTH;
  const LEFT_OFFSET_FOR_LAST_ITEM = LEFT_OFFSET_FOR_ZEROTH_ITEM - ICON_WIDTH * (mediaEntities.length - 1);
  const LEFT_OFFSET_RANGE = LEFT_OFFSET_FOR_LAST_ITEM - LEFT_OFFSET_FOR_ZEROTH_ITEM;
  const leftOffsetZeroToOne = clamp((currentLeftOffset - LEFT_OFFSET_FOR_ZEROTH_ITEM) / LEFT_OFFSET_RANGE, 0, 1);
  const CENTER_ICON_UNFLOORED = leftOffsetZeroToOne * (mediaEntities.length - 1);
  const FIRST_ICON_UNFLOORED = CENTER_ICON_UNFLOORED - ICONS_ON_SCREEN / 2;
  const LAST_ICON_UNFLOORED = CENTER_ICON_UNFLOORED + ICONS_ON_SCREEN / 2;

  const touchXInNavItemList = touchX - FIRST_PIXEL;
  const touchZeroToOne = clamp((touchX - FIRST_PIXEL) / ACTUAL_WIDTH_OF_NAV_ITEMS, 0, 1);

  const approximateIndex =
    TOTAL_WIDTH_OF_NAV_ITEMS <= AVAILABLE_WIDTH_FOR_NAV_ITEMS
      ? lerp(0, mediaEntities.length, touchXInNavItemList / TOTAL_WIDTH_OF_NAV_ITEMS)
      : lerp(FIRST_ICON_UNFLOORED, LAST_ICON_UNFLOORED + 1, touchZeroToOne);

  return clampToIndex(approximateIndex, mediaEntities.length);
}

export class HorizontalScrollView extends Component {
  static propTypes = {
    selectedEl: PropTypes.object,
    onWheel: PropTypes.func,
    navigateTo: PropTypes.func,
    mediaEntities: PropTypes.array,
    targetIndex: PropTypes.number
  };

  state = {
    isDragging: false,
    touchX: null,
    initialTouchX: null,
    currentLeftOffset: 0,
    initialLeftOffset: 0,
    isHandlingTouchInteraction: false
  };

  componentDidMount() {
    this.navAreaRef = React.createRef();
  }

  render() {
    const { selectedEl, onWheel, navigateTo, mediaEntities, targetIndex } = this.props;
    const AVAILABLE_WIDTH_FOR_NAV_ITEMS =
      (this.navAreaRef &&
        this.navAreaRef.current &&
        parseInt(window.getComputedStyle(this.navAreaRef.current).width)) ||
      window.innerWidth - 120;
    if (!this.navAreaRef || !this.navAreaRef.current) {
      console.warn("no nav area ref yet");
    }
    const TOTAL_WIDTH_OF_NAV_ITEMS = ICON_WIDTH * mediaEntities.length;
    const DISTANCE_TO_CENTER = -1 * HALF_ICON_WIDTH + AVAILABLE_WIDTH_FOR_NAV_ITEMS / 2;
    const willScrollContent = TOTAL_WIDTH_OF_NAV_ITEMS > AVAILABLE_WIDTH_FOR_NAV_ITEMS;
    const UNLOCKED_LEFT_OFFSET = this.state.currentLeftOffset;
    const LOCKED_LEFT_OFFSET = DISTANCE_TO_CENTER - ICON_WIDTH * targetIndex;
    const DRAG_WIDTH_PX = HALF_ICON_WIDTH;

    return (
      <div
        ref={this.navAreaRef}
        className={oStyles.innerNavigationRowContainer}
        style={{ justifyContent: willScrollContent ? "unset" : "center" }}
        onWheel={onWheel}
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
            navigateTo(mediaEntities[buttonIndexAtTouchX(this.navAreaRef, mediaEntities, touchX, currentLeftOffset)]);
          }
        }}
        onTouchMove={e => {
          const touchX = e.touches.item(0).clientX;
          if (!willScrollContent) {
            navigateTo(
              mediaEntities[buttonIndexAtTouchX(this.navAreaRef, mediaEntities, touchX, this.state.currentLeftOffset)]
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
              navigateTo(
                mediaEntities[buttonIndexAtTouchX(this.navAreaRef, mediaEntities, CENTER_PIXEL, currentLeftOffset)]
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
            navigateTo(
              mediaEntities[
                buttonIndexAtTouchX(this.navAreaRef, mediaEntities, this.state.touchX, this.state.currentLeftOffset)
              ]
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
                    transitionDuration: "0.25s",
                    transitionTimingFunction: "ease-out"
                  }
              : {}
          }
        >
          {mediaEntities.map(e => {
            return (
              <NavigationRowItem
                isHandlingTouchInteraction={this.state.isHandlingTouchInteraction}
                entity={e}
                isSelected={e === selectedEl}
                navigateTo={navigateTo}
                key={`${e.object3D.uuid}_nav-row-item`}
              />
            );
          })}
        </div>
      </div>
    );
  }
}

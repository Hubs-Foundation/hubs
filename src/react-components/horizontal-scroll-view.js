import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import oStyles from "../assets/stylesheets/object-info-dialog.scss";
import { mediaSortOrder, DISPLAY_IMAGE } from "../utils/media-sorting";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

function NavigationRowItem(props) {
  const { onClick, icon, isSelected } = props;
  return (
    <button className={classNames(oStyles.noDefaultButtonStyle, oStyles.innerNavigationRowItem)} onClick={onClick}>
      <i className={oStyles.flex}>
        <FontAwesomeIcon
          className={classNames(oStyles.navigationRowItem, { [oStyles.selected]: isSelected })}
          icon={icon}
        />
      </i>
    </button>
  );
}
NavigationRowItem.propTypes = {
  onClick: PropTypes.func,
  icon: PropTypes.object,
  isSelected: PropTypes.bool
};

function clampToIndex(x, numItems) {
  return clamp(Math.floor(x), 0, numItems - 1);
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function buttonIndexAtTouchX(navAreaRef, numItems, touchX, currentLeftOffset, itemWidth) {
  const widthOfAllItems = itemWidth * numItems;
  const scrollviewWidth =
    (navAreaRef && navAreaRef.current && parseInt(window.getComputedStyle(navAreaRef.current).width)) ||
    window.innerWidth - 120;
  if (!navAreaRef || !navAreaRef.current) {
    console.warn("No navAreaRef!");
  }
  const effectiveWidth = Math.min(scrollviewWidth, widthOfAllItems);

  const CENTER_PIXEL = window.innerWidth / 2;
  const FIRST_PIXEL = CENTER_PIXEL - effectiveWidth / 2;
  const ICONS_ON_SCREEN = effectiveWidth / itemWidth;

  const halfItemWidth = itemWidth / 2;
  const LEFT_OFFSET_FOR_ZEROTH_ITEM = scrollviewWidth / 2 - halfItemWidth;
  const LEFT_OFFSET_FOR_LAST_ITEM = LEFT_OFFSET_FOR_ZEROTH_ITEM - itemWidth * (numItems - 1);
  const LEFT_OFFSET_RANGE = LEFT_OFFSET_FOR_LAST_ITEM - LEFT_OFFSET_FOR_ZEROTH_ITEM;
  const leftOffsetZeroToOne = clamp((currentLeftOffset - LEFT_OFFSET_FOR_ZEROTH_ITEM) / LEFT_OFFSET_RANGE, 0, 1);
  const CENTER_ICON_UNFLOORED = leftOffsetZeroToOne * (numItems - 1);
  const FIRST_ICON_UNFLOORED = CENTER_ICON_UNFLOORED - ICONS_ON_SCREEN / 2;
  const LAST_ICON_UNFLOORED = CENTER_ICON_UNFLOORED + ICONS_ON_SCREEN / 2;

  const touchXInNavItemList = touchX - FIRST_PIXEL;
  const touchZeroToOne = clamp((touchX - FIRST_PIXEL) / effectiveWidth, 0, 1);

  const approximateIndex =
    widthOfAllItems <= scrollviewWidth
      ? lerp(0, numItems, touchXInNavItemList / widthOfAllItems)
      : lerp(FIRST_ICON_UNFLOORED, LAST_ICON_UNFLOORED + 1, touchZeroToOne);

  return clampToIndex(approximateIndex, numItems);
}

export class HorizontalScrollView extends Component {
  static propTypes = {
    selectedEl: PropTypes.object,
    onWheel: PropTypes.func,
    mediaEntities: PropTypes.array,
    targetIndex: PropTypes.number,
    itemWidth: PropTypes.number,
    onItemSelected: PropTypes.func
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
    const { itemWidth, selectedEl, onWheel, mediaEntities, targetIndex, onItemSelected } = this.props;
    const halfItemWidth = itemWidth / 2;
    const numItems = mediaEntities.length;
    const scrollviewWidth =
      (this.navAreaRef &&
        this.navAreaRef.current &&
        parseInt(window.getComputedStyle(this.navAreaRef.current).width)) ||
      window.innerWidth - 120;
    if (!this.navAreaRef || !this.navAreaRef.current) {
      console.warn("no nav area ref yet");
    }
    const widthOfAllItems = itemWidth * numItems;
    const DISTANCE_TO_CENTER = -1 * halfItemWidth + scrollviewWidth / 2;
    const willScrollContent = widthOfAllItems > scrollviewWidth;
    const UNLOCKED_LEFT_OFFSET = this.state.currentLeftOffset;
    const LOCKED_LEFT_OFFSET = DISTANCE_TO_CENTER - itemWidth * targetIndex;
    const DRAG_WIDTH_PX = halfItemWidth;

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
            onItemSelected(buttonIndexAtTouchX(this.navAreaRef, numItems, touchX, currentLeftOffset, itemWidth));
          }
        }}
        onTouchMove={e => {
          const touchX = e.touches.item(0).clientX;
          if (!willScrollContent) {
            onItemSelected(
              buttonIndexAtTouchX(this.navAreaRef, numItems, touchX, this.state.currentLeftOffset, itemWidth)
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
              onItemSelected(
                buttonIndexAtTouchX(this.navAreaRef, numItems, CENTER_PIXEL, currentLeftOffset, itemWidth)
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
            onItemSelected(
              buttonIndexAtTouchX(this.navAreaRef, numItems, this.state.touchX, this.state.currentLeftOffset, itemWidth)
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
          {mediaEntities.map((entity, i) => {
            return (
              <NavigationRowItem
                onClick={() => {
                  if (this.state.isHandlingTouchInteraction) {
                    return;
                  }
                  onItemSelected(i);
                }}
                icon={DISPLAY_IMAGE.get(mediaSortOrder(entity))}
                isSelected={entity === selectedEl}
                key={`${entity.object3D.uuid}_nav-row-item`}
              />
            );
          })}
        </div>
      </div>
    );
  }
}

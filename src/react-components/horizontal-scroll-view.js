import React, { Component } from "react";
import PropTypes from "prop-types";
import oStyles from "../assets/stylesheets/object-info-dialog.scss";

function getWidth(ref) {
  return (ref && ref.current && parseInt(window.getComputedStyle(ref.current).width)) || 0;
}

function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

function clampToIndex(x, numItems) {
  return clamp(Math.floor(x), 0, numItems - 1);
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function itemIndexAtXWithScroll(x, numItems, itemWidth, scrollviewWidth, currentLeftOffset) {
  const widthOfAllItems = itemWidth * numItems;
  const effectiveWidth = Math.min(scrollviewWidth, widthOfAllItems);
  const windowCenter = window.innerWidth / 2;
  const firstPixel = windowCenter - effectiveWidth / 2;
  const halfItemWidth = itemWidth / 2;
  const leftOffsetForZerothItem = scrollviewWidth / 2 - halfItemWidth;
  const leftOffsetForLastItem = leftOffsetForZerothItem - itemWidth * (numItems - 1);
  const leftOffsetRange = leftOffsetForLastItem - leftOffsetForZerothItem;
  const leftOffsetZeroToOne = clamp((currentLeftOffset - leftOffsetForZerothItem) / leftOffsetRange, 0, 1);
  const centerIconUnfloored = leftOffsetZeroToOne * (numItems - 1);
  const numIconsOnScreen = effectiveWidth / itemWidth;
  const firstIconUnfloored = centerIconUnfloored - numIconsOnScreen / 2;
  const lastIconUnfloored = centerIconUnfloored + numIconsOnScreen / 2;
  const touchZeroToOne = clamp((x - firstPixel) / effectiveWidth, 0, 1);
  const approximateIndex = lerp(firstIconUnfloored, lastIconUnfloored + 1, touchZeroToOne);
  return clampToIndex(approximateIndex, numItems);
}

function itemIndexAtXNoScroll(x, numItems, itemWidth) {
  const widthOfAllItems = numItems * itemWidth;
  const windowCenter = window.innerWidth / 2;
  const firstPixel = windowCenter - widthOfAllItems / 2;
  const xInNavItemList = x - firstPixel;
  const approximateIndex = lerp(0, numItems, xInNavItemList / widthOfAllItems);
  return clampToIndex(approximateIndex, numItems);
}

function itemIndexAtX(numItems, touchX, currentLeftOffset, itemWidth, scrollviewWidth) {
  const widthOfAllItems = numItems * itemWidth;
  const contentWillScroll = widthOfAllItems > scrollviewWidth;
  if (contentWillScroll) {
    return itemIndexAtXWithScroll(touchX, numItems, itemWidth, scrollviewWidth, currentLeftOffset);
  } else {
    return itemIndexAtXNoScroll(touchX, numItems, itemWidth);
  }
}

export class HorizontalScrollView extends Component {
  static propTypes = {
    selectedEl: PropTypes.object,
    onWheel: PropTypes.func,
    numItems: PropTypes.number,
    targetIndex: PropTypes.number,
    itemWidth: PropTypes.number,
    onItemSelected: PropTypes.func,
    children: PropTypes.node
  };

  state = {
    isDragging: false,
    touchX: null,
    initialTouchX: null,
    currentLeftOffset: 0,
    initialLeftOffset: 0,
    isHandlingTouchInteraction: false
  };

  constructor(props) {
    super(props);
    this.navAreaRef = React.createRef();
  }

  render() {
    const { itemWidth, onWheel, numItems, targetIndex, onItemSelected } = this.props;
    const halfItemWidth = itemWidth / 2;
    const widthOfAllItems = itemWidth * numItems;
    const scrollviewWidth = getWidth(this.navAreaRef);
    const contentWillScroll = widthOfAllItems > scrollviewWidth;
    const offsetToCenter = -1 * halfItemWidth + scrollviewWidth / 2;
    const lockedLeftOffset = offsetToCenter - itemWidth * targetIndex;

    return (
      <div
        ref={this.navAreaRef}
        className={oStyles.innerNavigationRowContainer}
        style={{ justifyContent: contentWillScroll ? "unset" : "center" }}
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
          if (!contentWillScroll) {
            const itemIndex = itemIndexAtX(numItems, touchX, currentLeftOffset, itemWidth, scrollviewWidth);
            onItemSelected(itemIndex);
          }
        }}
        onTouchMove={e => {
          const touchX = e.touches.item(0).clientX;
          if (!contentWillScroll) {
            const itemIndex = itemIndexAtX(numItems, touchX, this.state.currentLeftOffset, itemWidth, scrollviewWidth);
            onItemSelected(itemIndex);
            this.setState({ touchX });
          } else {
            const dX = touchX - this.state.initialTouchX;
            const isDragging = this.state.isDragging || Math.abs(dX) > halfItemWidth;
            if (isDragging) {
              const currentLeftOffset = this.state.initialLeftOffset + dX;

              this.setState({
                currentLeftOffset
              });

              const centerPixel = window.innerWidth / 2;
              const itemIndex = itemIndexAtX(numItems, centerPixel, currentLeftOffset, itemWidth, scrollviewWidth);
              onItemSelected(itemIndex);
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
            const itemIndex = itemIndexAtX(
              numItems,
              this.state.touchX,
              this.state.currentLeftOffset,
              itemWidth,
              scrollviewWidth
            );
            onItemSelected(itemIndex);
          }
        }}
      >
        <div
          className={oStyles.innerNavigationRow}
          style={
            contentWillScroll
              ? this.state.isDragging
                ? {
                    left: `${this.state.currentLeftOffset}px`
                  }
                : {
                    left: `${lockedLeftOffset}px`,
                    transitionProperty: "left",
                    transitionDuration: "0.25s",
                    transitionTimingFunction: "ease-out"
                  }
              : {}
          }
        >
          {React.Children.map(this.props.children, (child, index) => {
            return React.cloneElement(child, {
              onClick: () => {
                if (this.state.isHandlingTouchInteraction) {
                  return;
                }
                onItemSelected(index);
              }
            });
          })}
        </div>
      </div>
    );
  }
}

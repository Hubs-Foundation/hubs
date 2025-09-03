import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";

const styles = () => ({
  scrollWrapper: {
    position: "relative",
    height: "100vh",
    overflow: "hidden"
  },
  scrollContent: {
    height: "100%",
    overflowY: "auto",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    "&::-webkit-scrollbar": {
      display: "none"
    }
  },
  scrollIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(to transparent, rgba(34, 34, 34, 0.8))",
    color: "#aaaaaa",
    pointerEvents: "none",
    zIndex: 10,
    transition: "opacity 0.3s ease"
  },
  topIndicator: {
    top: 0,
    background: "linear-gradient(to bottom, rgba(34, 34, 34, 0.9) 0%, rgba(34, 34, 34, 0.7) 70%, transparent 100%)"
  },
  bottomIndicator: {
    bottom: 0,
    background: "linear-gradient(to top, rgba(34, 34, 34, 0.9) 0%, rgba(34, 34, 34, 0.7) 70%, transparent 100%)"
  },
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1
  }
});

class ScrollableMenuWrapper extends Component {
  static propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      showTopIndicator: false,
      showBottomIndicator: false
    };
    this.scrollRef = React.createRef();
  }

  componentDidMount() {
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => {
      this.checkScrollIndicators();
    }, 100);
    window.addEventListener("resize", this.checkScrollIndicators);
  }

  componentDidUpdate() {
    // Check again after any updates
    setTimeout(() => {
      this.checkScrollIndicators();
    }, 100);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.checkScrollIndicators);
  }

  checkScrollIndicators = () => {
    const element = this.scrollRef.current;
    if (!element) return;

    const { scrollTop, scrollHeight, clientHeight } = element;

    // More precise detection - show indicators if there's content to scroll to
    const canScrollUp = scrollTop > 5;
    const canScrollDown = scrollTop + clientHeight < scrollHeight - 5;

    // Only show indicators if content actually overflows
    const hasOverflow = scrollHeight > clientHeight;

    const showTopIndicator = hasOverflow && canScrollUp;
    const showBottomIndicator = hasOverflow && canScrollDown;

    this.setState({
      showTopIndicator,
      showBottomIndicator
    });
  };

  render() {
    const { classes, children } = this.props;
    const { showTopIndicator, showBottomIndicator } = this.state;

    return (
      <div className={classes.scrollWrapper}>
        <div ref={this.scrollRef} className={classes.scrollContent} onScroll={this.checkScrollIndicators}>
          {children}
        </div>
        <div
          className={`${classes.scrollIndicator} ${classes.topIndicator} ${
            showTopIndicator ? classes.visible : classes.hidden
          }`}
        >
          <KeyboardArrowUpIcon />
        </div>
        <div
          className={`${classes.scrollIndicator} ${classes.bottomIndicator} ${
            showBottomIndicator ? classes.visible : classes.hidden
          }`}
        >
          <KeyboardArrowDownIcon />
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(ScrollableMenuWrapper);

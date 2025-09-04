import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
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
  bottomIndicator: {
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "240px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(to top, rgba(34, 34, 34, 0.9) 0%, rgba(34, 34, 34, 0.7) 70%, transparent 100%)",
    color: "#aaaaaa",
    pointerEvents: "none",
    zIndex: 9999,
    transition: "opacity 0.5s ease",
    opacity: 1
  },
  hidden: {
    opacity: 0
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
      showBottomIndicator: true,
      hasScrolled: false
    };
    this.scrollRef = React.createRef();
  }

  componentDidMount() {
    // Check if we have overflow content
    this.checkOverflow();

    // Listen for window resize
    window.addEventListener("resize", this.checkOverflow);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.checkOverflow);
  }

  checkOverflow = () => {
    const element = this.scrollRef.current;
    if (element) {
      const hasOverflow = element.scrollHeight > element.clientHeight;
      if (!hasOverflow || this.state.hasScrolled) {
        // No overflow or already scrolled, hide the indicator
        this.setState({ showBottomIndicator: false });
      } else {
        // Has overflow and hasn't scrolled yet
        this.setState({ showBottomIndicator: true });
      }
    }
  };

  handleScroll = () => {
    // Hide the indicator on first scroll
    if (!this.state.hasScrolled) {
      this.setState({
        showBottomIndicator: false,
        hasScrolled: true
      });
    }
  };

  render() {
    const { classes, children } = this.props;
    const { showBottomIndicator } = this.state;

    return (
      <div className={classes.scrollWrapper}>
        <div ref={this.scrollRef} className={classes.scrollContent} onScroll={this.handleScroll}>
          {children}
        </div>
        <div className={`${classes.bottomIndicator} ${!showBottomIndicator ? classes.hidden : ""}`}>
          <KeyboardArrowDownIcon />
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(ScrollableMenuWrapper);

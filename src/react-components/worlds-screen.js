import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactComponent as CloseIcon } from "./icons/Close.svg";
import { faUndo } from "@fortawesome/free-solid-svg-icons/faUndo";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons/faExclamationTriangle";
import { FormattedMessage, injectIntl, useIntl, defineMessages } from "react-intl";
import styles from "../assets/stylesheets/worlds-screen.scss";
import world from "../assets/images/World.png";
import { defaultMaterialQualitySetting } from "../storage/store";
import { AVAILABLE_LOCALES } from "../assets/locales/locale_config";
import { themes } from "./styles/theme";

const CATEGORY_1 = 0;
const CATEGORY_2 = 1;
const CATEGORY_3 = 2;

const TOP_LEVEL_CATEGORIES = [CATEGORY_1, CATEGORY_2, CATEGORY_3];
const categoryNames = defineMessages({
  [CATEGORY_1]: { id: " worlds-screen.category.CATEGORY_1", defaultMessage: "Categories" },
  [CATEGORY_2]: { id: " worlds-screen.category.CATEGORY_2", defaultMessage: "Categories" },
  [CATEGORY_3]: { id: " worlds-screen.category.CATEGORY_3", defaultMessage: "Categories" }
});

const worldNames = defineMessages({
  World1: { id: " events-screen.name.world1", defaultMessage: "World Name" },
  World2: { id: " events-screen.name.world2", defaultMessage: "World Name" },
  World3: { id: " events-screen.name.world3", defaultMessage: "World Name" }
});

const worldDescription = defineMessages({
  World1: { id: " events-screen.description.world1", defaultMessage: "Three Word Description" },
  World2: { id: " events-screen.description.world2", defaultMessage: "Three Word Description" },
  World3: { id: " events-screen.description.world3", defaultMessage: "Three Word Description" }
});

function NavItem({ ariaLabel, title, onClick, selected }) {
  return (
    <button
      aria-label={ariaLabel}
      className={classNames(styles.navItem, { [styles.selected]: selected })}
      onClick={onClick}
    >
      {title}
    </button>
  );
}
NavItem.propTypes = {
  ariaLabel: PropTypes.string,
  title: PropTypes.string,
  onClick: PropTypes.func,
  selected: PropTypes.bool
};
function CloseButton({ onClick }) {
  const intl = useIntl();
  return (
    <button
      autoFocus
      aria-label={intl.formatMessage({
        id: "events-screen.close-button",
        defaultMessage: "Close Preferences Menu"
      })}
      className={classNames(styles.closeButton)}
      onClick={onClick}
    >
      <i className={styles.flex}>
        <CloseIcon />
      </i>
    </button>
  );
}
CloseButton.propTypes = {
  onClick: PropTypes.func
};

class Nav extends Component {
  render() {
    const { children } = this.props;
    return (
      <div className={styles.navContainer}>
        <div className={classNames(styles.nav)}>{children}</div>
      </div>
    );
  }
}
Nav.propTypes = {
  children: PropTypes.node.isRequired,
  selected: PropTypes.number
};

const Card = ({ src, defaultmessage, description }) => {
  const intl = useIntl();

  return (
    <>
      <div className={classNames(styles.scrollingItem)}>
        <img src={src} alt="not found" />
        <br />
        <p>9:00 EST - 10:00 EST</p>
        <p>
          <b>{intl.formatMessage(worldNames[defaultmessage])}</b>
        </p>
        <p>{intl.formatMessage(worldDescription[description])}</p>
      </div>
    </>
  );
};

class World extends Component {
  render() {
    const { children } = this.props;
    return (
      <>
        <Card src={world} defaultmessage="World1" description="World1" />
        <Card src={world} defaultmessage="World2" description="World2" />
        <Card src={world} defaultmessage="World3" description="World3" />
      </>
    );
  }
}

class WorldsScreen extends Component {
  static propTypes = {
    intl: PropTypes.object,
    onClose: PropTypes.func,
    store: PropTypes.object,
    scene: PropTypes.object
  };

  constructor() {
    // TODO: When this component is recreated it clears its state.
    // This happens several times as the page is loading.
    // We should either avoid remounting or persist the category somewhere besides state.
    super();

    this.mediaDevicesManager = window.APP.mediaDevicesManager;

    this.state = {
      category: CATEGORY_1
    };
  }

  render() {
    const intl = this.props.intl;

    return (
      <div className={classNames(styles.worldPanel)}>
        <CloseButton onClick={this.props.onClose} />

        <Nav selected={this.state.category}>
          {TOP_LEVEL_CATEGORIES.map(category => (
            <NavItem
              key={`category-${category}-header`}
              title={intl.formatMessage(categoryNames[category])}
              onClick={() => {
                this.setState({ category });
              }}
              ariaLabel={intl.formatMessage(
                { id: "worlds-screen.select-category ", defaultMessage: "Select category {categoryName}" },
                {
                  categoryName: intl.formatMessage(categoryNames[category])
                }
              )}
              selected={category === this.state.category}
            />
          ))}
        </Nav>
        <div className={styles.contentContainer}>
          <div className={styles.scrollingContent}>
            <World />
          </div>
        </div>
      </div>
    );
  }
}

export default injectIntl(WorldsScreen);

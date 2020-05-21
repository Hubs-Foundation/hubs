import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import en from "react-intl/locale-data/en";
import { IntlProvider, addLocaleData } from "react-intl";
import styles from "../assets/stylesheets/preferences-screen.scss";
import { lang, messages } from "../utils/i18n";
import { PreferenceListItem, PREFERENCE_LIST_ITEM_TYPE } from "./preference-list-item";

const isMobile = AFRAME.utils.device.isMobile() || AFRAME.utils.device.isMobileVR();
addLocaleData([...en]);

const CATEGORY_GENERAL = 0;
const CATEGORY_TOUCHSCREEN = 1;
const CATEGORY_ADVANCED = 2;
const CATEGORIES = [CATEGORY_GENERAL, CATEGORY_TOUCHSCREEN, CATEGORY_ADVANCED];
const CATEGORY_NAMES = new Map([
  [CATEGORY_GENERAL, "general"],
  [CATEGORY_TOUCHSCREEN, "touchscreen"],
  [CATEGORY_ADVANCED, "advanced"]
]);

function titleFor(categoryName) {
  return messages[`preferences.${categoryName}`];
}

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
  return (
    <button
      autoFocus
      aria-label={messages["preferences.closeButton"]}
      className={classNames(styles.closeButton)}
      onClick={onClick}
    >
      <i className={styles.flex}>
        <FontAwesomeIcon className={styles.icon} icon={faTimes} />
      </i>
    </button>
  );
}
CloseButton.propTypes = {
  onClick: PropTypes.func
};

const general = [
  { key: "muteMicOnEntry", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  { key: "onlyShowNametagsInFreeze", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  {
    key: "globalVoiceVolume",
    prefType: PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE,
    min: 0,
    max: 200,
    step: 5,
    digits: 0,
    defaultNumber: 100
  },
  {
    key: "globalMediaVolume",
    prefType: PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE,
    min: 0,
    max: 200,
    step: 5,
    digits: 0,
    defaultNumber: 100
  },
  { key: "disableSoundEffects", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  {
    key: "snapRotationDegrees",
    prefType: PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE,
    min: 0,
    max: 90,
    step: 5,
    digits: 0,
    defaultNumber: 45
  },
  { key: "disableMovement", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  { key: "disableBackwardsMovement", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  { key: "disableStrafing", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  { key: "disableTeleporter", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  {
    key: "movementSpeedModifier",
    prefType: PREFERENCE_LIST_ITEM_TYPE.NUMBER_WITH_RANGE,
    min: 0,
    max: 2,
    step: 0.1,
    digits: 1,
    defaultNumber: 1
  }
];
const touchscreen = [
  { key: "enableOnScreenJoystickLeft", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  { key: "enableOnScreenJoystickRight", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false }
];

const advanced = [
  { key: "maxResolution", prefType: PREFERENCE_LIST_ITEM_TYPE.MAX_RESOLUTION },
  {
    key: "materialQualitySetting",
    prefType: PREFERENCE_LIST_ITEM_TYPE.SELECT,
    options: [{ value: "low", text: "Low" }, { value: "high", text: "High" }],
    defaultString: isMobile ? "low" : "high"
  },
  { key: "disableAutoPixelRatio", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  { key: "allowMultipleHubsInstances", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  { key: "disableIdleDetection", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  { key: "preferMobileObjectInfoPanel", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  { key: "disableEchoCancellation", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  { key: "disableNoiseSuppression", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false },
  { key: "disableAutoGainControl", prefType: PREFERENCE_LIST_ITEM_TYPE.CHECK_BOX, defaultBool: false }
];

export default class PreferencesScreen extends Component {
  static propTypes = {
    onClose: PropTypes.func,
    store: PropTypes.object
  };

  state = {
    category: CATEGORY_GENERAL
  };

  constructor(props) {
    super();

    const item = itemProps => <PreferenceListItem store={props.store} storeKey={itemProps.key} {...itemProps} />;
    this.items = new Map([
      [CATEGORY_GENERAL, general.map(item)],
      [CATEGORY_TOUCHSCREEN, touchscreen.map(item)],
      [CATEGORY_ADVANCED, advanced.map(item)]
    ]);
  }

  componentDidMount() {
    window.APP.preferenceScreenIsVisible = true;
  }
  componentWillUnmount() {
    window.APP.preferenceScreenIsVisible = false;
  }

  render() {
    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className={classNames(styles.preferencesPanel)}>
          <CloseButton onClick={this.props.onClose} />
          <div className={styles.navContainer}>
            <div className={classNames(styles.nav)}>
              {CATEGORIES.map(category => (
                <NavItem
                  key={`category-${category}-header`}
                  title={titleFor(CATEGORY_NAMES.get(category))}
                  onClick={() => {
                    this.setState({ category });
                  }}
                  ariaLabel={`${messages["preferences.selectCategory"]} ${titleFor(CATEGORY_NAMES.get(category))}`}
                  selected={category === this.state.category}
                />
              ))}
            </div>
          </div>
          <div className={classNames(styles.contentContainer)}>
            <div className={classNames(styles.scrollingContent)}>{this.items.get(this.state.category)}</div>
          </div>
        </div>
      </IntlProvider>
    );
  }
}

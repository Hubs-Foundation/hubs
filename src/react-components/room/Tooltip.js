import React, { useMemo, memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Tooltip.scss";
import configs from "../../utils/configs";
import { useIntl, defineMessages } from "react-intl";
import { Button } from "../input/Button";
import { IconButton } from "../input/IconButton";
import { ReactComponent as InviteIcon } from "../icons/Invite.svg";
import { ReactComponent as MoreIcon } from "../icons/More.svg";

// These keys are hardcoded in the input system to be based on the physical location on the keyboard rather than character
let moveKeyFront = "W";
let moveKeyLeft = "A";
let moveKeyBack = "S";
let moveKeyRight = "D";
let turnLeftKey = "Q";
let turnRightKey = "E";
let tabKey = "Tab";

// TODO The API to map from physical key to character is experimental. Depending on prospects of this getting wider
// implementation we may want to cook up our own polyfill based on observing key inputs
if (window.navigator.keyboard !== undefined && window.navigator.keyboard.getLayoutMap) {
  window.navigator.keyboard
    .getLayoutMap()
    .then(function (map) {
      moveKeyFront = `${map.get("KeyW")}`.toUpperCase();
      moveKeyLeft = `${map.get("KeyA")}`.toUpperCase();
      moveKeyBack = `${map.get("KeyS")}`.toUpperCase();
      moveKeyRight = `${map.get("KeyD")}`.toUpperCase();
      turnLeftKey = map.get("KeyQ")?.toUpperCase();
      turnRightKey = map.get("KeyE")?.toUpperCase();
    })
    .catch(function (e) {
      // This occurs on Chrome 93 when the Hubs page is in an iframe
      console.warn(`Unable to remap keyboard: ${e}`);
    });
}

const onboardingMessages = defineMessages({
  "tips.welcome": {
    id: "tips.welcome",
    defaultMessage:
      "<h2>Welcome to {appName}</h2><p>Let's take a quick look to get comfortable with the controls</p>"
  },
  "tips.mobile.locomotion": {
    id: "tips.mobile.locomotion",
    defaultMessage: "<p>Move around by spreading or pinching with two fingers, or with the left on-screen joystick.</p>"
  },
  "tips.mobile.turning": {
    id: "tips.mobile.turning",
    defaultMessage: "<p>To look around, tap and drag, or use the right on-screen joystick.</p>"
  },
  "tips.mobile.defense": {
    id: "tips.mobile.defense",
    defaultMessage: "<p>If you find an avatar being a nuisance</p><p>or too loud or soft,</p><ol><li>do a two-finger tap to open the menu on their avatar,</li><li>then tap the {hide} button or the volume buttons on their avatar.</li></ol>"
  },
  "tips.mobile.invite": {
    id: "tips.mobile.invite",
    defaultMessage: "<p>No one else is here.</p><p>Tap the {invite} button in the lower left or select Invite from the {menu} menu to share this room.</p>"
  },
  "tips.desktop.locomotion": {
    id: "tips.desktop.locomotion",
    defaultMessage: "<p>Move around with</p>{wasd} or {arrows}<p>Hold Shift to run.</p>"
  },
  "tips.desktop.turning": {
    id: "tips.desktop.turning",
    defaultMessage: "<p>Use {turnLeftKey} or {turnRightKey} or click and drag to look around.</p>"
  },
  "tips.desktop.defense": {
    id: "tips.desktop.defense",
    defaultMessage: "<p>If you find an avatar being a nuisance</p><p>or too loud or soft,</p><ol><li>press {tab} to open the menu on their avatar,</li><li>then click the {hide} button or the volume buttons on their avatar.</li></ol>"
  },
  "tips.desktop.invite": {
    id: "tips.desktop.invite",
    defaultMessage: "<p>No one else is here.</p><p>Use the {invite} button in the lower left to share this room</p>"
  },
  "tips.standalone.locomotion": {
    id: "tips.standalone.locomotion",
    defaultMessage: "<p>Move around with the left joystick.</p><p>Hold down {B} or {Y} on a controller to run.</p>"
  },
  "tips.standalone.turning": {
    id: "tips.standalone.turning",
    defaultMessage: "Look around using your head or the right joystick."
  },
  "tips.standalone.defense": {
    id: "tips.standalone.defense",
    defaultMessage: "<p>If you find an avatar being a nuisance</p><p>or too loud or soft,</p><ol><li>hold down {A} or {X} on a controller to open the menu on their avatar,</li><li>then tap the {hide} button or the volume buttons on their avatar.</li></ol>"
  },
  "tips.standalone.invite": {
    id: "tips.standalone.invite",
    defaultMessage: "<p>No one else is here.</p><p>To share this room, exit VR then click the {invite} button in the lower left.</p>"
  },
  "tips.end": {
    id: "tips.end",
    defaultMessage: "<p>Tutorial completed! Have fun exploring</p>"
  },
  "tips.menu": {
    id: "tips.menu",
    defaultMessage: "<p>Access the tour from the {menu} menu</p>"
  },
  "tips.buttons.get-started": {
    id: "tips.buttons.get-started",
    defaultMessage: "Get started"
  },
  "tips.buttons.skip-tour": {
    id: "tips.buttons.skip-tour",
    defaultMessage: "Skip tour"
  },
  "tips.buttons.done": {
    id: "tips.buttons.done",
    defaultMessage: "Done"
  },
  "more-menu-popover.title": {
    id: "more-menu-popover.title",
    defaultMessage: "More"
  },
  "object-menu.hide-avatar-button": {
    id: "object-menu.hide-avatar-button",
    defaultMessage: "Hide"
  },
  "invite-popover.title": {
    id: "invite-popover.title",
    defaultMessage: "Invite"
  }
});

function isStep(step, item) {
  return step.indexOf(item) !== -1;
}

function maxSteps(step) {
  return isStep(step, "desktop") ? 4 : (isStep(step, "mobile") ? 4 : 4);
}

function Key({ children }) {
  return <span className={styles.key}>{children}</span>;
}

Key.propTypes = {
  children: PropTypes.node
};

function InlineButton({ icon, text }) {
  return (
    <span className={styles.inlineButton}>
      {icon}
      {text}
    </span>
  );
}

InlineButton.propTypes = {
  icon: PropTypes.node,
  text: PropTypes.string
};

function InlineIcon({ icon }) {
  return <span className={styles.inlineIcon}>{icon}</span>;
}

InlineIcon.propTypes = {
  icon: PropTypes.node
};

function MoveKeys({ up, left, down, right }) {
  return (
    <div className={styles.desktopMoveContainer}>
      <div>
        <Key>{up}</Key>
      </div>
      <div>
        <Key>{left}</Key>
        <Key>{down}</Key>
        <Key>{right}</Key>
      </div>
    </div>
  );
}

MoveKeys.propTypes = {
  up: PropTypes.node,
  left: PropTypes.node,
  down: PropTypes.node,
  right: PropTypes.node
};

function Step({ step, params }) {
  const intl = useIntl();
  return <>{intl.formatMessage(onboardingMessages[step], params)}</>;
}

Step.propTypes = {
  step: PropTypes.string,
  params: PropTypes.object
};

function WelcomeNavigationBar({ onNext, onDismiss }) {
  const intl = useIntl();
  return (
    <div className={styles.navigationContainer}>
      <Button preset="primary" onClick={onNext}>
        {intl.formatMessage(onboardingMessages["tips.buttons.get-started"])}
      </Button>
      <Button preset="basic" onClick={onDismiss}>
        {intl.formatMessage(onboardingMessages["tips.buttons.skip-tour"])}
      </Button>
    </div>
  );
}

WelcomeNavigationBar.propTypes = {
  onNext: PropTypes.func,
  onDismiss: PropTypes.func
};

function StepNavigationBar({ step, onPrev, onNext, params }) {
  const intl = useIntl();
  const { currentStep } = params;
  const leftArrow = currentStep !== 0;
  const rightArrow = currentStep !== maxSteps(step) - 1;
  return (
    <div className={styles.navigationContainer}>
      <IconButton as={"span"} className={classNames(styles.arrows, !leftArrow && styles.arrowsHidden)} onClick={onPrev}>
        {"<"}
      </IconButton>
      <div style={{ display: "flex", justifyContent: "space-between", width: "75px" }}>
        {[...Array(maxSteps(step))].map((v, i) => {
          return <span key={i} className={classNames(styles.dot, i === currentStep && styles.dotEnabled)}></span>;
        })}
      </div>
      {rightArrow ? (
        <IconButton as={"span"} className={styles.arrows} onClick={onNext}>
          {">"}
        </IconButton>
      ) : (
        <Button className={styles.endButton} preset={"text"} onClick={onNext}>
          {intl.formatMessage(onboardingMessages["tips.buttons.done"])}
        </Button>
      )}
    </div>
  );
}

StepNavigationBar.propTypes = {
  step: PropTypes.string,
  onPrev: PropTypes.func,
  onNext: PropTypes.func,
  params: PropTypes.object
};

function onboardingSteps({ intl, step }) {
  switch (step) {
    case "tips.desktop.welcome":
    case "tips.mobile.welcome":
    case "tips.standalone.welcome":
      return {
        control: {
          type: Step,
          params: {
            h2: chunks => <h2>{chunks}</h2>,
            p: chunks => <p style={{ width: "100%" }}>{chunks}</p>,
            p2: chunks => <p style={{ width: "100%" }}>{chunks}</p>,
            appName: configs.translation("app-name")
          },
          messageId: "tips.welcome"
        },
        navigationBar: {
          type: WelcomeNavigationBar
        }
      };
    case "tips.desktop.locomotion":
      return {
        control: {
          type: Step,
          params: {
            p: chunks => <p style={{ width: "100%" }}>{chunks}</p>,
            wasd: <MoveKeys up={moveKeyFront} left={moveKeyLeft} down={moveKeyBack} right={moveKeyRight} />,
            arrows: <MoveKeys up={"↑"} left={"←"} down={"↓"} right={"→"} />
          }
        },
        navigationBar: {
          type: StepNavigationBar,
          params: {
            currentStep: 0
          }
        }
      };
    case "tips.desktop.turning":
      return {
        control: {
          type: Step,
          params: {
            p: chunks => <p style={{ width: "100%" }}>{chunks}</p>,
            turnLeftKey: <Key>{turnLeftKey}</Key>,
            turnRightKey: <Key>{turnRightKey}</Key>
          }
        },
        navigationBar: {
          type: StepNavigationBar,
          params: {
            currentStep: 1
          }
        }
      };
    case "tips.desktop.defense":
    case "tips.mobile.defense":
    case "tips.standalone.defense":
      return {
        control: {
          type: Step,
          params: {
            p: chunks => <p style={{ width: "100%" }}>{chunks}</p>,
            ol: chunks => <ol style={{ width: "100%" }}>{chunks}</ol>,
            li: chunks => <li style={{ width: "100%" }}>{chunks}</li>,
            tab: <Key>{tabKey}</Key>,
            hide: (
              <InlineButton text={intl.formatMessage(onboardingMessages["object-menu.hide-avatar-button"])} />
            ),
            A: (<InlineButton text="A" />),
            X: (<InlineButton text="X" />)
          }
        },
        navigationBar: {
          type: StepNavigationBar,
          params: {
            currentStep: 2
          }
        }
      };
    case "tips.desktop.invite":
    case "tips.mobile.invite":
    case "tips.standalone.invite":
      return {
        control: {
          type: Step,
          params: {
            invite: (
              <InlineButton icon={<InviteIcon />} text={intl.formatMessage(onboardingMessages["invite-popover.title"])} />
            ),
            menu: <InlineButton icon={<MoreIcon />} />,
            p: chunks => <p style={{ width: "100%" }}>{chunks}</p>,
            p2: chunks => <p style={{ width: "100%" }}>{chunks}</p>
          }
        },
        navigationBar: {
          type: StepNavigationBar,
          params: {
            currentStep: 3
          }
        }
      };
    case "tips.desktop.menu":
    case "tips.standalone.menu":
      return {
        control: {
          type: Step,
          params: {
            p: chunks => <p style={{ width: "100%" }}>{chunks}</p>,
            menu: <InlineButton icon={<MoreIcon />} text={intl.formatMessage(onboardingMessages["more-menu-popover.title"])} />
          },
          messageId: "tips.menu"
        }
      };
    case "tips.mobile.locomotion":
    case "tips.standalone.locomotion":
      return {
        control: {
          type: Step,
          params: {
            p: chunks => <p style={{ width: "100%" }}>{chunks}</p>,
            p2: chunks => <p style={{ width: "100%" }}>{chunks}</p>,
            B: (<InlineButton text="B" />),
            Y: (<InlineButton text="Y" />),
          }
        },
        navigationBar: {
          type: StepNavigationBar,
          params: {
            currentStep: 0
          }
        }
      };
    case "tips.mobile.turning":
    case "tips.standalone.turning":
      return {
        control: {
          type: Step,
          params: {
            p: chunks => <p style={{ width: "100%" }}>{chunks}</p>,
          }
        },
        navigationBar: {
          type: StepNavigationBar,
          params: {
            currentStep: 1
          }
        }
      };
    case "tips.mobile.menu":
      return {
        control: {
          type: Step,
          params: {
            p: chunks => <p style={{ width: "100%" }}>{chunks}</p>,
            menu: <InlineIcon icon={<MoreIcon />} />
          },
          messageId: "tips.menu"
        }
      };
    case "tips.desktop.end":
    case "tips.mobile.end":
    case "tips.standalone.end":
      return {
        control: {
          type: Step,
          params: {
            p: chunks => <p style={{ width: "100%" }}>{chunks}</p>,
          },
          messageId: "tips.end"
        }
      };
  }
}

export const Tooltip = memo(({ className, onPrev, onNext, onDismiss, step, ...rest }) => {
  const intl = useIntl();

  let layoutClass = null;
  let animationClass = styles.tipShowBottom;
  if (isStep(step, "welcome")) {
    if (isStep(step, "mobile")) {
      layoutClass = styles.tooltipsCentered;
    }
  } else {
    if (isStep(step, "mobile")) {
      layoutClass = styles.tooltipsTop;
      animationClass = styles.tipShowTop;
    }
  }

  const { control, navigationBar } = useMemo(() => onboardingSteps({ intl, step }), [intl, step]);
  return (
    <div className={layoutClass}>
      <div className={classNames(styles.tip, animationClass, className)} {...rest}>
        <div className={navigationBar?.type && styles.step}>
          <control.type step={control?.messageId || step} params={control?.params} />
        </div>
        {navigationBar?.type && (
          <navigationBar.type
            step={step}
            onPrev={onPrev}
            onNext={onNext}
            onDismiss={onDismiss}
            params={navigationBar?.params}
          />
        )}
      </div>
    </div>
  );
});

Tooltip.propTypes = {
  className: PropTypes.string,
  onPrev: PropTypes.func,
  onNext: PropTypes.func,
  onDismiss: PropTypes.func,
  step: PropTypes.string
};

Tooltip.displayName = "Tooltip";

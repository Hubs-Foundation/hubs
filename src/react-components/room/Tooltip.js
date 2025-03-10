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
      "<h2>Welcome to {appName}</h2><p>Let's take a quick look to get comfortable</p><p2>with the controls</p2>"
  },
  "tips.mobile.locomotion": {
    id: "tips.mobile.locomotion2",
    defaultMessage: "<p>Move around by pinching with two fingers</p><p2>or with the on-screen joysticks</p2>"
  },
  "tips.mobile.turning": {
    id: "tips.mobile.turning",
    defaultMessage: "Tap and drag to look around"
  },
  "tips.desktop.locomotion": {
    id: "tips.desktop.locomotion2",
    defaultMessage: "<p>Move around with</p> {wasd} or {arrows}"
  },
  "tips.desktop.turning": {
    id: "tips.desktop.turning2",
    defaultMessage: "Use {left} or {right} or click and drag to look around"
  },
  "tips.desktop.invite": {
    id: "tips.desktop.invite2",
    defaultMessage: "<p>Use the {invite} button to share</p><p2>this room</p2>"
  },
  "tips.end": {
    id: "tips.end",
    defaultMessage: "Tutorial completed! Have fun exploring"
  },
  "tips.menu": {
    id: "tips.menu",
    defaultMessage: "Access the tour from the {menu} menu"
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
  "tips.text.more": {
    id: "tips.text.more",
    defaultMessage: "More"
  },
  "tips.text.invite": {
    id: "tips.text.invite",
    defaultMessage: "Invite"
  }
});

function isStep(step, item) {
  return step.indexOf(item) !== -1;
}

function maxSteps(step) {
  return isStep(step, "desktop") ? 3 : 2;
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
      <div style={{ display: "flex" }}>
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
            left: <Key>{turnLeftKey}</Key>,
            right: <Key>{turnRightKey}</Key>
          }
        },
        navigationBar: {
          type: StepNavigationBar,
          params: {
            currentStep: 1
          }
        }
      };
    case "tips.desktop.invite":
      return {
        control: {
          type: Step,
          params: {
            invite: (
              <InlineButton icon={<InviteIcon />} text={intl.formatMessage(onboardingMessages["tips.text.invite"])} />
            ),
            p: chunks => <p style={{ width: "100%" }}>{chunks}</p>,
            p2: chunks => <p style={{ width: "100%" }}>{chunks}</p>
          }
        },
        navigationBar: {
          type: StepNavigationBar,
          params: {
            currentStep: 2
          }
        }
      };
    case "tips.desktop.menu":
      return {
        control: {
          type: Step,
          params: {
            menu: <InlineButton icon={<MoreIcon />} text={intl.formatMessage(onboardingMessages["tips.text.more"])} />
          },
          messageId: "tips.menu"
        }
      };
    case "tips.mobile.locomotion":
      return {
        control: {
          type: Step,
          params: {
            p: chunks => <p style={{ width: "100%" }}>{chunks}</p>,
            p2: chunks => <p style={{ width: "100%" }}>{chunks}</p>
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
      return {
        control: {
          type: Step
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
            menu: <InlineIcon icon={<MoreIcon />} />
          },
          messageId: "tips.menu"
        }
      };
    case "tips.desktop.end":
    case "tips.mobile.end":
      return {
        control: {
          type: Step,
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

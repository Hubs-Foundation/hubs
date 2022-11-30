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
  "tips.welcome.title": {
    id: "tips.welcome.title",
    defaultMessage: "Welcome to {appName}"
  },
  "tips.welcome.message": {
    id: "tips.welcome.message",
    defaultMessage: "Let's take a quick look to get comfortable {br} with the controls"
  },
  "tips.mobile.locomotion": {
    id: "tips.mobile.locomotion",
    defaultMessage: "Move around by pinching with two fingers {br} or with the on-screen joysticks"
  },
  "tips.mobile.turning": {
    id: "tips.mobile.turning",
    defaultMessage: "Tap and drag to turn"
  },
  "tips.desktop.locomotion": {
    id: "tips.desktop.locomotion",
    defaultMessage: "Move around with"
  },
  "tips.desktop.turning": {
    id: "tips.desktop.turning",
    defaultMessage: "Use {left} or {right} or click and drag"
  },
  "tips.desktop.invite": {
    id: "tips.desktop.invite",
    defaultMessage: "Use the {invite} button to share {br} this room"
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
  },
  "tips.text.or": {
    id: "tips.text.or",
    defaultMessage: "or"
  }
});

function isStep(step, checks) {
  return checks.every(item => {
    return step.indexOf(item) !== -1;
  });
}

function maxSteps(step) {
  return isStep(step, ["desktop"]) ? 3 : 2;
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

function Welcome() {
  const intl = useIntl();
  return (
    <>
      <h2>
        {intl.formatMessage(onboardingMessages["tips.welcome.title"], {
          appName: configs.translation("app-name")
        })}
      </h2>
      <p>
        {intl.formatMessage(onboardingMessages["tips.welcome.message"], {
          appName: configs.translation("app-name"),
          br: <br />
        })}
      </p>
    </>
  );
}

function LocomotionStep() {
  const intl = useIntl();
  return (
    <>
      <p>
        {intl.formatMessage(onboardingMessages["tips.desktop.locomotion"], {
          appName: configs.translation("app-name")
        })}
      </p>
      <div className={styles.keysContainer}>
        <MoveKeys up={moveKeyFront} left={moveKeyLeft} down={moveKeyBack} right={moveKeyRight} />
        <p>{intl.formatMessage(onboardingMessages["tips.text.or"])}</p>
        <MoveKeys up={"↑"} left={"←"} down={"↓"} right={"→"} />
      </div>
    </>
  );
}

function Step({ step, params }) {
  const intl = useIntl();
  return <p>{intl.formatMessage(onboardingMessages[step], params)}</p>;
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
  const { leftArrow, rightArrow, numStep } = params;
  return (
    <div className={styles.navigationContainer}>
      <IconButton as={"span"} className={classNames(styles.arrows, !leftArrow && styles.arrowsHidden)} onClick={onPrev}>
        {"<"}
      </IconButton>
      <div style={{ display: "flex" }}>
        {[...Array(maxSteps(step))].map((v, i) => {
          return <span key={i} className={classNames(styles.dot, i === numStep && styles.dotEnabled)}></span>;
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
          type: Welcome
        },
        navigationBar: {
          type: WelcomeNavigationBar
        }
      };
    case "tips.desktop.locomotion":
      return {
        control: {
          type: LocomotionStep
        },
        navigationBar: {
          type: StepNavigationBar,
          params: {
            numStep: 0,
            rightArrow: true
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
            numStep: 1,
            leftArrow: true,
            rightArrow: true
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
            br: <br />
          }
        },
        navigationBar: {
          type: StepNavigationBar,
          params: {
            numStep: 2,
            leftArrow: true
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
            br: <br />
          }
        },
        navigationBar: {
          type: StepNavigationBar,
          params: {
            numStep: 0,
            rightArrow: true
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
            numStep: 1,
            leftArrow: true
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
  if (isStep(step, ["welcome"])) {
    animationClass = null;
    if (isStep(step, ["mobile"])) {
      layoutClass = styles.tooltipsCentered;
    }
  } else {
    if (isStep(step, ["mobile"])) {
      layoutClass = styles.tooltipsTop;
      animationClass = styles.tipShowTop;
    }
  }

  const { control, navigationBar } = useMemo(() => onboardingSteps({ intl, step }), [intl, step]);
  return (
    <div className={layoutClass}>
      <div className={classNames(styles.tip, animationClass, className)} {...rest}>
        <div className={navigationBar?.type && styles.content}>
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

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import styles from './Tooltip.scss'
import configs from '../../utils/configs'
import { useIntl, defineMessages } from 'react-intl'
import { Button } from '../input/Button'
import { IconButton } from '../input/IconButton'
import { ReactComponent as InviteIcon } from '../icons/Invite.svg'
import { ReactComponent as MoreIcon } from '../icons/More.svg'

// These keys are hardcoded in the input system to be based on the physical location on the keyboard rather than character
let moveKeys = 'W A S D'
let turnLeftKey = 'Q'
let turnRightKey = 'E'

// TODO The API to map from physical key to character is experimental. Depending on prospects of this getting wider
// implementation we may want to cook up our own polyfill based on observing key inputs
if (window.navigator.keyboard !== undefined && window.navigator.keyboard.getLayoutMap) {
  window.navigator.keyboard
    .getLayoutMap()
    .then(function (map) {
      moveKeys = `${map.get('KeyW') || 'W'} ${map.get('KeyA') || 'A'} ${map.get('KeyS') || 'S'} ${map.get('KeyD') ||
        'D'}`.toUpperCase()
      turnLeftKey = map.get('KeyQ')?.toUpperCase()
      turnRightKey = map.get('KeyE')?.toUpperCase()
    })
    .catch(function (e) {
      // This occurs on Chrome 93 when the Hubs page is in an iframe
      console.warn(`Unable to remap keyboard: ${e}`)
    })
}

const onboardingMessages = defineMessages({
  'tips.welcome.title': {
    id: 'tips.welcome.title',
    defaultMessage: 'Welcome to {appName}'
  },
  'tips.welcome.message': {
    id: 'tips.welcome.message',
    defaultMessage: "Let's take a quick look to get comfortable {br} with the controls"
  },
  'tips.mobile.locomotion': {
    id: 'tips.mobile.locomotion',
    defaultMessage: 'Move around by pinching with two fingers or with the on-screen joysticks'
  },
  'tips.mobile.turning': {
    id: 'tips.mobile.turning',
    defaultMessage: 'Tap and drag to turn'
  },
  'tips.desktop.locomotion': {
    id: 'tips.desktop.locomotion',
    defaultMessage: 'Move around with'
  },
  'tips.desktop.turning': {
    id: 'tips.desktop.turning',
    defaultMessage: 'Use {left} or {right} or click and drag'
  },
  'tips.desktop.invite': {
    id: 'tips.desktop.invite',
    defaultMessage: 'Use the {invite} button to share this room'
  },
  'tips.end': {
    id: 'tips.end',
    defaultMessage: 'Tutorial completed! Have fun exploring'
  },
  'tips.menu': {
    id: 'tips.menu',
    defaultMessage: 'Access the tour from the {menu} menu'
  },
  'tips.buttons.get-started': {
    id: 'tips.buttons.get-started',
    defaultMessage: 'Get started'
  },
  'tips.buttons.skip-tour': {
    id: 'tips.buttons.skip-tour',
    defaultMessage: 'Skip tour'
  },
  'tips.buttons.done': {
    id: 'tips.buttons.done',
    defaultMessage: 'Done'
  },
  'tips.text.more': {
    id: 'tips.text.more',
    defaultMessage: 'More'
  },
  'tips.text.invite': {
    id: 'tips.text.invite',
    defaultMessage: 'Invite'
  }
})

const onboardingSteps = {
  'tips.welcome': {
    Control: Welcome,
    NavigationBar: WelcomeNavigationBar
  },
  'tips.mobile.locomotion': {
    Control: Step,
    NavigationBar: StepNavigationBar
  },
  'tips.mobile.turning': {
    Control: Step,
    NavigationBar: StepNavigationBar
  },
  'tips.mobile.menu': {
    Control: Step,
    params: {
      menu: <InlineIcon icon={<MoreIcon />} />
    },
    stepId: 'tips.menu'
  },
  'tips.desktop.locomotion': {
    Control: LocomotionStep,
    NavigationBar: StepNavigationBar
  },
  'tips.desktop.turning': {
    Control: Step,
    NavigationBar: StepNavigationBar,
    params: {
      left: <Key>{'Q'}</Key>,
      right: <Key>{'E'}</Key>
    }
  },
  'tips.desktop.invite': {
    Control: Step,
    NavigationBar: StepNavigationBar,
    params: {
      invite: <InlineButton icon={<InviteIcon />} text={'Invite'} />
    }
  },
  'tips.desktop.menu': {
    Control: Step,
    params: {
      menu: <InlineButton icon={<MoreIcon />} text={'More'} />
    },
    stepId: 'tips.menu'
  },
  'tips.end': {
    Control: Step
  }
}

function Key ({ children }) {
  return <span className={styles.key}>{children}</span>
}

function InlineButton ({ icon, text }) {
  return (
    <span className={styles.inlineButton}>
      {icon}
      {text}
    </span>
  )
}

function InlineIcon ({ icon }) {
  return <span className={styles.inlineIcon}>{icon}</span>
}

function MoveKeys ({ up, left, down, right }) {
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
  )
}

function Welcome ({ intl, step, params }) {
  return (
    <>
      <h2>
        {intl.formatMessage(onboardingMessages['tips.welcome.title'], {
          appName: configs.translation('app-name')
        })}
      </h2>
      <p>
        {intl.formatMessage(onboardingMessages['tips.welcome.message'], {
          appName: configs.translation('app-name')
        })}
      </p>
    </>
  )
}

function LocomotionStep ({ intl, step, params }) {
  return (
    <>
      <p>
        {intl.formatMessage(onboardingMessages['tips.desktop.locomotion'], {
          appName: configs.translation('app-name')
        })}
      </p>
      <div className={styles.keysContainer}>
        <MoveKeys up={'W'} left={'A'} down={'S'} right={'D'} />
        <p>or</p>
        <MoveKeys up={'↑'} left={'←'} down={'↓'} right={'→'} />
      </div>
    </>
  )
}

function Step ({ intl, step, params }) {
  return <p>{intl.formatMessage(onboardingMessages[step], params)}</p>
}

function WelcomeNavigationBar ({ intl, step, onNext, onDismiss }) {
  return (
    <div className={styles.navigationContainer}>
      <Button preset='primary' onClick={onNext}>
        {intl.formatMessage(onboardingMessages['tips.buttons.get-started'])}
      </Button>
      <Button preset='basic' onClick={onDismiss}>
        {intl.formatMessage(onboardingMessages['tips.buttons.skip-tour'])}
      </Button>
    </div>
  )
}

function StepNavigationBar ({ intl, step, onNext, onDismiss }) {
  return (
    <div className={styles.navigationContainer}>
      <IconButton as={'span'} className={styles.arrows}>
        {'<'}
      </IconButton>
      <div style={{ display: 'flex' }}>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
      </div>
      {step === 'tips.desktop.invite' || step === 'tips.mobile.turning' ? (
        <a
          href={'#'}
          onClick={event => {
            event.preventDefault()
            onDismiss()
          }}
        >
          {intl.formatMessage(onboardingMessages['tips.buttons.done'])}
        </a>
      ) : (
        <IconButton as={'span'} className={styles.arrows}>
          {'>'}
        </IconButton>
      )}
    </div>
  )
}

export function Tooltip ({ className, children, onDismiss, step, dismissLabel, ...rest }) {
  const intl = useIntl()
  const { Control, NavigationBar, params, stepId } = onboardingSteps[step]
  return (
    <div className={classNames(styles.tip, className)} {...rest}>
      <div className={NavigationBar && styles.content}>
        <Control intl={intl} step={stepId || step} params={params} />
      </div>
      {NavigationBar && <NavigationBar intl={intl} step={step} onNext={() => {}} onDismiss={onDismiss} />}
    </div>
  )
}

Tooltip.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  onDismiss: PropTypes.func,
  dismissLabel: PropTypes.node
}

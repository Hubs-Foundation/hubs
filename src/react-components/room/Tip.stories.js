import React from 'react'
import { RoomLayout } from '../layout/RoomLayout'
import { Tip } from './Tip'
import { Tooltip } from './Tooltip'

export default {
  title: 'Room/Tip',
  parameters: {
    layout: 'fullscreen'
  }
}

export const Tips = ({ step }) => (
  <RoomLayout
    viewport={
      <Tip onDismiss={() => {}} dismissLabel='Skip' step={step}>
        {"Welcome to Mozilla Hubs! Let's take a quick tour. 👋 Click and drag to look around."}
      </Tip>
    }
  />
)

const TOOLTIP_STEPS = {
  'tips.welcome': 'Welcome Message',
  'tips.desktop.locomotion': 'Desktop Locomotion',
  'tips.desktop.turning': 'Desktop Turning',
  'tips.desktop.invite': 'Desktop Invite',
  'tips.desktop.menu': 'Desktop Menu',
  'tips.mobile.locomotion': 'Mobile Locomotion',
  'tips.mobile.turning': 'Mobile Turning',
  'tips.mobile.menu': 'Mobile Menu',
  'tips.end': 'End'
}

export const Tooltips = ({ step }) => (
  <RoomLayout
    viewport={
      <Tooltip onDismiss={() => {}} dismissLabel='Skip' step={step}>
        {"Welcome to Mozilla Hubs! Let's take a quick tour. 👋 Click and drag to look around."}
      </Tooltip>
    }
  />
)

Tooltips.argTypes = {
  step: {
    name: 'Onboarding tips step',
    options: Object.keys(TOOLTIP_STEPS),
    control: {
      type: 'select',
      labels: TOOLTIP_STEPS
    },
    defaultValue: Object.keys(TOOLTIP_STEPS)[0]
  }
}

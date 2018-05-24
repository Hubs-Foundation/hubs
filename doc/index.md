
# Component Docs
- Systems
  - [app-mode](#systems/app-mode)
  - [exit-on-blur](#systems/exit-on-blur)
  - [personal-space-bubble](#systems/personal-space-bubble)
- Components
  - [app-mode](#components/app-mode)
    - [app-mode-toggle-playing](#components/app-mode/app-mode-toggle-playing)
    - [app-mode-toggle-attribute](#components/app-mode/app-mode-toggle-attribute)
    - [app-mode-input-mappings](#components/app-mode/app-mode-input-mappings)
      
  - [avatar](#components/avatar)
    - [networked-audio-analyser](#components/avatar/networked-audio-analyser)
    - [scale-audio-feedback](#components/avatar/scale-audio-feedback)
    - [avatar-replay](#components/avatar/avatar-replay)
    - [bone-mute-state-indicator](#components/avatar/bone-mute-state-indicator)
    - [bone-visibility](#components/avatar/bone-visibility)
    - [character-controller](#components/avatar/character-controller)
    - [hand-pose](#components/avatar/hand-pose)
    - [hand-pose-controller](#components/avatar/hand-pose-controller)
    - [ik-root](#components/avatar/ik-root)
    - [ik-controller](#components/avatar/ik-controller)
    - [networked-avatar](#components/avatar/networked-avatar)
    - [player-info](#components/avatar/player-info)
    - [spawn-controller](#components/avatar/spawn-controller)
      
  - [avatar/personal-space-bubble](#components/avatar/personal-space-bubble)
    - [space-invader-mesh](#components/avatar/personal-space-bubble/space-invader-mesh)
    - [personal-space-invader](#components/avatar/personal-space-bubble/personal-space-invader)
    - [personal-space-bubble](#components/avatar/personal-space-bubble/personal-space-bubble)
      
  - [gltf](#components/gltf)
    - [gltf-bundle](#components/gltf/gltf-bundle)
    - [gltf-model-plus](#components/gltf/gltf-model-plus)
      
  - [misc](#components/misc)
    - [animation-mixer](#components/misc/animation-mixer)
    - [matcolor-audio-feedback](#components/misc/matcolor-audio-feedback)
    - [css-class](#components/misc/css-class)
    - [duck](#components/misc/duck)
    - [event-repeater](#components/misc/event-repeater)
    - [hide-when-quality](#components/misc/hide-when-quality)
    - [layers](#components/misc/layers)
    - [loop-animation](#components/misc/loop-animation)
    - [nav-mesh-helper](#components/misc/nav-mesh-helper)
    - [offset-relative-to](#components/misc/offset-relative-to)
    - [scene-shadow](#components/misc/scene-shadow)
    - [spawn-point](#components/misc/spawn-point)
      
  - [network](#components/network)
    - [block-button](#components/network/block-button)
    - [freeze-controller](#components/network/freeze-controller)
    - [mute-mic](#components/network/mute-mic)
    - [networked-counter](#components/network/networked-counter)
    - [networked-video-player](#components/network/networked-video-player)
    - [super-networked-interactable](#components/network/super-networked-interactable)
    - [super-spawner](#components/network/super-spawner)
      
  - [ui](#components/ui)
    - [hud-controller](#components/ui/hud-controller)
    - [icon-button](#components/ui/icon-button)
    - [in-world-hud](#components/ui/in-world-hud)
    - [text-button](#components/ui/text-button)
    - [visible-while-frozen](#components/ui/visible-while-frozen)
    - [ui-class-while-frozen](#components/ui/ui-class-while-frozen)
      
  - [user-input](#components/user-input)
    - [cardboard-controls](#components/user-input/cardboard-controls)
    - [controls-shape-offset](#components/user-input/controls-shape-offset)
    - [cursor-controller](#components/user-input/cursor-controller)
    - [hand-controls2](#components/user-input/hand-controls2)
    - [haptic-feedback](#components/user-input/haptic-feedback)
    - [virtual-gamepad-controls](#components/user-input/virtual-gamepad-controls)
    - [wasd-to-analog2d](#components/user-input/wasd-to-analog2d)
      
  - [vr-mode](#components/vr-mode)
    - [vr-mode-toggle-visibility](#components/vr-mode/vr-mode-toggle-visibility)
    - [vr-mode-toggle-playing](#components/vr-mode/vr-mode-toggle-playing)
      

## Systems

#### app-mode

Simple system for keeping track of a modal app state

src/systems/app-mode.js
    

#### exit-on-blur

Emits an "exit" event when a user has stopped using the app for a certain period of time

src/systems/exit-on-blur.js
    

#### personal-space-bubble

Iterates through bubbles and invaders on every tick and sets invader state accordingly. testing multiline things

src/systems/personal-space-bubble.js
    

# Components

### misc
      
#### animation-mixer

Instantiates and updates a THREE.AnimationMixer on an entity.

src/components/animation-mixer.js
          

#### matcolor-audio-feedback

Sets an entity's color base on audioFrequencyChange events.

src/components/audio-feedback.js
          

#### css-class

Sets the CSS class on an entity.

src/components/css-class.js
          

#### duck

Floats a duck based on its scale.

src/components/duck.js
          

#### event-repeater

Listens to events from an event source and re-emits them on this entity

src/components/event-repeater.js
          

#### hide-when-quality

Hides entities based on the scene's quality mode

src/components/hide-when-quality.js
          

#### layers

Sets layer flags on the underlying Object3D

src/components/layers.js
          

#### loop-animation

Loops the given clip using this entity's animation mixer

src/components/loop-animation.js
          

#### nav-mesh-helper

Initializes teleport-controls when the environment bundle has loaded.

src/components/nav-mesh-helper.js
          

#### offset-relative-to

Positions an entity relative to a given target when the given event is fired.

src/components/offset-relative-to.js
          

#### scene-shadow

For use in environment gltf bundles to set scene shadow properties.

src/components/scene-shadow.js
          

#### spawn-point

Marks an entity as a potential spawn point.

src/components/spawn-controller.js
          
    

### avatar
      
#### networked-audio-analyser

Emits audioFrequencyChange events based on a networked audio source

src/components/audio-feedback.js
          

#### scale-audio-feedback

Sets an entity's scale base on audioFrequencyChange events.

src/components/audio-feedback.js
          

#### avatar-replay

Replays a recorded motion capture with the given avatar body parts

src/components/avatar-replay.js
          

#### bone-mute-state-indicator

Toggles the position of 2 bones into "on" and "off" positions to indicate mute state.

src/components/bone-mute-state-indicator.js
          

#### bone-visibility

Scales an object to near-zero if the object is invisible. Useful for bones representing avatar body parts.

src/components/bone-visibility.js
          

#### character-controller

Avatar movement controller that listens to move, rotate and teleportation events and moves the avatar accordingly. The controller accounts for playspace offset and orientation and depends on the nav mesh system for translation.

src/components/character-controller.js
          

#### hand-pose

Animates between poses based on networked pose state using an animation mixer.

src/components/hand-poses.js
          

#### hand-pose-controller

Sets the networked hand pose state based on hand-pose events.

src/components/hand-poses.js
          

#### ik-root

Provides access to the end effectors for IK.

src/components/ik-controller.js
          

#### ik-controller

Performs IK on a hip-rooted skeleton to align the hip, head and hands with camera and controller inputs.

src/components/ik-controller.js
          

#### networked-avatar

Stores networked avatar state.

src/components/networked-avatar.js
          

#### player-info

Sets player info state, including avatar choice and display name.

src/components/player-info.js
          

#### spawn-controller

Used on a player-rig to move the player to a random spawn point on entry.

src/components/spawn-controller.js
          
    

### network
      
#### block-button

Registers a click handler and invokes the block method on the NAF adapter for the owner associated with its entity.

src/components/block-button.js
          

#### freeze-controller

Toggles freezing of network traffic on the given event.

src/components/freeze-controller.js
          

#### mute-mic

Toggles the microphone on the current network connection based on the given events.

src/components/mute-mic.js
          

#### networked-counter

Limits networked interactables to a maximum number at any given time

src/components/networked-counter.js
          

#### networked-video-player

Instantiates and plays a network video stream, setting the video as the source material for this entity.

src/components/networked-video-player.js
          

#### super-networked-interactable

Manages ownership and haptics on an interatable

src/components/super-networked-interactable.js
          

#### super-spawner

Spawns networked objects when grabbed.

src/components/super-spawner.js
          
    

### user-input
      
#### cardboard-controls

Polls the Gamepad API for Cardboard Button input and emits cardboardbutton events.

src/components/cardboard-controls.js
          

#### controls-shape-offset

Sets the offset of the aframe-physics shape on this entity based on the current VR controller type

src/components/controls-shape-offset.js
          

#### cursor-controller

Controls virtual cursor behavior in various modalities to affect teleportation, interatables and UI.

src/components/cursor-controller.js
          

#### hand-controls2

Converts events from various 6DoF and 3DoF controllers into hand-pose events.

src/components/hand-controls2.js
          

#### haptic-feedback

Listens for haptic events and actuates hardware controllers accordingly

src/components/haptic-feedback.js
          

#### virtual-gamepad-controls

Instantiates 2D virtual gamepads and emits associated events.

src/components/virtual-gamepad-controls.js
          

#### wasd-to-analog2d

Converts WASD keyboard inputs to simulated analog inputs.

src/components/wasd-to-analog2d.js
          
    

### gltf
      
#### gltf-bundle

Instantiates GLTF models as specified in a bundle JSON.

src/components/gltf-bundle.js
          

#### gltf-model-plus

Loads a GLTF model, optionally recursively "inflates" the child nodes of a model into a-entities and sets whitelisted components on them if defined in the node's extras.

src/components/gltf-model-plus.js
          
    

### ui
      
#### hud-controller

Positions the HUD and toggles app mode based on where the user is looking

src/components/hud-controller.js
          

#### icon-button

A button with an image, tooltip, hover states and haptics.

src/components/icon-button.js
          

#### in-world-hud

HUD panel for muting, freezing, and space bubble controls.

src/components/in-world-hud.js
          

#### text-button

A button with text and haptics

src/components/text-button.js
          

#### visible-while-frozen

Toggles the visibility of this entity when the scene is frozen.

src/components/visible-while-frozen.js
          

#### ui-class-while-frozen

Toggles the interactivity of a UI entity while the scene is frozen.

src/components/visible-while-frozen.js
          
    

### app-mode
      
#### app-mode-toggle-playing

Toggle the isPlaying state of a component based on app mode

src/systems/app-mode.js
          

#### app-mode-toggle-attribute

Toggle a boolean property of a component based on app mode

src/systems/app-mode.js
          

#### app-mode-input-mappings

Toggle aframe input mappings action set based on app mode

src/systems/app-mode.js
          
    

### vr-mode
      
#### vr-mode-toggle-visibility

Toggle visibility of an entity based on if the user is in vr mode or not

src/systems/app-mode.js
          

#### vr-mode-toggle-playing

Toggle the isPlaying state of a component based on app mode

src/systems/app-mode.js
          
    

### avatar/personal-space-bubble
      
#### space-invader-mesh

Specifies a mesh associated with an invader.

src/systems/personal-space-bubble.js
          

#### personal-space-invader

Represents an entity that can invade a personal space bubble

src/systems/personal-space-bubble.js
          

#### personal-space-bubble

Represents a personal space bubble on an entity.

src/systems/personal-space-bubble.js
          
    
  
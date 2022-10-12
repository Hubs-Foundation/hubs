
# Component Docs
- Systems
  - [exit-on-blur](#systems/exit-on-blur)
  - [personal-space-bubble](#systems/personal-space-bubble)
- Components
  - [avatar](#components/avatar)
    - [networked-audio-analyser](#components/avatar/networked-audio-analyser)
    - [scale-audio-feedback](#components/avatar/scale-audio-feedback)
    - [avatar-replay](#components/avatar/avatar-replay)
    - [bone-mute-state-indicator](#components/avatar/bone-mute-state-indicator)
    - [bone-visibility](#components/avatar/bone-visibility)
    - [hand-pose](#components/avatar/hand-pose)
    - [hand-pose-controller](#components/avatar/hand-pose-controller)
    - [ik-root](#components/avatar/ik-root)
    - [ik-controller](#components/avatar/ik-controller)
    - [networked-avatar](#components/avatar/networked-avatar)
    - [player-info](#components/avatar/player-info)
    - [spawn-controller](#components/avatar/spawn-controller)
  - [avatar/personal-space-bubble](#components/avatar/personal-space-bubble)
    - [personal-space-invader](#components/avatar/personal-space-bubble/personal-space-invader)
    - [personal-space-bubble](#components/avatar/personal-space-bubble/personal-space-bubble)
  - [environment](#components/environment)
    - [hide-when-quality](#components/environment/hide-when-quality)
    - [layers](#components/environment/layers)
    - [scene-shadow](#components/environment/scene-shadow)
    - [spawn-point](#components/environment/spawn-point)
  - [gltf](#components/gltf)
    - [gltf-bundle](#components/gltf/gltf-bundle)
    - [gltf-model-plus](#components/gltf/gltf-model-plus)
  - [misc](#components/misc)
    - [animation-mixer](#components/misc/animation-mixer)
    - [matcolor-audio-feedback](#components/misc/matcolor-audio-feedback)
    - [css-class](#components/misc/css-class)
    - [duck](#components/misc/duck)
    - [event-repeater](#components/misc/event-repeater)
    - [loop-animation](#components/misc/loop-animation)
    - [offset-relative-to](#components/misc/offset-relative-to)
  - [network](#components/network)
    - [block-button](#components/network/block-button)
    - [freeze-controller](#components/network/freeze-controller)
    - [mute-mic](#components/network/mute-mic)
    - [networked-counter](#components/network/networked-counter)
    - [networked-video-player](#components/network/networked-video-player)
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
    - [cursor-controller](#components/user-input/cursor-controller)
    - [hand-controls2](#components/user-input/hand-controls2)
    - [virtual-gamepad-controls](#components/user-input/virtual-gamepad-controls)
  - [vr-mode](#components/vr-mode)
    - [vr-mode-toggle-visibility](#components/vr-mode/vr-mode-toggle-visibility)
    - [vr-mode-toggle-playing](#components/vr-mode/vr-mode-toggle-playing)

## Systems

<a name="systems/exit-on-blur"></a>
#### exit-on-blur

Emits an "exit" event when a user has stopped using the app for a certain period of time

`src/systems/exit-on-blur.js`
    

<a name="systems/personal-space-bubble"></a>
#### personal-space-bubble

Iterates through bubbles and invaders on every tick and sets invader state accordingly. testing multiline things

`src/systems/personal-space-bubble.js`
    

## Components

<a name="components/misc"></a>
### misc
      
<a name="components/misc/animation-mixer"></a>
#### animation-mixer

Instantiates and updates a THREE.AnimationMixer on an entity.

`src/components/animation-mixer.js`
          

<a name="components/misc/matcolor-audio-feedback"></a>
#### matcolor-audio-feedback

Sets an entity's color base on audioFrequencyChange events.

`src/components/audio-feedback.js`
          

<a name="components/misc/css-class"></a>
#### css-class

Sets the CSS class on an entity.

`src/components/css-class.js`
          

<a name="components/misc/duck"></a>
#### duck

Floats a duck based on its scale.

`src/components/duck.js`
          

<a name="components/misc/event-repeater"></a>
#### event-repeater

Listens to events from an event source and re-emits them on this entity

`src/components/event-repeater.js`
          

<a name="components/misc/loop-animation"></a>
#### loop-animation

Loops the given clip using this entity's animation mixer

`src/components/loop-animation.js`
          

<a name="components/misc/offset-relative-to"></a>
#### offset-relative-to

Positions an entity relative to a given target when the given event is fired.

`src/components/offset-relative-to.js`
          
    

<a name="components/avatar"></a>
### avatar
      
<a name="components/avatar/networked-audio-analyser"></a>
#### networked-audio-analyser

Emits audioFrequencyChange events based on a networked audio source

`src/components/audio-feedback.js`
          

<a name="components/avatar/scale-audio-feedback"></a>
#### scale-audio-feedback

Sets an entity's scale base on audioFrequencyChange events.

`src/components/audio-feedback.js`
          

<a name="components/avatar/avatar-replay"></a>
#### avatar-replay

Replays a recorded motion capture with the given avatar body parts

`src/components/avatar-replay.js`
          

<a name="components/avatar/bone-mute-state-indicator"></a>
#### bone-mute-state-indicator

Toggles the position of 2 bones into "on" and "off" positions to indicate mute state.

`src/components/bone-mute-state-indicator.js`
          

<a name="components/avatar/bone-visibility"></a>
#### bone-visibility

Scales an object to near-zero if the object is invisible. Useful for bones representing avatar body parts.

`src/components/bone-visibility.js`
          
<a name="components/avatar/hand-pose"></a>
#### hand-pose

Animates between poses based on networked pose state using an animation mixer.

`src/components/hand-poses.js`
          

<a name="components/avatar/hand-pose-controller"></a>
#### hand-pose-controller

Sets the networked hand pose state based on hand-pose events.

`src/components/hand-poses.js`
          

<a name="components/avatar/ik-root"></a>
#### ik-root

Provides access to the end effectors for IK.

`src/components/ik-controller.js`
          

<a name="components/avatar/ik-controller"></a>
#### ik-controller

Performs IK on a hip-rooted skeleton to align the hip, head and hands with camera and controller inputs.

`src/components/ik-controller.js`
          

<a name="components/avatar/networked-avatar"></a>
#### networked-avatar

Stores networked avatar state.

`src/components/networked-avatar.js`
          

<a name="components/avatar/player-info"></a>
#### player-info

Sets player info state, including avatar choice and display name.

`src/components/player-info.js`
          

<a name="components/avatar/spawn-controller"></a>
#### spawn-controller

Used on a avatar-rig to move the avatar to a random spawn point on entry.

`src/components/spawn-controller.js`
          
    

<a name="components/network"></a>
### network
      
<a name="components/network/block-button"></a>
#### block-button

Registers a click handler and invokes the block method on the NAF adapter for the owner associated with its entity.

`src/components/block-button.js`
          

<a name="components/network/freeze-controller"></a>
#### freeze-controller

Toggles freezing of network traffic on the given event.

`src/components/freeze-controller.js`
          

<a name="components/network/mute-mic"></a>
#### mute-mic

Toggles the microphone on the current network connection based on the given events.

`src/components/mute-mic.js`
          

<a name="components/network/networked-counter"></a>
#### networked-counter

Limits networked interactables to a maximum number at any given time

`src/components/networked-counter.js`
          

<a name="components/network/networked-video-player"></a>
#### networked-video-player

Instantiates and plays a network video stream, setting the video as the source material for this entity.

`src/components/networked-video-player.js`
          
<a name="components/network/super-spawner"></a>
#### super-spawner

Spawns networked objects when grabbed.

`src/components/super-spawner.js`
          
    

<a name="components/user-input"></a>
### user-input
      
<a name="components/user-input/cardboard-controls"></a>
#### cardboard-controls

Polls the Gamepad API for Cardboard Button input and emits cardboardbutton events.

`src/components/cardboard-controls.js`
          
<a name="components/user-input/cursor-controller"></a>
#### cursor-controller

Controls virtual cursor behavior in various modalities to affect teleportation, interatables and UI.

`src/components/cursor-controller.js`
          

<a name="components/user-input/hand-controls2"></a>
#### hand-controls2

Converts events from various 6DoF and 3DoF controllers into hand-pose events.

`src/components/hand-controls2.js`
          

<a name="components/user-input/virtual-gamepad-controls"></a>
#### virtual-gamepad-controls

Instantiates 2D virtual gamepads and emits associated events.

`src/components/virtual-gamepad-controls.js`
          

<a name="components/user-input/wasd-to-analog2d"></a>
#### wasd-to-analog2d

Converts WASD keyboard inputs to simulated analog inputs.

`src/components/wasd-to-analog2d.js`
          
    

<a name="components/gltf"></a>
### gltf
      
<a name="components/gltf/gltf-bundle"></a>
#### gltf-bundle

Instantiates GLTF models as specified in a bundle JSON.

`src/components/gltf-bundle.js`
          

<a name="components/gltf/gltf-model-plus"></a>
#### gltf-model-plus

Loads a GLTF model, optionally recursively "inflates" the child nodes of a model into a-entities and sets allowed components on them if defined in the node's extras.

`src/components/gltf-model-plus.js`
          
    

<a name="components/environment"></a>
### environment
      
<a name="components/environment/hide-when-quality"></a>
#### hide-when-quality

Hides entities based on the scene's quality mode

`src/components/hide-when-quality.js`
          

<a name="components/environment/layers"></a>
#### layers

Sets layer flags on the underlying Object3D

`src/components/layers.js`
          

<a name="components/environment/scene-shadow"></a>
#### scene-shadow

For use in environment gltf bundles to set scene shadow properties.

`src/components/scene-shadow.js`
          

<a name="components/environment/spawn-point"></a>
#### spawn-point

Marks an entity as a potential spawn point.

`src/components/spawn-controller.js`
          
    

<a name="components/ui"></a>
### ui
      
<a name="components/ui/hud-controller"></a>
#### hud-controller

Positions the HUD and toggles app mode based on where the user is looking

`src/components/hud-controller.js`
          

<a name="components/ui/icon-button"></a>
#### icon-button

A button with an image, tooltip, and hover states.

`src/components/icon-button.js`
          

<a name="components/ui/in-world-hud"></a>
#### in-world-hud

HUD panel for muting, freezing, and space bubble controls.

`src/components/in-world-hud.js`
          

<a name="components/ui/text-button"></a>
#### text-button

A button with text 

`src/components/text-button.js`
          

<a name="components/ui/visible-while-frozen"></a>
#### visible-while-frozen

Toggles the visibility of this entity when the scene is frozen.

`src/components/visible-while-frozen.js`
          

<a name="components/ui/ui-class-while-frozen"></a>
#### ui-class-while-frozen

Toggles the interactivity of a UI entity while the scene is frozen.

`src/components/visible-while-frozen.js`
          
    
<a name="components/vr-mode"></a>
### vr-mode
      
<a name="components/vr-mode/vr-mode-toggle-visibility"></a>
#### vr-mode-toggle-visibility

Toggle visibility of an entity based on if the user is in vr mode or not

`src/systems/app-mode.js`
          

<a name="components/vr-mode/vr-mode-toggle-playing"></a>
#### vr-mode-toggle-playing

Toggle the isPlaying state of a component based on app mode

`src/systems/app-mode.js`
          
    

<a name="components/avatar/personal-space-bubble"></a>
### avatar/personal-space-bubble

<a name="components/avatar/personal-space-bubble/personal-space-invader"></a>
#### personal-space-invader

Represents an entity that can invade a personal space bubble

`src/systems/personal-space-bubble.js`
          

<a name="components/avatar/personal-space-bubble/personal-space-bubble"></a>
#### personal-space-bubble

Represents a personal space bubble on an entity.

`src/systems/personal-space-bubble.js`
          
    
  

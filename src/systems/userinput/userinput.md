# The userinput system

The userinput system is a module that manages mappings from device state changes to app state changes. 


## Overview

The userinput system happens to be an `aframe` `system`; its `tick` is called once a frame within the `aframe` `scene`'s `tick`. When the userinput system `tick` happens, it is responsible for creating a map called the frame. The keys of the frame are called "paths". The values stored in the frame can be any type, but are usually one of: bool, number, vec2, vec3, vec4, pose. On each tick, each connected `device` writes "raw" input values to known "device paths" within the frame. Configuration units called `bindings` are then applied to transform "raw" input values to app-specific "actions". The userinput system exposes the state of a given `action` in the current frame via `get`. The `bindings` that are applied to transform input to "actions" must be `available`, `active`, and `prioritized`.

1.  A `binding` is made `available` when the userinput system detects a change to the user's device configuration that matches certain criteria. A touchscreen user only has `availableBindings` related to touchscreen input. A mouse-and-keyboard user only has `availableBindings` related to mouse-and-keyboard input. An oculus/vive user has `bindings` related to mouse, keyboard, and oculus/vive controllers.

2.  A `binding` is `active` if it is `available` and it belongs to an `action set` that is `active` this frame. The application is responsible for activating and deactivating `action sets` when appropriate. For example, when the user's avatar grabs a pen in its right hand, an action set called "rightHandHoldingPen" is activated. Though it depends on the way bindings have been configured, this will likely activate bindings responsible for writing to the following "actions": "rightHandStartDrawing", "rightHandStopDrawing", "rightHandPenNextColor", "rightHandPenPrevColor", "rightHandScalePenTip", "rightHandDrop".

3.  A `binding` is `prioritized` if, among all of the currently `available` and `active` bindings, it is defined with the highest "priority" value. Within the oculus and vive bindings, for example, the binding that says "stop drawing from the pen in the right hand when the trigger is released" in the "rightHandHoldingPen" action set is defined with a higher priority than the binding that says "drop a grabbable from the avatar's right hand when the trigger is released" in the "rightHandHoldingInteractable" action set. Thus, you do not drop the pen in your right hand when the trigger is released, and we define a third binding for how to perform this action when the thing in your right hand happens to be a pen.


## Terms and Conventions


### path

A path is used as a key when writing or querying the state a user input frame. Paths happen to be strings for now. We conceptually separate "action" paths, which are used by app code to read user input from a frame, from "device" paths, which specify where device state is recorded. Bindings may also "vars" paths to store intermediate results of xforms.

    paths.actions.rightHand.grab = "/actions/rightHandGrab";
    paths.actions.rightHand.drop = "/actions/rightHandDrop";
    paths.actions.rightHand.startDrawing = "/actions/rightHandStartDrawing";
    paths.actions.rightHand.stopDrawing = "/actions/rightHandStopDrawing";

    paths.device.mouse.coords = "/device/mouse/coords";
    paths.device.mouse.movementXY = "/device/mouse/movementXY";
    paths.device.mouse.buttonLeft = "/device/mouse/buttonLeft";
    paths.device.mouse.buttonRight = "/device/mouse/buttonRight";
    paths.device.keyboard = {
      key: key => {
        return ~/device/keyboard/${key.toLowerCase()}~;
      }
    };

    const lJoyScaled = "/vars/oculustouch/left/joy/scaled";


### action

A path used by app code when reading a user input frame.

    const userinput = AFRAME.scenes[0].systems.userinput;
    if (userinput.get("/actions/rightHandGrab")) {
      this.startInteraction();
    }

The value in the frame can be of any type, but we have tried to keep it to simple types like bool, number, vec2, vec3, and pose.

    const userinput = AFRAME.scenes[0].systems.userinput;
    const acceleration = userinput.get("/actions/characterAcceleration");
    this.updateVelocity( this.velocity, acceleration || zero );
    this.move( this.velocity );


### frame

A key-value store created each time the userinput system ticks. The userinput system writes a new frame by processing input from devices and transforming them by the set of `available`, `active`, and `prioritized` bindings.


### device

A device is almost always mapped one-to-one with a device as we think about it in the real world. In the case of mouse, touchscreen, and keyboard input, the browser emits events that are captured into a queue to be processed in order once each frame. An exception to handling device input through the userinput system is the case of interacting with browser API's that require a user-gesture, like the pointer lock API. In this case, the browser prevents us from engaging pointer lock except in a short-running event listener to a user-gesture.
Most devices can write their input state to the frame without depending on any other app state. An exception are the "app aware" touchscreen and mouse devices, which decide whether a raycast sent out from the in-game camera through the projected touch/click point lands on an interactable object or not, and what should be done in the case that it does.


### binding

A binding is an association of the form:

    {
      src: { xform_key_a : path,
             xform_key_b : path },
      dest: { xform_key_1 : path,
              xform_key_2 : path },
      xform: some_function, // f(frame, src, dest, prevState) -> newState
      priority: numerical_priority_of_this_binding // higher priority overrides lower priority bindings
    },

Bindings are organized into sets, and written with active specific device combinations in mind.


### xforms

Each binding specifies a `xform` (transformation) function that reads values in the frame at the paths provided by `src` and writes to the values in the frame at the paths in `dest`. These would otherwise be pure functions but they happen to write to the frame and return mutated state so as to avoid creating more garbage each frame. (We have not yet done a performance pass, so making smarter choices about memory allocation and avoiding garbage has been postponed.)
These ought to be treated as user-customizable, although we are likely the only ones to do this customization for some time.


### set

Sets are app state that correspond to sets of capabilities we expect to activate and deactivate all at once on behalf of the user.


### priority

When bindings can be written such that multiple actions could be triggered by the device input, we express our desire to apply one over another via the `binding`s and `priority`s. The userinput system only applies active bindings with highest priority values. This mechanism allows us to craft context-sensitive interaction mechanics on devices with limited input, like the oculus go remote.

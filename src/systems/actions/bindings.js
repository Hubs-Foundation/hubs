import { paths } from "./paths";
import { sets } from "./sets";
import { devices } from "./devices";
import { xforms } from "./xforms";

export const deviceSetBindings = [
  {
    device: devices.smartMouse.name,
    set: sets.global,
    bindings: [
      {
        src: { value: paths.device.smartMouse.cursorPose },
        dest: { value: paths.app.cursorPose },
        xform: xforms.copy
      },
      {
        src: { value: paths.device.smartMouse.cameraDelta },
        dest: { x: "/var/smartMouseCamDeltaX", y: "/var/smartMouseCamDeltaY" },
        xform: xforms.split_vec2
      },
      {
        src: { value: "/var/smartMouseCamDeltaX" },
        dest: { value: "/var/smartMouseCamDeltaXScaled" },
        xform: xforms.scale(-0.06)
      },
      {
        src: { value: "/var/smartMouseCamDeltaY" },
        dest: { value: "/var/smartMouseCamDeltaYScaled" },
        xform: xforms.scale(-0.1)
      },
      {
        src: { x: "/var/smartMouseCamDeltaXScaled", y: "/var/smartMouseCamDeltaYScaled" },
        dest: { value: paths.app.cameraDelta },
        xform: xforms.compose_vec2
      }
    ]
  },
  {
    device: devices.mouse.name,
    set: sets.cursorHoldingPen,
    bindings: [
      {
        src: { value: paths.device.mouse.buttonLeft },
        dest: { value: paths.app.cursorStartDrawing },
        xform: xforms.rising(),
        priority: 100
      },
      {
        src: { value: paths.device.mouse.buttonLeft },
        dest: { value: paths.app.cursorStopDrawing },
        xform: xforms.falling(),
        priority: 100
      },
      {
        src: { value: paths.device.mouse.buttonRight },
        dest: { value: paths.app.cursorDrop },
        xform: xforms.falling(),
        priority: 100
      }
    ]
  },
  {
    device: devices.mouse.name,
    set: sets.cursorHoveringOnInteractable,
    bindings: [
      {
        src: { value: paths.device.mouse.buttonLeft },
        dest: { value: paths.app.cursorGrab },
        xform: xforms.rising()
      }
    ]
  },
  {
    device: devices.mouse.name,
    set: sets.global,
    bindings: [
      // {
      //   src: { value: paths.device.mouse.buttonLeft },
      //   dest: { value: paths.app.cursorDrop},
      //   xform: xforms.falling()
      // },
      {
        src: { value: paths.device.mouse.wheel },
        dest: { value: paths.app.cursorModDelta },
        xform: xforms.copy
      }
    ]
  },
  //  {
  //    device: devices.mouse.name,
  //    set: sets.cursorHoldingCamera,
  //    bindings: [
  //      {
  //        src: { value: paths.device.mouse.movement },
  //        dest: { value: paths.app.cameraDelta },
  //        xform: xforms.copy,
  //        priority: 100 // overwrite cursorPose
  //      }
  //    ]
  //  },
  //  {
  //    device: devices.mouse.name,
  //    set: sets.cursorHoldingPen,
  //    bindings: [
  //      {
  //        src: { value: paths.device.mouse.coords },
  //        dest: { value: paths.app.penCoords },
  //        xform: xforms.copy,
  //      },
  //    ]
  //  },
];

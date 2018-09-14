import { paths } from "./paths";

const touchEvents = [];
["touchdown", "touchup", "touchmove", "touchcancel"].map(x =>
  document.addEventListener(x, touchEvents.push.bind(touchEvents))
);

function process(touchEvent) {}

export const touchscreen = {
  getDeviceFrame(deviceFrame) {
    const isReserved = {};
    const reserved = {};
    function shouldReserveForJoystickLeft(touch) {
      if (isReserved["joystickLeft"]) return false;
      const pX = touch.clientX / window.innerWidth;
      const pY = touch.clientY / window.innerHeight;
      return pX < .4 && pY < .2;
    }
    function shouldReserveForJoystickRight(touch) {
      if (isReserved["joystickRight"]) return false;
      const pX = touch.clientX / window.innerWidth;
      const pY = touch.clientY / window.innerHeight;
      return pX > .6 && pY < .2;
    }
    touchEvents.forEach(touchEvent => {
      touchEvent.changedTouches.forEach(touch => {
        if (!isReserved[touch.identifier]) {
          if (shouldReserveForJoystickLeft(touch)) {
            isReserved[touch.identifier] = true;
            isReserved["joystickLeft"] = true;
            reserved["joystickLeft"] = touch.idenfier;
          } else if (shouldReserveForJoystickRight(touch)) {
            isReserved[touch.identifier] = true;
            isReserved["joystickRight"] = true;
            reserved["joystickRight"] = touch.idenfier;
          }
        }

        if (reserved["joystickLeft"] === touch.idenfier){
        }

        deviceFrame[paths.device.touchscreen.joystickLeft] = [touch.clientX, touch.clientY];
      });
    });
  }
};

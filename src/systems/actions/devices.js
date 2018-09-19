import { mouse } from "./mouse";
import { keyboard } from "./keyboard";
import { smartMouse } from "./smartMouse";
import GamepadDevice from "./devices/gamepad";

export const devices = {};
devices.mouse = mouse;
devices.smartMouse = smartMouse;
devices.keyboard = keyboard;
devices.gamepad0 = new GamepadDevice(0);

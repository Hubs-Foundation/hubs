import { CONSTANTS } from "three-ammo";

const { TYPE, ACTIVATION_STATE } = CONSTANTS;

export function validatePhysicsParams(data) {
  const validated = { ...data };

  // Mass must be a valid number
  if (typeof validated.mass !== "number" || isNaN(validated.mass)) {
    console.warn("[body-helper] Invalid mass:", validated.mass, "→ defaulting to 1");
    validated.mass = 1;
  }

  // Type must be one of the constants
  const validTypes = [TYPE.DYNAMIC, TYPE.STATIC, TYPE.KINEMATIC];
  if (!validTypes.includes(validated.type)) {
    console.warn("[body-helper] Invalid type:", validated.type, "→ defaulting to dynamic");
    validated.type = TYPE.DYNAMIC;
  }

  // Gravity must be a vec3
  if (
    !validated.gravity ||
    typeof validated.gravity.x !== "number" ||
    typeof validated.gravity.y !== "number" ||
    typeof validated.gravity.z !== "number"
  ) {
    console.warn("[body-helper] Invalid gravity vector → defaulting to (0, -9.8, 0)");
    validated.gravity = { x: 0, y: -9.8, z: 0 };
  }

  return validated;
}


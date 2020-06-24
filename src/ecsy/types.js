import { Vector4 } from "three";
import { createType, copyCopyable, cloneClonable } from "ecsy";

export const Vector4Type = createType({
  name: "Vector4",
  default: new Vector4(),
  copy: copyCopyable,
  clone: cloneClonable
});

export const HubsTypes = {
  Vector4Type
};

declare module "three-ammo" {
  export namespace CONSTANTS {
    export enum TYPE {
      STATIC = "static",
      DYNAMIC = "dynamic",
      KINEMATIC = "kinematic"
    }
    export enum SHAPE {
      BOX = "box",
      CYLINDER = "cylinder",
      BOX = "box",
      CYLINDER = "cylinder",
      SPHERE = "sphere",
      CAPSULE = "capsule",
      CONE = "cone",
      HULL = "hull",
      HACD = "hacd",
      VHACD = "vhacd",
      MESH = "mesh",
      HEIGHTFIELD = "heightfield"
    }
    export enum FIT {
      ALL = "all",
      MANUAL = "manual"
    }
    export enum ACTIVATION_STATE {
      ACTIVE_TAG = "active",
      ISLAND_SLEEPING = "islandSleeping",
      WANTS_DEACTIVATION = "wantsDeactivation",
      DISABLE_DEACTIVATION = "disableDeactivation",
      DISABLE_SIMULATION = "disableSimulation"
    }
  }
}

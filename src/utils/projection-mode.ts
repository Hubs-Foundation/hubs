export const enum ProjectionMode {
  FLAT = 0,
  SPHERE_EQUIRECTANGULAR = 1
}
export const enum ProjectionModeName {
  FLAT = "flat",
  SPHERE_EQUIRECTANGULAR = "360-equirectangular"
}

export function getProjectionFromProjectionName(projectionName: ProjectionModeName): ProjectionMode {
  if (projectionName === ProjectionModeName.FLAT) {
    return ProjectionMode.FLAT;
  } else if (projectionName === ProjectionModeName.SPHERE_EQUIRECTANGULAR) {
    return ProjectionMode.SPHERE_EQUIRECTANGULAR;
  }
  return ProjectionMode.FLAT;
}

/**
With this patch you must make sure to follow these rules or very strange things will happen.
- If you modify an object's position, rotation, quaternion, or scale you MUST set matrixNeedsUpdate.
- If you modify an object's matrix
      you MUST decompose() back onto its position, quaternion and scale and
      you MUST set matrixWorldNeedsUpdate (or matrixNeedsUpdate, but the former is more correct).
      (applyMatrix() and updateMatrix() handle this for you)
- If you modify an object's matrixWorld
      you MUST make sure it has previously been modified so that it is not using its parent matrix as its own,
      you MUST update its local matrix,
      you MUST update its position/quaternion/scale, and
      you MUST set childrenNeedMatrixWorldUpdate.
      (setMatrixWorld() handles all of this for you)
- Before you read an object's matrix you MUST call updateMatrix() or updateMatrices().
- Before you read an object's matrixWorld you MUST call updateMatrices().
      (getWorldPosition, getWorldOrientation and getWorldScale handle this for you)
- Do not set matrixIsModified yourself; You could accidentally overwrite a shared parent matrixWorld.
- Note updateMatrix, updateMatrixWorld, updateWorldMatrix, updateMatrices, setMatrixWorld,
      matrixNeedsUpdate, matrixWorldNeedsUpdate, and matrixIsModified are all different things.
      Most already exist in ThreeJS but some have been added here.
      Double check you are using the one you intend to.
      Be on the lookout for compatibility issues with third party libraries.
*/

// The changes that require this contract now live in our ThreeJS branch.
// Retaining this file since it is referenced in many Discord messages and documentation.

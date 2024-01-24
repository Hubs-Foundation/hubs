import { addComponent, defineQuery, entityExists, hasComponent, removeComponent } from "bitecs";
import { Text } from "troika-three-text";
import type { HubsWorld } from "../app";
import {
  CursorRaycastable,
  Deleting,
  EntityStateDirty,
  HoveredRemoteRight,
  Interacted,
  MediaLoader,
  MediaPDF,
  MediaPDFUpdated,
  MediaSnapped,
  NetworkedPDF,
  ObjectMenuTransform,
  PDFMenu
} from "../bit-components";
import { anyEntityWith, findAncestorWithComponent } from "../utils/bit-utils";
import type { EntityID } from "../utils/networking-types";
import { takeOwnership } from "../utils/take-ownership";
import { PDFResourcesMap } from "./pdf-system";
import { ObjectMenuTransformFlags } from "../inflators/object-menu-transform";

function setCursorRaycastable(world: HubsWorld, menu: EntityID, enable: boolean) {
  let change = enable ? addComponent : removeComponent;
  change(world, CursorRaycastable, menu);
  change(world, CursorRaycastable, PDFMenu.prevButtonRef[menu]);
  change(world, CursorRaycastable, PDFMenu.nextButtonRef[menu]);
  change(world, CursorRaycastable, PDFMenu.snapRef[menu]);
}

function clicked(world: HubsWorld, eid: EntityID) {
  return hasComponent(world, Interacted, eid);
}

function findPDFMenuTarget(world: HubsWorld, menu: EntityID, sceneIsFrozen: boolean) {
  if (PDFMenu.targetRef[menu] && !entityExists(world, PDFMenu.targetRef[menu])) {
    // Clear the invalid entity reference. (The pdf entity was removed).
    PDFMenu.targetRef[menu] = 0;
  }

  if (sceneIsFrozen) {
    PDFMenu.targetRef[menu] = 0;
    return;
  }

  const hovered = hoveredQuery(world);
  const target = hovered.map(eid => findAncestorWithComponent(world, MediaPDF, eid))[0] || 0;
  if (target) {
    PDFMenu.targetRef[menu] = target;
    PDFMenu.clearTargetTimer[menu] = world.time.elapsed + 1000;
    return;
  }

  if (hovered.some(eid => findAncestorWithComponent(world, PDFMenu, eid))) {
    PDFMenu.clearTargetTimer[menu] = world.time.elapsed + 1000;
    return;
  }

  if (world.time.elapsed > PDFMenu.clearTargetTimer[menu]) {
    PDFMenu.targetRef[menu] = 0;
    return;
  }
}

function wrapAround(n: number, min: number, max: number) {
  // Wrap around [min, max] inclusively
  // Assumes that n is only 1 more than max or 1 less than min
  return n < min ? max : n > max ? min : n;
}

function setPage(world: HubsWorld, eid: EntityID, pageNumber: number) {
  if (hasComponent(world, NetworkedPDF, eid)) {
    takeOwnership(world, eid);
    addComponent(world, EntityStateDirty, eid);
  }
  addComponent(world, MediaPDFUpdated, eid);
  MediaPDFUpdated.pageNumber[eid] = wrapAround(pageNumber, 1, PDFResourcesMap.get(eid)!.pdf.numPages);
}

function handleClicks(world: HubsWorld, menu: EntityID) {
  if (clicked(world, PDFMenu.nextButtonRef[menu])) {
    const pdf = PDFMenu.targetRef[menu];
    setPage(world, pdf, MediaPDF.pageNumber[pdf] + 1);
  } else if (clicked(world, PDFMenu.prevButtonRef[menu])) {
    const pdf = PDFMenu.targetRef[menu];
    setPage(world, pdf, MediaPDF.pageNumber[pdf] - 1);
  } else if (clicked(world, PDFMenu.snapRef[menu])) {
    const pdf = PDFMenu.targetRef[menu];
    addComponent(world, MediaSnapped, pdf);
  }
}

function flushToObject3Ds(world: HubsWorld, menu: EntityID, frozen: boolean) {
  const target = PDFMenu.targetRef[menu];
  let visible = !!(target && !frozen);

  const loader = findAncestorWithComponent(world, MediaLoader, target);
  if (loader && hasComponent(world, Deleting, loader)) {
    visible = false;
  }

  const obj = world.eid2obj.get(menu)!;
  obj.visible = visible;

  // TODO We are handling menus visibility in a similar way for all the object menus, we
  // should probably refactor this to a common object-menu-visibility-system
  if (visible) {
    ObjectMenuTransform.targetObjectRef[menu] = target;
    ObjectMenuTransform.flags[menu] |= ObjectMenuTransformFlags.Enabled;
  } else {
    ObjectMenuTransform.flags[menu] &= ~ObjectMenuTransformFlags.Enabled;
  }

  if (target) {
    const numPages = PDFResourcesMap.get(target)!.pdf.numPages;
    (world.eid2obj.get(PDFMenu.pageLabelRef[menu]) as Text).text = `${MediaPDF.pageNumber[target]} / ${numPages}`;
  }

  setCursorRaycastable(world, menu, visible);
}

const hoveredQuery = defineQuery([HoveredRemoteRight]);
export function pdfMenuSystem(world: HubsWorld, sceneIsFrozen: boolean) {
  const menu = anyEntityWith(world, PDFMenu)!;
  findPDFMenuTarget(world, menu, sceneIsFrozen);
  if (PDFMenu.targetRef[menu]) {
    handleClicks(world, menu);
  }
  flushToObject3Ds(world, menu, sceneIsFrozen);
}

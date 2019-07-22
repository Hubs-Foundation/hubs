function getSpecificHoverMenu(el) {
  return (
    el.components["hover-menu"] ||
    el.components["hover-menu__video"] ||
    el.components["hover-menu__hubs-item"] ||
    el.components["hover-menu__link"] ||
    el.components["hover-menu__photo"]
  );
}

function findHoverMenu(hovered) {
  if (!hovered) return null;
  const hoverMenu = getSpecificHoverMenu(hovered);
  if (hoverMenu) {
    return hoverMenu;
  }
  if (!(hovered.components.tags && hovered.components.tags.data.isHoverMenuChild)) {
    return null;
  }
  let el = hovered.parentNode;
  while (!getSpecificHoverMenu(el)) {
    el = el.parentNode;
  }
  return getSpecificHoverMenu(el);
}

export class HoverMenuSystem {
  tick() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    const hoverMenu = findHoverMenu(interaction.state.rightRemote.hovered);

    if (this.prevHoverMenu && this.prevHoverMenu !== hoverMenu) {
      this.prevHoverMenu.hovering = false;
      this.prevHoverMenu.applyHoverState();
    }

    if (hoverMenu && this.prevHoverMenu !== hoverMenu) {
      hoverMenu.hovering = true;
      hoverMenu.applyHoverState();
    }

    this.prevHoverMenu = hoverMenu;
  }
}

import { HubsWorld } from "../app";
import { addComponent } from "bitecs";
import { Portal } from "../bit-components";
import { addObject3DComponent } from "../utils/jsx-entity";

export interface PortalParams {
    uuid: String,
    bounds: Object,
    offset: Object,
    isInside: Boolean,
    name: String,
    target: String
}

const DEFAULTS = {
    uuid: "",
    bounds: { x: 1, y: 1, z: 2},
    offset: { x: 0, y: 0.5, z: 0},
    isInside: false,
    name: "",
    target: ""
};

export function inflatePortal(world: HubsWorld, eid: number, params: PortalParams) {
    const portalPros = Object.assign({}, DEFAULTS, params);

    addComponent(world, Portal, eid);

    const { uuid, bounds, offset, name, target } = portalPros;
    Portal.uuid[eid] = APP.getSid(uuid);
    Portal.bounds[eid].set([bounds.x, bounds.y, bounds.z]);
    Portal.offset[eid].set([offset.x, offset.y, offset.z]);
    Portal.name[eid] = APP.getSid(name);
    Portal.target[eid] = APP.getSid(target);

    const geo = new THREE.PlaneBufferGeometry(2, 2);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
    var plane = new THREE.Mesh(geo, mat);

    addObject3DComponent(world, eid, plane);
}

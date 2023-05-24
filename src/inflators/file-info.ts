import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { FileInfo } from "../bit-components";

export type FileInfoParams = {
  src?: string;
  id?: string;
};

export const FILE_INFO_FLAGS = {
  IS_PERMANENT: 1 << 0
};

export function inflateFileInfo(world: HubsWorld, eid: number, { src, id: fileId }: FileInfoParams) {
  addComponent(world, FileInfo, eid);
  FileInfo.flags[eid] = 0;
  if (fileId) {
    FileInfo.id[eid] = APP.getSid(fileId)!;
  }

  if (src) {
    FileInfo.src[eid] = APP.getSid(src)!;
  }
}

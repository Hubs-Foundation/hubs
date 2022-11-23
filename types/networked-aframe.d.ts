import { AElement } from "aframe";

declare global {
  const NAF: {
    utils: {
      isMine: (el: AElement) => boolean;
      takeOwnership: (el: AElement) => boolean;
      createNetworkId: () => string;
    };
    connection: {
      getServerTime: () => number;
      subscribeToDataChannel: (
        dataType: string,
        callback: (fromClientId: string, _dataType: string, data: any) => void
      ) => void;
      sendDataGuaranteed: (clientId: string, dataType: string, message: any) => void;
      broadcastDataGuaranteed: (dataType: string, message: any) => void;
    };
    clientId: string;
  };
}

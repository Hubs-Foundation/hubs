/** @jsx createElementEntity */
import { number, string } from "prop-types";
import { createElementEntity, renderAsEntity, Ref, createRef} from "../utils/jsx-entity";
import nametagSrc from "../assets/hud/nametag.9.png";
import  {textureLoader} from "../utils/media-utils";

const panelTexture = textureLoader.load(nametagSrc);


export interface PanelParams {
    text: string;
    panelRef: Ref
  }

export function AgentTextPanel({text, panelRef}: PanelParams){

    

    return(

        <entity name="agentPanel" ref={panelRef} slice9={{size: [0.6, 0.3], insets:[64, 66, 64, 66], texture: panelTexture }} position={[0,0.2,0.1]} scale={[1.0,1.0,1.0]}>

            <entity name="text" position={[0, 0, 0.01]} text={{ value: text, color: "#000000", textAlign: "center", anchorX: "center", anchorY: "middle", fontSize:0.05, maxWidth: 0.3 }}/>

        </entity>

    );

}
import { Vector3, Vector3Tuple } from "three";
import { HubsWorld } from "../app";
import { roomPropertiesReader } from "../utils/rooms-properties";
import { tutorialManager } from "./tutorial-system";
import { saveFile } from "../utils/ml-adapters";

const loggerDomain = "https://vox-logger.dev.vr-conference.lab.synelixis.com";
// const loggerDomain = "http://localhost:3000";
type trackArray = [number, number, number];

interface SpatialData {
  position: Vector3Tuple;
  direction: Vector3Tuple;
  timestamp: number;
}

interface CreateUiParams {
  user_id: number;
  button_name: string;
  result: string;
}

interface CreateAnnouncementParams {
  user_id: number;
  type: string;
  value: string;
}

interface CreateUserParams {
  has_agent: boolean;
  name?: string;
  role?: string;
}

interface CreateUserResponse {
  id: number;
  has_agent: boolean;
  updatedAt: number;
  createdAt: number;
  deteletedAt: number;
}

interface LoggerEndopoints {
  CREATE_USER: string;
  CREATE_UI: string;
  CREATE_SPATIAL: string;
  CREATE_AGENT: string;
  CREATE_ANNOUNCEMENT: string;
}

class Logger {
  loggerDomain: string;
  endopoints: LoggerEndopoints;
  userId: number;
  lastTrackTime: number;
  lastPostTime: number;
  spatialData: Array<SpatialData>;
  backupSpatialData: Array<SpatialData>;
  registered: boolean;
  isProccesingRequest: boolean;

  constructor(domain: string) {
    this.loggerDomain = domain;
    this.endopoints = {
      CREATE_USER: this.loggerDomain.concat("/register"),
      CREATE_AGENT: this.loggerDomain.concat("/add_agent_int"),
      CREATE_SPATIAL: this.loggerDomain.concat("/add_spatial_info"),
      CREATE_UI: this.loggerDomain.concat("/add_ui_int"),
      CREATE_ANNOUNCEMENT: this.loggerDomain.concat("/add_announc_int")
    };

    this.spatialData = new Array<SpatialData>();
    this.backupSpatialData = new Array<SpatialData>();
    this.registered = false;
    this.isProccesingRequest = false;
  }

  WaitUserRegistration(): Promise<any> {
    if (this.registered) return Promise.resolve(null);
    else
      return new Promise(resolve => {
        APP.scene!.addEventListener("user_registered", resolve, { once: true });
      });
  }

  async RegisterUser(reset: boolean = false) {
    if (reset || this.registered) return;

    const hasAgent = roomPropertiesReader.AllowsNav;
    const params: CreateUserParams = {
      has_agent: hasAgent,
      name: APP.store.state.profile.displayName,
      role: "mondayTest"
    };

    try {
      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json"
      };
      const response = await fetch(this.endopoints.CREATE_USER, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(params)
      });
      const data = (await response.json()) as CreateUserResponse;
      this.userId = data.id;
      this.registered = true;
      this.lastPostTime = Date.now();
      this.lastTrackTime = Date.now();
      APP.scene!.emit("user_registered");
    } catch (e) {
      console.log(e);
    }
  }

  async AddSpatialInfo(spatialData: Blob) {
    try {
      await this.WaitUserRegistration();
      this.isProccesingRequest = true;
      const formData = new FormData();
      formData.append("spatial_data", spatialData, "spatial_info.json");
      formData.append("user_id", this.userId.toString());
      const response = await fetch(this.endopoints.CREATE_SPATIAL, { body: formData, method: "POST" });
      if (response.ok) return `interaction  to : ${this.endopoints.CREATE_SPATIAL} registered`;
      else throw new Error("API response not ok");
    } catch (e) {
      return `could not register to : ${this.endopoints.CREATE_SPATIAL}`.concat(" ", e);
    }
  }

  async AddAgentInteraction(audioData: Blob, interactionData: Blob) {
    try {
      await this.WaitUserRegistration();
      // saveFile(audioData, "wav");
      // saveFile(interactionData, "json");
      // if (!this.userId) await this.RegisterUser();
      const formData = new FormData();
      formData.append("audio_data", audioData, "audio_data.wav");
      formData.append("interaction_data", interactionData, "agent_data.json");
      formData.append("user_id", this.userId.toString());
      const response = await fetch(this.endopoints.CREATE_AGENT, { method: "POST", body: formData });
      if (response.ok) return `interaction  to : ${this.endopoints.CREATE_AGENT} registered`;
      else throw new Error("API response not ok");
    } catch (e) {
      return `could not register to : ${this.endopoints.CREATE_AGENT}`.concat(" ", e);
    }
  }

  async AddUiInteraction(buttonName: string, result: string) {
    // if (!this.userId) await this.RegisterUser();
    console.log(`add ui`);
    await this.WaitUserRegistration();
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json"
    };
    const params: CreateUiParams = {
      user_id: this.userId,
      button_name: buttonName,
      result: result
    };
    console.log(params);
    try {
      const response = await fetch(this.endopoints.CREATE_UI, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(params)
      });
      if (response.ok) return `interaction  to : ${this.endopoints.CREATE_UI} registered`;
      else throw new Error("Endoint response not ok");
    } catch (e) {
      console.error(`could not register to : ${this.endopoints.CREATE_UI}`, e);
    }
  }
  async AddAnnouncementInteraction(type: string, value: string) {
    await this.WaitUserRegistration();
    // if (!this.userId) await this.RegisterUser();
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json"
    };
    const params: CreateAnnouncementParams = {
      user_id: this.userId,
      type: type,
      value: value
    };
    console.log(params);
    try {
      const response = await fetch(this.endopoints.CREATE_ANNOUNCEMENT, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(params)
      });
      if (response.ok) return `interaction  to : ${this.endopoints.CREATE_UI} registered`;
      else throw new Error("Endoint response not ok");
    } catch (e) {
      console.error(`could not register to : ${this.endopoints.CREATE_UI}`, e);
    }
  }

  async Tick() {
    if (this.lastTrackTime && Date.now() - this.lastTrackTime > 33) {
      const pos = tutorialManager.avatarHead.getWorldDirection(new Vector3()).toArray();
      const dir = tutorialManager.avatarHead.getWorldDirection(new Vector3()).toArray();
      this.spatialData.push({ position: pos, direction: dir, timestamp: Date.now() });
      this.lastTrackTime = Date.now();

      if (
        this.lastPostTime &&
        !this.isProccesingRequest &&
        Date.now() - this.lastPostTime > 30000 &&
        this.spatialData.length > 0
      ) {
        try {
          const trackStringData = JSON.stringify(this.spatialData);
          const trackDataBlob = new Blob([trackStringData], { type: "application/json" });
          this.spatialData = new Array<SpatialData>();
          this.AddSpatialInfo(trackDataBlob).then(response => {
            this.lastPostTime = Date.now();
            this.isProccesingRequest = false;
            console.log(response);
          });
        } catch (error) {
          console.log(error);
        }
      }
    }
  }
}

export const logger = new Logger(loggerDomain);

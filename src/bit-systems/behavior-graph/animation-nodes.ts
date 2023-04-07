import {
  AsyncNode,
  Engine,
  IGraphApi,
  makeFlowNodeDefinition,
  makeInNOutFunctionDesc,
  NodeDescription,
  NodeDescription2,
  Socket,
  ValueType
} from "@oveddan-behave-graph/core";
import {
  AdditiveAnimationBlendMode,
  AnimationAction,
  AnimationClip,
  LoopOnce,
  LoopRepeat,
  NormalAnimationBlendMode
} from "three";
import { HubsWorld } from "../../app";
import { MixerAnimatable } from "../../bit-components";
import { EntityID } from "../../utils/networking-types";
import { definitionListToMap } from "./utils";

export const animationValueDefs = {
  animationAction: new ValueType(
    "animationAction",
    () => null,
    (value: AnimationAction) => value,
    (value: AnimationAction) => value,
    (start: AnimationAction, _end: AnimationAction, _t: number) => start
  )
};

const createAnimationActionDef = makeFlowNodeDefinition({
  typeName: "animation/createAnimationAction",
  category: "Animation" as any,
  label: "Create AnimationAction",
  in: () => [
    { key: "flow", valueType: "flow" },
    { key: "clipName", valueType: "string" },
    { key: "loop", valueType: "boolean", defaultValue: true },
    { key: "clampWhenFinished", valueType: "boolean", defaultValue: false },
    { key: "weight", valueType: "float", defaultValue: 1 },
    { key: "timeScale", valueType: "float", defaultValue: 1 },
    { key: "additiveBlending", valueType: "boolean", defaultValue: false }
  ],
  initialState: undefined,
  out: { flow: "flow", action: "animationAction" },
  triggered: ({ read, write, commit, graph }) => {
    const clipName = read("clipName") as string;
    const loop = read("loop") as boolean;
    const clampWhenFinished = read("clampWhenFinished") as boolean;
    const weight = read("weight") as number;
    const timeScale = read("timeScale") as number;
    const additiveBlending = read("additiveBlending") as boolean;

    const rootEid = graph.getDependency<EntityID>("rootEntity")!;
    const world = graph.getDependency<HubsWorld>("world")!;
    const obj = world.eid2obj.get(rootEid)!;
    const mixer = MixerAnimatable.mixers.get(rootEid)!;

    const action = mixer.clipAction(AnimationClip.findByName(obj.animations, clipName));
    action.blendMode = additiveBlending ? AdditiveAnimationBlendMode : NormalAnimationBlendMode;
    action.setLoop(loop ? LoopRepeat : LoopOnce, Infinity);
    action.clampWhenFinished = clampWhenFinished;
    action.weight = weight;
    action.timeScale = timeScale;

    write("action", action);
    commit("flow");
  }
});

type ActionEventListener = (e: { action: AnimationAction }) => void;
export class PlayAnimationNode extends AsyncNode {
  public static Description = new NodeDescription2({
    typeName: "animation/play",
    otherTypeNames: ["flow/delay"],
    category: "Animation",
    label: "Play Animation",
    factory: (description, graph) => new PlayAnimationNode(description, graph)
  });

  constructor(description: NodeDescription, graph: IGraphApi) {
    super(
      description,
      graph,
      [
        new Socket("flow", "flow"), //
        new Socket("animationAction", "action"),
        new Socket("boolean", "reset", true)
      ],
      [
        new Socket("flow", "flow"), //
        new Socket("flow", "finished"),
        new Socket("flow", "loop"),
        new Socket("flow", "stopped")
      ]
    );
  }

  private state: {
    action?: AnimationAction;
    onLoop?: ActionEventListener;
    onFinished?: ActionEventListener;
    onStop?: ActionEventListener;
  } = {};

  clearState() {
    if (this.state.action) {
      this.state.action.getMixer().removeEventListener("finished", this.state.onFinished as any);
      this.state.action.getMixer().removeEventListener("loop", this.state.onLoop as any);
      this.state.action.getMixer().removeEventListener("hubs_stopped", this.state.onLoop as any);
      this.state = {};
    }
  }

  triggered(engine: Engine, _triggeringSocketName: string, finished: () => void) {
    if (this.state.action) {
      console.warn("already playing", this.state.action);
      this.clearState();
    }

    const action = this.readInput("action") as AnimationAction;
    const reset = this.readInput("reset") as boolean;

    this.state.action = action;
    this.state.onFinished = (e: { action: AnimationAction }) => {
      if (e.action != this.state.action) return;
      console.log("FINISH", e.action.getClip().name, APP.world.time.tick);
      // TODO HACK when transitioning to another animation in this event, even on the same frame, the object seems to reset to its base pisition momentarily without this
      e.action.enabled = true;
      this.clearState();
      engine.commitToNewFiber(this, "finished");
    };
    this.state.onLoop = (e: { action: AnimationAction }) => {
      if (e.action != this.state.action) return;
      engine.commitToNewFiber(this, "loop");
    };
    this.state.onStop = (e: { action: AnimationAction }) => {
      if (e.action != this.state.action) return;
      this.clearState();
      engine.commitToNewFiber(this, "stopped");
    };

    action.getMixer().addEventListener("finished", this.state.onFinished as any);
    action.getMixer().addEventListener("loop", this.state.onLoop as any);
    action.getMixer().addEventListener("hubs_stopped", this.state.onStop as any);

    if (reset) action.reset();
    action.paused = false;
    action.play();
    console.log("PLAY", action.getClip().name, APP.world.time.tick);

    engine.commitToNewFiber(this, "flow");
    finished();
  }

  // NOTE this does not get called if the AsyncNode has finished()
  dispose() {
    this.clearState();
  }
}

export const AnimationNodes = definitionListToMap([
  createAnimationActionDef,
  PlayAnimationNode.Description,
  makeFlowNodeDefinition({
    typeName: "animation/stop",
    category: "Animation" as any,
    label: "Stop Animation",
    in: () => [
      { key: "flow", valueType: "flow" },
      { key: "action", valueType: "animationAction" }
    ],
    initialState: undefined,
    out: { flow: "flow" },
    triggered: ({ read, commit }) => {
      const action = read("action") as AnimationAction;
      action.stop();

      console.log("STOP", action.getClip().name, APP.world.time.tick);
      action.getMixer().dispatchEvent({ type: "hubs_stopped", action });
      commit("flow");
    }
  }),
  makeFlowNodeDefinition({
    typeName: "animation/crossfadeTo",
    category: "Animation" as any,
    label: "Crossfade To Animation",
    in: () => [
      { key: "flow", valueType: "flow" },
      { key: "action", valueType: "animationAction" },
      { key: "toAction", valueType: "animationAction" },
      { key: "duration", valueType: "float" },
      { key: "warp", valueType: "boolean" }
    ],
    initialState: undefined,
    out: { flow: "flow" },
    triggered: ({ read, commit }) => {
      const action = read("action") as AnimationAction;
      const toAction = read("toAction") as AnimationAction;
      const duration = read("duration") as number;
      const warp = read("warp") as boolean;
      action.crossFadeTo(toAction, duration, warp);
      commit("flow");
    }
  }),
  makeFlowNodeDefinition({
    typeName: "three/animation/setTimescale",
    category: "Animation" as any,
    label: "Set timeScale",
    in: () => [
      { key: "flow", valueType: "flow" },
      { key: "action", valueType: "animationAction" },
      { key: "timeScale", valueType: "float" }
    ],
    initialState: undefined,
    out: { flow: "flow" },
    triggered: ({ read, commit }) => {
      const action = read("action") as AnimationAction;
      const timeScale = read("timeScale") as number;
      action.timeScale = timeScale;
      commit("flow");
    }
  }),
  makeInNOutFunctionDesc({
    name: "animation/isRunning",
    label: "Is Animation Running?",
    category: "Animation" as any,
    in: [{ action: "animationAction" }],
    out: "boolean",
    exec: (action: AnimationAction) => {
      return action.isRunning();
    }
  })
]);

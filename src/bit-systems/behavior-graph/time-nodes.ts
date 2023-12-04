import {
  AsyncNode,
  Engine,
  EventEmitter,
  IGraphApi,
  NodeDescription,
  NodeDescription2,
  Socket,
  makeFlowNodeDefinition
} from "@oveddan-behave-graph/core";
import { definitionListToMap } from "./utils";

const timers = new Map<number, EventEmitter<number>>();

type TimerEventListener = (timerId: number) => void;

class SetTimer extends AsyncNode {
  public static Description = new NodeDescription2({
    typeName: "time/set",
    otherTypeNames: ["flow/delay"],
    category: "Time",
    label: "Set Timer",
    factory: (description, graph) => new SetTimer(description, graph)
  });

  constructor(description: NodeDescription, graph: IGraphApi) {
    super(
      description,
      graph,
      [new Socket("flow", "flow"), new Socket("float", "duration", 1), new Socket("boolean", "loop", false)],
      [new Socket("flow", "flow"), new Socket("integer", "timerId", 0), new Socket("flow", "exec")]
    );
  }

  private state: {
    timerId?: number;
    started?: boolean;
    onFinished?: TimerEventListener;
  } = {};

  clearState() {
    if (this.state.timerId) {
      const emitter = timers.get(this.state.timerId);
      if (emitter) {
        emitter.removeListener(this.state.onFinished!);
      }
      timers.delete(this.state.timerId);
      this.state = {};
    }
  }

  triggered(engine: Engine, triggeringSocketName: string, finished: () => void) {
    if (this.state.started) {
      return;
    }

    this.state.started = true;

    const loop = this.readInput("loop");
    if (loop) {
      this.state.timerId = setInterval(() => {
        if (!this.state.started) return;
        engine.commitToNewFiber(this, "exec");
      }, this.readInput<number>("duration") * 1000) as any;
    } else {
      this.state.timerId = setTimeout(() => {
        if (!this.state.started) return;
        engine.commitToNewFiber(this, "exec");
        if (this.state.onFinished) {
          this.state.onFinished(this.state.timerId!);
        }
      }, this.readInput<number>("duration") * 1000) as any;
    }

    const emitter = new EventEmitter<number>();
    this.state.onFinished = (timerId: number) => {
      this.clearState();
      finished();
    };
    emitter.addListener(this.state.onFinished);
    timers.set(this.state.timerId!, emitter);

    this.writeOutput("timerId", this.state.timerId);
    engine.commitToNewFiber(this, "flow");
  }

  dispose() {
    this.clearState();
  }
}

export const TimerNodes = definitionListToMap([
  SetTimer.Description,
  makeFlowNodeDefinition({
    typeName: "timer/clear",
    category: "Time" as any,
    label: "Clear Timer",
    in: () => [
      { key: "flow", valueType: "flow" },
      { key: "timerId", valueType: "integer" }
    ],
    initialState: undefined,
    out: { flow: "flow" },
    triggered: ({ read, commit, graph, configuration }) => {
      const timerId = read("timerId") as number;
      if (timerId) {
        clearInterval(timerId);
        const emitter = timers.get(timerId as any);
        emitter?.emit(timerId);
      }
      commit("flow");
    }
  })
]);

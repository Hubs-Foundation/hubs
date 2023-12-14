import { makeFlowNodeDefinition, makeFunctionNodeDefinition, SocketsList } from "@oveddan-behave-graph/core";
import { HubsWorld } from "../../app";
import { definitionListToMap } from "./utils";
import { getComponentBindings } from "./bindings/bindings";
import { EntityID } from "../../bit-components";
import { takeOwnership } from "../../utils/take-ownership";

export const MaterialNodes = definitionListToMap([
  makeFlowNodeDefinition({
    typeName: "material/property/set",
    category: "Materials" as any,
    label: "Set Material Property",
    configuration: {
      property: {
        valueType: "string"
      },
      type: {
        valueType: "string"
      },
      networked: {
        valueType: "boolean"
      }
    },
    in: configuration => {
      const propertyName = configuration.property || "string";
      const type = configuration.type || "string";

      const sockets: SocketsList = [
        {
          key: "flow",
          valueType: "flow"
        },
        {
          key: "material",
          valueType: "material"
        },
        {
          key: propertyName,
          valueType: type,
          label: propertyName
        }
      ];

      return sockets;
    },
    initialState: undefined,
    out: { flow: "flow" },
    triggered: ({ read, commit, configuration, graph }) => {
      const world = graph.getDependency("world") as HubsWorld;

      const propertyName = configuration.property as string;
      const type = configuration.type as string;

      const matEid = read<EntityID>("material");
      const value = read(propertyName) as any;

      if (configuration.networked) {
        takeOwnership(world, matEid);
      }

      const { set } = getComponentBindings("material");
      set!(world, matEid, { [propertyName]: value });

      commit("flow");
    }
  }),
  makeFunctionNodeDefinition({
    typeName: "material/property/get",
    category: "Materials" as any,
    label: "Get Material Property",
    configuration: {
      property: {
        valueType: "string"
      },
      type: {
        valueType: "string"
      },
      networked: {
        valueType: "boolean"
      }
    },
    in: configuration => {
      const sockets: SocketsList = [
        {
          key: "material",
          valueType: "material"
        }
      ];

      return sockets;
    },
    out: configuration => {
      const propertyName = configuration.property || "string";
      const type = configuration.type || "string";

      const result: SocketsList = [
        {
          key: propertyName,
          valueType: type,
          label: propertyName
        }
      ];

      return result;
    },
    exec: ({ read, write, configuration, graph }) => {
      const world = graph.getDependency("world") as HubsWorld;

      const propertyName = configuration.property as string;
      const type = configuration.type as string;

      const matEid = read("material") as EntityID;

      if (configuration.networked) {
        takeOwnership(world, matEid);
      }

      const { get } = getComponentBindings("material")!;
      const material = get!(APP.world, matEid);
      write(propertyName, material[propertyName]);
    }
  }),
  makeFlowNodeDefinition({
    typeName: "material/set",
    category: "Materials" as any,
    label: "Set Material",
    in: {
      flow: "flow",
      entity: "entity",
      material: "material"
    },
    out: { flow: "flow" },
    configuration: {
      networked: { valueType: "boolean" }
    },
    initialState: undefined,
    triggered: ({ read, commit, graph, configuration }) => {
      const world = graph.getDependency<HubsWorld>("world")!;
      const entity = read<EntityID>("entity");
      const matEid = read<EntityID>("material");

      if (configuration.networked) {
        takeOwnership(world, entity);
      }

      const { set } = getComponentBindings("object-material")!;
      set!(world, entity, matEid);

      commit("flow");
    }
  })
]);

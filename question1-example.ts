type TunnelLocation = string;

type TunnelInput = {
  start_location: TunnelLocation;
  end_location: TunnelLocation;
  max_cars_per_hour: number;
};

type Tunnel = {
  startLocation: TunnelLocation;
  routes: Route[];
};

type Route = {
  destination: Tunnel[];
  max_cars_per_hour: number;
};

type TunnelRoute = {
  destination: TunnelVertex;
  maxCapacityPerHour: number;
};

type TunnelVertex = {
  parents: TunnelVertex[];
  children: TunnelRoute[];
  location: TunnelLocation;
};

type TunnelPathSegment = {
  from: TunnelVertex;
  to: TunnelVertex;
  maxCapacityPerHour: number;
};

type PathInfo = {
  visited: Set<TunnelVertex>;
  allPaths: Array<TunnelVertex>[];
  path: TunnelVertex[];
};

class TunnelGraph {
  input: TunnelInput[];
  head: TunnelVertex;
  tail: TunnelVertex;

  constructor(input: TunnelInput[]) {
    this.input = input;

    // keep track of vertexes as we parse input
    const tunnelVertexes = new Map<TunnelLocation, TunnelVertex>();

    // build vertexes from input
    input.forEach((tunnelInput) => {
      const { start_location, end_location } = tunnelInput;
      const tunnelVertex: TunnelVertex = {
        parents: [],
        children: [],
        location: start_location,
      };
      if (!tunnelVertexes.has(start_location)) {
        tunnelVertexes.set(start_location, tunnelVertex);
      } else if (!tunnelVertexes.has(end_location)) {
        tunnelVertex.location = end_location;
        tunnelVertexes.set(end_location, tunnelVertex);
      }
    });

    // link vertexes into graph, supporting multiple parents and children
    input.forEach((tunnelInput) => {
      const { start_location, end_location, max_cars_per_hour } = tunnelInput;
      const startVertex = tunnelVertexes.get(start_location);
      const endVertex = tunnelVertexes.get(end_location);
      startVertex.children.push({
        destination: endVertex,
        maxCapacityPerHour: max_cars_per_hour,
      });
      endVertex.parents.push(startVertex);
    });

    // find head and tail vertex
    let headVertex: TunnelVertex;
    let tailVertex: TunnelVertex;
    tunnelVertexes.forEach((tunnelVertex, location) => {
      if (tunnelVertex.parents.length === 0) {
        headVertex = tunnelVertex;
      }
      if (tunnelVertex.children.length === 0) {
        tailVertex = tunnelVertex;
      }
    });

    this.head = headVertex;
    this.tail = tailVertex;
  }

  findAllRoutes(): Array<TunnelPathSegment>[] {
    // return an array of routes (array of segments)
    const allRoutes: Array<TunnelPathSegment>[] = [];
    this.findAllPaths().forEach((path) => {
      const route: Array<TunnelPathSegment> = [];
      for (let i = 0; i < path.length - 1; i++) {
        const from = path[i];
        const to = path[i + 1];
        const maxCapacityPerHour = this.findMaxCapacityOfRoute(from, to);
        route.push({
          from,
          to,
          maxCapacityPerHour,
        });
      }
      allRoutes.push(route);
    });
    return allRoutes;
  }

  findMaxCapacityOfRoute(from: TunnelVertex, to: TunnelVertex) {
    // find the max cars per hour value for the specific segment between the two vertexes
    for (let i = 0; i < from.children.length; i++) {
      const tunnelRoute = from.children[i];
      if (tunnelRoute.destination === to) {
        return tunnelRoute.maxCapacityPerHour;
      }
    }
    // up to caller to handle
    return -1;
  }

  findAllPaths() {
    const pathInfo: PathInfo = {
      allPaths: [],
      path: [],
      visited: new Set(),
    };
    this.DFS(this.head, pathInfo);
    return pathInfo.allPaths;
  }

  DFS(tunnelVertex: TunnelVertex, pathInfo: PathInfo) {
    if (pathInfo.visited.has(tunnelVertex)) {
      return;
    }
    pathInfo.visited.add(tunnelVertex);
    pathInfo.path.push(tunnelVertex);
    if (tunnelVertex === this.tail) {
      pathInfo.allPaths.push([...pathInfo.path]);
      pathInfo.visited.delete(tunnelVertex);
    }
    tunnelVertex.children.forEach((tunnelRoute) => {
      this.DFS(tunnelRoute.destination, pathInfo);
    });
    pathInfo.path.pop();
    pathInfo.visited.delete(tunnelVertex);
  }

  calcTunnelNetworkMaxCapacityPerHour() {
    const routes = this.findAllRoutes();
    const routeMaxPerHour = routes.map((tunnelPathSegments) =>
      tunnelPathSegments.map(
        (tunnelPathSegment) => tunnelPathSegment.maxCapacityPerHour
      )
    );
    const smallestMaxCapacityByRoute = routeMaxPerHour.map(
      (tunnelPathSegments) =>
        tunnelPathSegments.reduce((accumulator, current) =>
          Math.min(accumulator, current)
        )
    );
    smallestMaxCapacityByRoute.sort();
    return smallestMaxCapacityByRoute[smallestMaxCapacityByRoute.length - 1];
  }
}

// main program
const input: Array<TunnelInput> = [
  {
    start_location: "A",
    end_location: "B",
    max_cars_per_hour: 5,
  },
  {
    start_location: "B",
    end_location: "C",
    max_cars_per_hour: 2,
  },
  {
    start_location: "B",
    end_location: "D",
    max_cars_per_hour: 6,
  },
  {
    start_location: "C",
    end_location: "E",
    max_cars_per_hour: 3,
  },
  {
    start_location: "A",
    end_location: "F",
    max_cars_per_hour: 7,
  },
  {
    start_location: "D",
    end_location: "E",
    max_cars_per_hour: 10,
  },
  {
    start_location: "F",
    end_location: "G",
    max_cars_per_hour: 8,
  },
  {
    start_location: "E",
    end_location: "G",
    max_cars_per_hour: 4,
  },
];

const tunnelGraph = new TunnelGraph(input);
const maxCapacityPerHour = tunnelGraph.calcTunnelNetworkMaxCapacityPerHour();
console.log(maxCapacityPerHour);

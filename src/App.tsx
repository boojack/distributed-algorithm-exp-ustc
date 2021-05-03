import React, { useEffect, useState } from "react";
import { broatcast, initRootNode, Node } from "./broadcast";
import { electLeader, initNodes } from "./optimized_async_ring_election";
import "./App.css";

function getNodesList(pr: Node): Node[][] {
  const nodes = [];
  let currNodes = [pr];

  while (currNodes.length > 0) {
    nodes.push(currNodes);
    let children = [];

    for (const node of currNodes) {
      children.push(...node.children);
    }

    currNodes = children;
  }

  return nodes;
}

const root = initRootNode();
const now = Date.now();

function App() {
  const [count, setCount] = useState(0);
  const nodes = getNodesList(root);

  useEffect(() => {
    broatcast(root, () => {
      setCount(Date.now());
    });
    // just for test async ring election
    const nodes = initNodes();
    console.log(electLeader(nodes));
  }, []);

  return (
    <div className="App">
      <p>已耗时：{(count - now) / 1000} s</p>
      {nodes.map((ns, idx) => (
        <div className="node-container" key={idx}>
          {ns.map((n) => (
            <span className={"node-item " + (n.terminated ? "finished" : "")} key={n.id}>
              {n.id}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default App;

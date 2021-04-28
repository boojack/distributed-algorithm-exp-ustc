export class Node {
  static count: number = 0;

  public id: number;
  public parent: Node = this;
  public children: Node[] = [];
  public terminated: boolean = false;

  constructor(parent?: Node, children?: Node[], terminated?: boolean) {
    this.id = Node.count++;
    if (parent !== undefined) {
      this.parent = parent;
    }
    if (children !== undefined) {
      this.children = children;
    }
    if (terminated !== undefined) {
      this.terminated = terminated;
    }
  }
}

// 构造深度为 k 的"网络"树，默认为 6
export function initRootNode(k: number = 6) {
  const pr = new Node();
  let nodes = [pr];
  let i = 1;

  while (i < k) {
    let children = [];

    for (const parent of nodes) {
      // n 为分支上节点的数量，这里先固定为 2
      for (let n = 0; n < 2; n++) {
        const child = new Node(parent);

        parent.children.push(child);
        children.push(child);
      }
    }

    nodes = children;
    i++;
  }

  return pr;
}

// 模拟广播消息的传送
// cb 为视图更新，与该广播消息传送的逻辑无关
export async function broatcast(node: Node, cb: () => any) {
  // 模拟消息传输以及处理的随机时延
  if (node.id !== 0) {
    await wait(1000 + Math.random() * 2000);
  }
  for (const child of node.children) {
    broatcast(child, cb);
  }
  node.terminated = true;
  cb();
}

function wait(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

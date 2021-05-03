/**
 * 时间复杂度为 O(n2) 的 Message 定义
 * type 表示消息类型：为 0 是普通消息，为 1 是终止消息
 */
export interface Message {
  type: 0 | 1;
  sender: Node;
  senderIdx: number;
  receiver: Node;
  receiverIdx: number;
  msg: number;
}

// 采用随机 id，最后选举出来的 leader id 应该是 9
const randomID = [5, 3, 7, 1, 6, 2, 4, 9, 0, 8];

export class Node {
  static count: number = 0;

  public id: number;
  public terminated: boolean = false;
  public isLeader: boolean = false;

  constructor() {
    // this.id = Node.count++;
    // 采用随机 id
    this.id = randomID.shift() ?? 0;
  }
}

// 构造节点数为 10 的环
export function initNodes(k: number = 10): Node[] {
  const nodes: Node[] = [];
  let i = 0;

  while (i < k) {
    nodes.push(new Node());
    i++;
  }

  return nodes;
}

export function electLeader(nodes: Node[]) {
  const msgBox = new Array<Message>();
  let leader = null;

  // 1. 所有处理器向左邻居发送一个含有自己 id 的标识符
  for (let i = 0; i < nodes.length; i++) {
    const receiverIdx = (i - 1 + 10) % nodes.length;

    msgBox.push({
      type: 0,
      sender: nodes[i],
      senderIdx: i,
      receiver: nodes[receiverIdx],
      receiverIdx,
      msg: nodes[i].id,
    });
  }

  while (msgBox.length > 0) {
    const currMsg = msgBox.shift();

    if (currMsg === undefined) {
      break;
    }

    const { type, receiver, msg } = currMsg;

    const receiverIdx = (currMsg.receiverIdx - 1 + 10) % nodes.length;

    if (receiver.terminated) {
      continue;
    }

    if (type === 1) {
      receiver.terminated = true;
      msgBox.push({
        type: 1,
        sender: receiver,
        senderIdx: currMsg.receiverIdx,
        receiver: nodes[receiverIdx],
        receiverIdx,
        msg,
      });

      continue;
    }

    if (receiver.id < msg) {
      msgBox.push({
        type: 0,
        sender: receiver,
        senderIdx: currMsg.receiverIdx,
        receiver: nodes[receiverIdx],
        receiverIdx,
        msg,
      });
    } else if (receiver.id === msg) {
      leader = receiver;
      receiver.terminated = true;
      receiver.isLeader = true;

      msgBox.push({
        type: 1,
        sender: receiver,
        senderIdx: currMsg.receiverIdx,
        receiver: nodes[receiverIdx],
        receiverIdx,
        msg,
      });
    }
  }

  return leader;
}

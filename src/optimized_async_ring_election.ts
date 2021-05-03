/**
 * 时间复杂度为 O(n*lgn) 的 Message 定义
 * type 表示消息类型：为 probe/reply 是普通消息，为 terminated 是终止消息
 */
export interface Message {
  type: "probe" | "reply" | "terminated";
  sender: Node;
  senderIdx: number;
  receiver: Node;
  receiverIdx: number;
  phase: number;
  hop: number;
  msg: number;
}

// 采用随机 id，最后选举出来的 leader id 应该是 9
const randomID = [5, 3, 7, 1, 6, 2, 4, 9, 0, 8];
let id = 0;
export class Node {
  public id: number;
  public terminated: boolean = false;
  public isLeader: boolean = false;

  public isTempLeader: boolean = true;
  public receivedLeftReply: boolean = false;
  public receivedRightReply: boolean = false;

  constructor() {
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
  let msgBox = new Array<Message>();
  let leader = null;
  let phase = 0;

  do {
    msgBox = [];
    let tempLeader = [];

    // 让所有可能成为 leader 的节点向邻居发送 probe 消息
    for (let i = 0; i < nodes.length; i++) {
      if (!nodes[i].isTempLeader) {
        continue;
      } else {
        tempLeader.push(nodes[i]);
      }

      const leftReceiverIdx = (i - 1 + nodes.length) % nodes.length;
      const rightReceiverIdx = (i + 1 + nodes.length) % nodes.length;

      msgBox.push({
        type: "probe",
        sender: nodes[i],
        senderIdx: i,
        receiver: nodes[leftReceiverIdx],
        receiverIdx: leftReceiverIdx,
        phase: phase,
        hop: 0,
        msg: nodes[i].id,
      });

      msgBox.push({
        type: "probe",
        sender: nodes[i],
        senderIdx: i,
        receiver: nodes[rightReceiverIdx],
        receiverIdx: rightReceiverIdx,
        phase: phase,
        hop: 0,
        msg: nodes[i].id,
      });
    }

    if (tempLeader.length === 1) {
      leader = tempLeader[0];
      break;
    }

    for (let i = 0; i < 2 * Math.pow(2, phase); i++) {
      const tempMsgBox = new Array<Message>();

      for (const currMsg of msgBox) {
        if (currMsg === undefined) {
          break;
        }

        const { type, receiver, senderIdx, receiverIdx, phase, hop, msg } = currMsg;

        const direction = (receiverIdx > senderIdx && senderIdx !== 0) || receiverIdx === 0 ? "right" : "left";
        const leftReceiverIdx = (receiverIdx - 1 + nodes.length) % nodes.length;
        const rightReceiverIdx = (receiverIdx + 1 + nodes.length) % nodes.length;
        const nextReceiverIdx = direction === "left" ? leftReceiverIdx : rightReceiverIdx;

        if (receiver.terminated) {
          continue;
        }

        if (type === "terminated") {
          receiver.terminated = true;

          tempMsgBox.push({
            type: "terminated",
            sender: receiver,
            senderIdx: receiverIdx,
            receiver: nodes[nextReceiverIdx],
            receiverIdx: nextReceiverIdx,
            phase,
            hop: 0,
            msg,
          });
        } else if (type === "probe") {
          if (receiver.id === msg) {
            leader = receiver;
            receiver.terminated = true;
            receiver.isLeader = true;

            tempMsgBox.push({
              type: "terminated",
              sender: receiver,
              senderIdx: receiverIdx,
              receiver: nodes[leftReceiverIdx],
              receiverIdx: leftReceiverIdx,
              phase,
              hop: 0,
              msg,
            });
            tempMsgBox.push({
              type: "terminated",
              sender: receiver,
              senderIdx: receiverIdx,
              receiver: nodes[rightReceiverIdx],
              receiverIdx: rightReceiverIdx,
              phase,
              hop: 0,
              msg,
            });
          } else if (receiver.id < msg && hop + 1 < Math.pow(2, phase)) {
            tempMsgBox.push({
              type: "probe",
              sender: receiver,
              senderIdx: receiverIdx,
              receiver: nodes[nextReceiverIdx],
              receiverIdx: nextReceiverIdx,
              phase,
              hop: hop + 1,
              msg,
            });
          } else if (receiver.id < msg && hop + 1 >= Math.pow(2, phase)) {
            const revReceiverIdx = nextReceiverIdx === leftReceiverIdx ? rightReceiverIdx : leftReceiverIdx;

            tempMsgBox.push({
              type: "reply",
              sender: receiver,
              senderIdx: receiverIdx,
              receiver: nodes[revReceiverIdx],
              receiverIdx: revReceiverIdx,
              phase,
              hop: 0,
              msg,
            });
          }
        } else {
          if (receiver.id === msg) {
            if (direction === "left") {
              receiver.receivedRightReply = true;
            } else {
              receiver.receivedLeftReply = true;
            }
          } else {
            tempMsgBox.push({
              type: "reply",
              sender: receiver,
              senderIdx: receiverIdx,
              receiver: nodes[nextReceiverIdx],
              receiverIdx: nextReceiverIdx,
              phase,
              hop: 0,
              msg,
            });
          }
        }
      }

      for (const t of tempLeader) {
        t.isTempLeader = t.receivedLeftReply && t.receivedRightReply;
        t.receivedLeftReply = false;
        t.receivedRightReply = false;
      }

      msgBox = tempMsgBox;
    }
    phase++;
  } while (msgBox.length > 0);

  return leader;
}

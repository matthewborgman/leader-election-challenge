import { Component, Input } from '@angular/core';
import { Message, MessageType, Node, Nodes } from '../message';
import { ServerNodeBase } from '../server-node-base';

@Component({
  selector: 'app-server-node',
  imports: [],
  templateUrl: './server-node.html',
  styleUrl: './server-node.scss',
})
export class ServerNode extends ServerNodeBase {
  @Input() name: string = 'default';

  color: string = 'green';
  info: string = 'Hello World!';
  leader: string = 'Unknown';
  nodeState: Node = {
    isLead: false,
    isOnline: true,
    name: '',
  };
  nodes: Nodes = [];

  private HEALTHCHECK_INTERVAL: number = 10000;
  private MAX_TRAFFIC_DELAY: number = 15000;

  private addNodeToChain(nodeToAdd: Node) {
    // Find first node without a child node
    // NOTE: Assumes last node never has a child node
    let currentLastNode = this.nodes.find(
      (node) => !node.childNode && node.isOnline
    );

    // Link last and new nodes
    if (currentLastNode) {
      nodeToAdd.parentNode = currentLastNode;
      nodeToAdd.isLead = false;

      currentLastNode.childNode = nodeToAdd;

      this.nodes.push(nodeToAdd);
    }

    // Link lead node to last node
    const leadNode = this.nodes.find((node) => node.isLead && node.isOnline);

    if (leadNode) {
      leadNode.parentNode = nodeToAdd;
    }
  }

  private disableNodeInChain(nodeToDisable: Node) {
    const nodeToDisableIndex = this.nodes.findIndex(
      (node) => node.name === nodeToDisable.name
    );
    const nodeToDisableIsLead = nodeToDisableIndex === 0;

    // Link disabled node's parent and child nodes
    if (nodeToDisableIndex !== -1) {
      if (nodeToDisable.parentNode) {
        nodeToDisable.parentNode.childNode = nodeToDisable.childNode;
      }

      if (nodeToDisable.childNode) {
        nodeToDisable.childNode.parentNode = nodeToDisable.parentNode;
      }

      nodeToDisable.isLead = false;
      nodeToDisable.isOnline = false;
    } else {
      console.warn(`Node "${nodeToDisable.name}" could not be disabled`);
    }
  }

  private enableNodeInChain(nodeToEnable: Node) {
    const nodeToEnableIndex = this.nodes.findIndex(
      (node) => node.name === nodeToEnable.name
    );

    // Link enabled node to its parent and child nodes
    if (nodeToEnableIndex !== -1) {
      if (nodeToEnable.parentNode) {
        nodeToEnable.parentNode.childNode = nodeToEnable;
      }

      if (nodeToEnable.childNode) {
        nodeToEnable.childNode.parentNode = nodeToEnable;
      }

      nodeToEnable.isLead = false;
      nodeToEnable.isOnline = true;
    } else {
      console.warn(`Node "${nodeToEnable.name}" could not be enabled`);
    }
  }

  private generateSomeTraffic() {
    const delay = Math.floor(Math.random() * this.MAX_TRAFFIC_DELAY) + 1;
    const fun = delay % 2 ? this.randomCall(this) : this.randomCast(this);
    setTimeout(fun, delay);
  }

  private getLeadNode() {
    return this.nodes.find((node) => node.isLead && node.isOnline);
  }

  private handleNodeOffline(offlineNode: Node) {
    this.disableNodeInChain(offlineNode);

    this.broadcast(new Message(this.name, MessageType.UpdateState, this.nodes));
  }

  private handleNodeOnline(onlineNode: Node) {
    this.enableNodeInChain(onlineNode);

    this.startHealthcheck();

    this.broadcast(new Message(this.name, MessageType.UpdateState, this.nodes));
  }

  private handleNodePromotion(offlineNode?: Node) {
    const currentNodeInNodesIndex = this.nodes.findIndex(
      (node) => node.name === this.nodeState.name
    );

    // Set current node to lead
    this.leader = this.nodeState.name;
    this.nodeState.isLead = true;
    this.nodes[currentNodeInNodesIndex] = this.nodeState;

    console.log(`Promoted "${this.nodeState.name}" to lead`);

    if (offlineNode) {
      this.handleNodeOffline(offlineNode);
    }

    this.startHealthcheck();
  }

  private isLeadNode() {
    return this.nodeState.isLead;
  }

  onOffline() {
    this.leader = 'Unknown';
    this.color = 'grey';
    this.info = 'Went Offline';

    if (this.nodeState.parentNodeHealthcheckId) {
      this.stopHealthcheck(this.nodeState.parentNodeHealthcheckId);

      console.log(
        `Stopped healthcheck of "${this.nodeState.parentNode?.name}" (${this.nodeState.parentNodeHealthcheckId}) by "${this.nodeState.name}" due to going offline`
      );
    }

    this.nodeState.isOnline = false;
    this.nodeState.parentNodeHealthcheckId = undefined;
  }

  onOnline() {
    this.leader = this.name;
    this.color = 'green';
    this.info = 'Back Online';

    this.nodeState.isOnline = true;

    this.broadcast(
      new Message(this.nodeState.name, MessageType.NodeOnline, [this.nodeState])
    );
  }

  onInit() {
    const nodeState: Node = {
      name: this.name,
      isLead: true,
      isOnline: true,
    };

    this.nodeState = nodeState;

    this.leader = this.name;

    this.nodes.push({ ...nodeState });

    this.broadcast(new Message(this.name, MessageType.NewMember, this.nodes));
    // this.generateSomeTraffic();
  }

  receiveCall(message: Message): Message {
    this.info = `${message.senderName} gave me a call`;

    const node = message.payload?.[0];
    let response: Message;

    switch (message.message) {
      case MessageType.NodeOffline:
        if (node) {
          this.handleNodeOffline(node);
        }

        response = new Message(this.name, MessageType.CoolStoryBro);

        break;
      case MessageType.Ping:
        response = new Message(this.name, MessageType.Pong);

        break;
      default:
        response = new Message(this.name, MessageType.CoolStoryBro);

        break;
    }

    return response;
  }

  receiveCast(message: Message) {
    // Handle node added
    if (this.isLeadNode() && message.message === MessageType.NewMember) {
      if (this.nodeState.parentNodeHealthcheckId) {
        this.stopHealthcheck(this.nodeState.parentNodeHealthcheckId);

        console.log(
          `Stopped existing healthcheck of "${this.nodeState.parentNode?.name}" (${this.nodeState.parentNodeHealthcheckId}) by "${this.nodeState.name}" due to added node`
        );

        this.nodeState.parentNodeHealthcheckId = undefined;
      }

      if (message.payload?.length) {
        this.addNodeToChain(message.payload[0]);
      }

      this.startHealthcheck();

      this.broadcast(
        new Message(this.name, MessageType.UpdateState, this.nodes)
      );
    }

    // Handle node going offline
    else if (this.isLeadNode() && message.message === MessageType.NodeOffline) {
      // if (message.payload?.length) {
      //   this.handleNodeOffline(message.payload[0]);
      // }
    }

    // Handle node going online
    else if (this.isLeadNode() && message.message === MessageType.NodeOnline) {
      if (message.payload?.length) {
        this.handleNodeOnline(message.payload[0]);
      }
    }

    // Handle updates in non-parent nodes
    else if (message.message === MessageType.UpdateState) {
      if (message.payload) {
        this.nodes = message.payload;

        this.info = `${message.senderName} triggered updated state`;
        this.leader = this.getLeadNode()?.name ?? '';

        // Promote self if lead known isn't set (e.g. sole node)
        // TODO: Handle race when no leader is found by multiple nodes at the same time
        if (!this.leader) {
          this.handleNodePromotion();
        } else {
          this.startHealthcheck();
        }
      }
    } else {
      this.info = `${message.senderName} sent me a cast`;
    }
  }

  private startHealthcheck() {
    const latestNodeState = this.nodes.find(
      (node) => node.name === this.nodeState.name
    );

    if (!latestNodeState) {
      throw new Error(
        `Experienced unexpected scenario: node "${this.nodeState.name}" not found in broadcasted nodes`
      );
    }

    const {
      name: latestNodeName,
      parentNode: latestNodeParentNode,
      parentNodeHealthcheckId: latestNodeParentNodeHealthcheckId,
    } = latestNodeState;
    const {
      isLead: localNodeIsLead,
      name: localNodeName,
      parentNode: localNodeParentNode,
      parentNodeHealthcheckId: localNodeParentNodeHealthcheckId,
    } = this.nodeState ?? {};

    // Stop healthcheck of changed parent node
    if (
      localNodeParentNode?.name !== latestNodeParentNode?.name &&
      localNodeParentNodeHealthcheckId !== latestNodeParentNodeHealthcheckId
    ) {
      if (localNodeParentNodeHealthcheckId !== undefined) {
        this.stopHealthcheck(localNodeParentNodeHealthcheckId);

        this.nodeState.parentNodeHealthcheckId = undefined;
        this.nodeState.parentNode = undefined;

        console.log(
          `Stopped existing healthcheck of "${localNodeParentNode?.name}" (${localNodeParentNodeHealthcheckId}) by "${localNodeName}" due to changed parent node`
        );
      }
    }

    // Start healthcheck if new parent node
    if (
      localNodeParentNodeHealthcheckId === undefined &&
      localNodeName !== localNodeParentNode?.name
    ) {
      const { parentNode } = latestNodeState;

      if (!parentNode) {
        throw new Error(
          `Experienced unexpected scenario: parent node and parent node healthcheck mismatch for "${localNodeName}"`
        );
      }

      if (parentNode.isOnline) {
        const parentNodeHealthcheckId = setInterval(async () => {
          try {
            await this.sendCall(
              parentNode.name,
              new Message(localNodeName, MessageType.Ping)
            );
          } catch (error) {
            if (this.nodeState.parentNode === undefined) {
              throw new Error(
                `Experienced unexpected scenario: unable to handle failed healthcheck for parent node of "${this.nodeState.name}"`
              );
            }

            // Stop healthcheck from recurring
            if (this.nodeState.parentNodeHealthcheckId) {
              this.stopHealthcheck(this.nodeState.parentNodeHealthcheckId);

              console.log(
                `Stopped healthcheck of "${this.nodeState.parentNode?.name}" (${this.nodeState.parentNodeHealthcheckId}) by "${this.nodeState.name}" due to timeout`
              );

              this.nodeState.parentNodeHealthcheckId = undefined;
            }

            // Promote self if failed parent node is lead, then broadcast update
            if (this.nodeState.parentNode?.isLead) {
              this.handleNodePromotion(this.nodeState.parentNode);
            }

            // Notify failed node is offline
            else if (this.nodeState.parentNode) {
              const leadNode = this.getLeadNode();

              // Notify lead node directly
              try {
                if (leadNode?.name) {
                  await this.sendCall(
                    leadNode.name,
                    new Message(localNodeName, MessageType.NodeOffline, [
                      this.nodeState.parentNode,
                    ])
                  );
                } else {
                  throw new Error(`Known lead node is not available`, {
                    cause: leadNode,
                  });
                }
              } catch (error) {
                this.handleNodePromotion(leadNode);
              }
            } else {
              throw new Error(`Experienced unexpected scenario`);
            }
          }
        }, this.HEALTHCHECK_INTERVAL);

        // Sync internal state
        this.nodeState = latestNodeState;
        this.nodeState.parentNodeHealthcheckId = parentNodeHealthcheckId;

        console.log(
          `Started new healthcheck of "${parentNode?.name}" (${parentNodeHealthcheckId}) by "${localNodeName}"`
        );
      } else {
        console.log(
          `Skipped starting healthcheck on "${parentNode.name}" by "${localNodeName}" due to it being offline`
        );
      }
    } else if (localNodeName === localNodeParentNode?.name) {
      console.log(`Skipped starting self-healthcheck on "${localNodeName}"`);
    } else {
      console.debug(
        `Retained healthcheck of "${localNodeParentNode?.name}" (${localNodeParentNodeHealthcheckId}) by "${localNodeName}"`
      );
    }
  }

  private stopHealthcheck(intervalId: number) {
    clearInterval(intervalId);
  }

  private randomCall(self: this): Function {
    return () => {
      const response = self
        .sendCall(
          self.leader,
          new Message(self.name, MessageType.JustSayinHello)
        )
        .then((response) => {
          self.info = `Called ${self.leader} and they said ${
            MessageType[response.message]
          }`;
        });
      self.generateSomeTraffic();
    };
  }

  private randomCast(self: this): Function {
    return () => {
      self.sendCast(
        self.leader,
        new Message(self.name, MessageType.JustSayinHello)
      );
      self.generateSomeTraffic();
    };
  }
}

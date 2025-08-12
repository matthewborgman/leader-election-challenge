import { Injectable } from '@angular/core';
import { ServerNode } from './server-node/server-node';
import { Message } from './message';

@Injectable({
  providedIn: 'root'
})
export class Network {

  private MAX_NETWORK_DELAY: number = 100;

  private connectedNodes: Map<string, ServerNode> = new Map();

  join(name: string, node: ServerNode) {
    this.connectedNodes.set(name, node);
  }

  broadcast(message: Message) {
    for (const name of this.connectedNodes.keys()) {
      if (name != message.senderName) {
        this.networkSend(message.senderName, name, message);
      }
    }
  }

  private networkSend(from: string, to: string, message: Message) {
    if (this.canCommunicate(from, to)) {
      const targetNode = this.connectedNodes.get(to);
      if (targetNode) {
        this.networkDelay(() => targetNode.receiveSend(message));
      }
    }
  }


  private canCommunicate(from: string, to: string) {
    return true;
  }

  private networkDelay(fun: () => any): void {
    const delay = Math.floor(Math.random() * this.MAX_NETWORK_DELAY) + 1;
    setTimeout(fun, delay);
  }

}
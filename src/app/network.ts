import { Injectable } from '@angular/core';
import { ServerNode } from './server-node/server-node';
import { Message } from './message';

@Injectable({
  providedIn: 'root'
})
export class Network {

  private MAX_NETWORK_DELAY: number = 100;

  private connectedNodes: Map<string, ServerNode> = new Map();
  private partitionedNodes: string[] = [];

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

  partitionNetwork(): boolean {
    if (this.connectedNodes.size < 3) return false;
    if (this.partitionedNodes.length > 1) return false;

    const iterator = this.connectedNodes.keys();
    for (let i = 0; i < 2; i++) {
      let next = iterator.next();
      if (next.value) {
        this.partitionedNodes.push(next.value);
      }
    }
    
    return true;
  }

  healPartition(): void {
    this.partitionedNodes = [];
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
    if (this.differentPartitions(from, to)) {
      return false;
    }
    return true;
  }

  private differentPartitions(from: string, to: string): boolean {
    return this.partitionedNodes.includes(from) != this.partitionedNodes.includes(to);
  }

  private networkDelay(fun: () => any): void {
    const delay = Math.floor(Math.random() * this.MAX_NETWORK_DELAY) + 1;
    setTimeout(fun, delay);
  }

}



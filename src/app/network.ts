import { Injectable } from '@angular/core';
import { ServerNodeBase } from './server-node-base'
import { Message, MessageType } from './message';

@Injectable({
  providedIn: 'root'
})
export class Network {

  private MAX_NETWORK_DELAY: number = 100;

  private connectedNodes: Map<string, ServerNodeBase> = new Map();
  private partitionedNodes: string[] = [];
  private offlineNodes: string[] = [];

  join(name: string, node: ServerNodeBase) {
    this.connectedNodes.set(name, node);
  }

  broadcast(message: Message) {
    for (const name of this.connectedNodes.keys()) {
      if (name != message.senderName) {
        this.networkCast(message.senderName, name, message);
      }
    }
  }

  sendCast(from: string, to: string, message: Message): void {
    this.networkCast(from, to, message);
  }

  async sendCall(from: string, to: string, message: Message): Promise<Message> {
    return this.networkCall(from, to, message);
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

  goOnline(name: string) {
    const index = this.offlineNodes.indexOf(name);
    this.offlineNodes.splice(index, 1);
  }

  goOffline(name: string) {
    this.offlineNodes.push(name);
  }

  private networkCast(from: string, to: string, message: Message): void {
    if (this.canCommunicate(from, to)) {
      const targetNode = this.connectedNodes.get(to);
      if (targetNode) {
        this.networkDelay(() => targetNode.receiveCast(message));
      }
    }
  }

  private async networkCall(from: string, to: string, message: Message): Promise<Message> {
    const promise = new Promise<Message>((resolve, reject) => {
      if (this.canCommunicate(from, to)) {
        const targetNode = this.connectedNodes.get(to);
        if (targetNode) {
          this.networkDelay(() => {
            const response = targetNode.receiveCall(message);
            resolve(response);
          });
        }
      } else {
        reject("Not Found");
      }
    });
    return promise;
  }

  private canCommunicate(from: string, to: string) {
    if (this.differentPartitions(from, to)) {
      return false;
    }
    if (this.isOffline(to)) {
      return false;
    }
    return true;
  }

  private differentPartitions(from: string, to: string): boolean {
    return this.partitionedNodes.includes(from) != this.partitionedNodes.includes(to);
  }

  private isOffline(name: string): boolean {
    return this.offlineNodes.indexOf(name) > -1;
  }

  private networkDelay(fun: () => any): void {
    const delay = Math.floor(Math.random() * this.MAX_NETWORK_DELAY) + 1;
    setTimeout(fun, delay);
  }

}



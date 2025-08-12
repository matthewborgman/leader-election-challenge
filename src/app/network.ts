import { Injectable } from '@angular/core';
import { ServerNode } from './server-node/server-node';

@Injectable({
  providedIn: 'root'
})
export class Network {
  
  private connectedNodes: Map<string, ServerNode> = new Map();
  
  join(name: string, node: ServerNode) {
    this.connectedNodes.set(name, node);
  }
  
}

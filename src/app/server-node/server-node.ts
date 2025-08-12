import { Component, Inject, Input } from '@angular/core';
import { Network } from '../network';
import { Message, MessageType } from '../message';

@Component({
  selector: 'app-server-node',
  imports: [],
  templateUrl: './server-node.html',
  styleUrl: './server-node.scss'
})
export class ServerNode {

  @Input() name : string = "default";

  constructor(@Inject(Network) private network: Network) {
    this.network.join(this.name, this);
    this.network.broadcast(new Message(this.name, MessageType.NewMember));
  }

  receiveSend(message: Message) {
    throw new Error('Method not implemented.');
  }

}

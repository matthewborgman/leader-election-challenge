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

  @Input() name: string = "default";

  leader: string = "Unknown";
  color: string = "green";
  info: string = "Hello World!";

  constructor(@Inject(Network) private network: Network) {}

  receiveSend(message: Message) {
    if (message.message == MessageType.NewMember) {
      this.handleNewMember(message);
    }
  }

  ngOnInit() {
    this.leader = this.name;
    this.network.join(this.name, this);
    this.network.broadcast(new Message(this.name, MessageType.NewMember));
  }

  private handleNewMember(message: Message) {
    this.leader = message.senderName;
  }

}


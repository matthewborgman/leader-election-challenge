import { Component, Inject, Input } from '@angular/core';
import { Network } from '../network';
import { Message, MessageType } from '../message';


export abstract class ServerNodeBase {

  abstract name: string;

  constructor(protected network: Network) {}

  abstract receiveCast(message: Message): void;
  abstract receiveCall(message: Message): Message;

  offline() {
    this.network.goOffline(this.name);
  }

  online() {
    this.network.goOnline(this.name);
  }

  onInit() {
    this.network.join(this.name, this);
  }

}

@Component({
  selector: 'app-server-node',
  imports: [],
  templateUrl: './server-node.html',
  styleUrl: './server-node.scss'
})
export class ServerNode extends ServerNodeBase {

  @Input() name: string = "default";

  leader: string = "Unknown";
  color: string = "green";
  info: string = "Hello World!";
  isOnline: boolean = true;

  private MAX_TRAFFIC_DELAY: number = 15000;

  constructor(@Inject(Network) override network: Network) {
    super(network);
  }

  receiveCast(message: Message) {
    if (message.message == MessageType.NewMember) {
      this.handleNewMember(message);
    } else {
      this.info = `${message.senderName} sent me a cast`;
    }
  }

  receiveCall(message: Message): Message {
    this.info = `${message.senderName} gave me a call`;
    const responseMessage = new Message(this.name, MessageType.CoolStoryBro);
    return responseMessage;
  }

 override offline() {
    super.offline();
    this.isOnline = false;
    this.network.goOffline(this.name);
    this.leader = "Unknown";
    this.color = "grey";
    this.info = "Went Offline";
  }

  override online() {
    super.online();
    this.isOnline = true;
    this.network.goOnline(this.name);
    this.leader = this.name;
    this.color = "green";
    this.info = "Back Online";
  }

   ngOnInit() {
    super.onInit();
    this.leader = this.name;
    this.network.broadcast(new Message(this.name, MessageType.NewMember));
    this.generateSomeTraffic();
  }

  private generateSomeTraffic() {
    const delay = Math.floor(Math.random() * this.MAX_TRAFFIC_DELAY) + 1;
    const fun = (delay % 2) ? this.randomCall(this) : this.randomCast(this);
    setTimeout(fun, delay);
  }

  private randomCall(self: this) : Function {
    return () => {
      const response = self.network.sendCall(self.name, self.leader, new Message(self.name, MessageType.JustSayinHello)).then(response => {
        self.info = `Called ${self.leader} and they said ${MessageType[response.message]}`;
      });
      self.generateSomeTraffic();
    }
  }

  private randomCast(self: this): Function {
    return () => {
      self.network.sendCast(self.name, self.leader, new Message(self.name, MessageType.JustSayinHello));
      self.generateSomeTraffic();
    }
  }

  private handleNewMember(message: Message) {
    this.leader = message.senderName;
  }

}


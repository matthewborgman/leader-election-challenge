import { Component, Input } from '@angular/core';
import { Message, MessageType, NodeState } from '../message';
import { ServerNodeBase } from '../server-node-base';

@Component({
  selector: 'app-server-node',
  imports: [],
  templateUrl: './server-node.html',
  styleUrl: './server-node.scss',
})
export class ServerNode extends ServerNodeBase {
  @Input() name: string = 'default';

  leader: string = 'Unknown';

  previous: string = 'Unknown';
  color: string = 'green';
  info: string = 'Hello World!';
  // isLeader?: boolean = true;
  healthCheckId?: number;

  state: NodeState = [];

  private MAX_TRAFFIC_DELAY: number = 15000;
  private HEALTHCHECK_INTERVAL: number = 50;

  isStateLeader() {
    return this.state[0] === this.name;
  }
  isStateHeir() {
    return this.state[1] === this.name;
  }

  receiveCast(message: Message) {
    if (
      [MessageType.NewMember, MessageType.BackOnline].includes(
        message.message
      ) &&
      this.isStateLeader()
    ) {
      this.state.push(message.senderName);

      this.broadcast(
        new Message(this.name, MessageType.UpdateState, { state: this.state })
      );
    } else if (message.message === MessageType.UpdateState) {
      this.info = `${message.senderName} triggered updated state`;
      this.state = message.payload.state;
      this.leader = this.state[0];

      const currentNodeIndex = this.state.findIndex(
        (node) => node === this.name
      );
      const previousNodeName = currentNodeIndex
        ? this.state[currentNodeIndex - 1]
        : undefined;

      if (!this.healthCheckId && previousNodeName) {
        this.previous == previousNodeName;

        this.startHealthcheck(previousNodeName);
      }
    } else {
      this.info = `${message.senderName} sent me a cast`;
    }
  }

  receiveCall(message: Message): Message {
    this.info = `${message.senderName} gave me a call`;

    if (message.message === MessageType.Ping) {
      const responseMessage = new Message(this.name, MessageType.Pong);

      return responseMessage;
    } else {
      const responseMessage = new Message(this.name, MessageType.CoolStoryBro);

      return responseMessage;
    }
  }

  onOffline() {
    this.state = [];
    this.leader = 'Unknown';
    this.color = 'grey';
    this.info = 'Went Offline';
  }

  onOnline() {
    this.broadcast(new Message(this.name, MessageType.BackOnline));
    this.leader = this.name;
    this.color = 'green';
    this.info = 'Back Online';
  }

  onInit() {
    this.leader = this.name;
    this.state.push(this.name);
    this.broadcast(new Message(this.name, MessageType.NewMember));
    // this.generateSomeTraffic();
  }

  startHealthcheck(nodeName: string) {
    this.healthCheckId = setInterval(async () => {
      const previousNodeIndex = this.state.findIndex(
        (name) => name === nodeName
      );

      if (previousNodeIndex >= 0) {
        try {
          await this.sendCall(
            this.state[previousNodeIndex],
            new Message(this.name, MessageType.Ping)
          );
        } catch (error) {
          // console.log(this.previous);

          // Remove previous item
          this.state.splice(previousNodeIndex, 1);

          if (this.isStateLeader()) {
            this.leader = this.name;
          }

          // Clear interval
          clearInterval(this.healthCheckId);

          const updatedName = this.state.find(
            (node, index) => index === previousNodeIndex - 1
          );

          if (updatedName) {
            this.startHealthcheck(updatedName);
          }

          this.broadcast(
            new Message(this.name, MessageType.UpdateState, {
              state: this.state,
            })
          );
        }
      }
    }, this.HEALTHCHECK_INTERVAL);
  }

  private generateSomeTraffic() {
    const delay = Math.floor(Math.random() * this.MAX_TRAFFIC_DELAY) + 1;
    const fun = delay % 2 ? this.randomCall(this) : this.randomCast(this);
    setTimeout(fun, delay);
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

  private handleNewMember(message: Message) {
    // this.broadcast();

    this.leader = message.senderName;
  }
}

import { Inject, Injectable } from "@angular/core";
import { Network } from "./network";
import { Message } from "./message";

@Injectable() // This makes linting and Angular language checks not complain. Otherwise not needed.
export abstract class ServerNodeBase {

  abstract name: string;
  isOnline: boolean = true;

  constructor(@Inject(Network) protected network: Network) {  }

  abstract receiveCast(message: Message): void;
  abstract receiveCall(message: Message): Message;
  abstract onInit(): void;
  abstract onOnline(): void;
  abstract onOffline(): void;

  offline() {
    this.network.goOffline(this.name);
    this.isOnline = false;
    this.onOffline();
  }

  online() {
    this.network.goOnline(this.name);
    this.isOnline = true;
    this.onOnline();
  }

  ngOnInit() {
    this.network.join(this.name, this);
    this.onInit();
  }

  broadcast(message: Message) {
    this.network.broadcast(message);
  } 

  async sendCall(to: string, message: Message): Promise<Message> {
    return this.network.sendCall(this.name, to, message);
  }

  sendCast(to: string, message: Message): void {
    this.network.sendCast(this.name, to, message);
  }
}
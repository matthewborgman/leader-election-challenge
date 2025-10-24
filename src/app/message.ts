export type NodeState = string[];

export interface MessagePayload {
  state: NodeState;
}

export enum MessageType {
  NewMember,

  CoolStoryBro,
  JustSayinHello,
  UpdateState,

  BackOnline,
  Ping = 5,
  Pong,
}

export class Message {
  public senderName: string;
  public message: MessageType;

  public payload: MessagePayload;

  constructor(
    senderName: string,
    message: MessageType,
    messagePayload: MessagePayload = { state: [] }
  ) {
    this.senderName = senderName;
    this.message = message;
    this.payload = messagePayload;
  }
}

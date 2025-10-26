export interface Node {
  childNode?: Node;
  isLead: boolean;
  isOnline: boolean;
  name: string;
  parentNode?: Node;
  parentNodeHealthcheckId?: number;
}

export type Nodes = Node[];

export type MessagePayload = Nodes;

export enum MessageType {
  CoolStoryBro,
  JustSayinHello,
  NewMember,
  NodeOffline,
  NodeOnline,
  Ping = 5,
  Pong,
  UpdateState,
}

export class Message {
  public message: MessageType;
  public payload?: MessagePayload;
  public senderName: string;

  constructor(
    senderName: string,
    message: MessageType,
    messagePayload?: MessagePayload
  ) {
    this.senderName = senderName;
    this.message = message;
    this.payload = messagePayload;
  }
}

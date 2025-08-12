export enum MessageType {
    NewMember
}

export class Message {
    
    public senderName: string;
    public message: MessageType;

    constructor(senderName: string, message: MessageType) {
        this.senderName = senderName;
        this.message = message;
    }
}


export interface Message {
  id: number;
  message: string;
  date: string;
  user: string;
}

export class MessagesResponse {
  data: Message[];
  constructor(messages: Message[]) {
    this.data = messages;
  }
}

export interface MessagesModel {
  messages: MessagesResponse;
}

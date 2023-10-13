import { Message } from "../../types";

export class MessagesResponse {
  data: Message[];
  constructor(messages: Message[]) {
    this.data = messages;
  }
}

export interface MessagesModel {
  messages: MessagesResponse;
}

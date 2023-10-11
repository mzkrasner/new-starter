
export type Post = {
  body: string;
  id: string;
  to: string;
  created: string;
  ciphertext: string;
  chain: string;
  accessControlConditions: string;
  accessControlConditionType: string;
  author: {
    id: string
  }
};

export interface Message extends Post {
  text: string;
  sentBy: string;
  sentAt: Date;
  isChatOwner?: boolean;
}

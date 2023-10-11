import { messages } from "./messages";
import { MessagesModel, MessagesResponse } from "./messages-transform.types";

/** This is where we should consume the data
 * from an API
 */
export const useGetMessages = (): MessagesModel => {
  return {
    messages: new MessagesResponse(messages)
  };
};

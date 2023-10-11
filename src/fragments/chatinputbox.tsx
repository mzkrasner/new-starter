import React from "react";
import { Message, Post } from "../../types";
import DebouncedInput from "./debounced";
import { encryptWithLit, encodeb64 } from "../../utils/lit";
import { useComposeDB } from '../fragments'
import { ILitNodeClient } from "@lit-protocol/types";

interface ChatInputBoxProps {
  sendANewMessage: (message: Message) => void;
  address: string;
  lit: ILitNodeClient
}

const chain = "ethereum";

const ChatInputBox = ({ sendANewMessage, address, lit }: ChatInputBoxProps) => {
  const [newMessage, setNewMessage] = React.useState("");
  const { compose, isAuthenticated } = useComposeDB()
  /**
   * Send message handler
   * Should empty text field after sent
   */
  const doSendMessage = async () => {
    if (newMessage && newMessage.length > 0) {
      const accessControlConditions = [
        {
          contractAddress: "",
          standardContractType: "",
          chain,
          method: "",
          parameters: [":userAddress"],
          returnValueTest: {
            comparator: "=",
            value: address,
          },
        },
      ];

      const { ciphertext, dataToEncryptHash } = await encryptWithLit(
        lit,
        newMessage,
        accessControlConditions,
        chain
      );

      console.log(ciphertext)

      const stringified = JSON.stringify(accessControlConditions);
      const b64 = new TextEncoder().encode(stringified);
      const encoded = await encodeb64(b64);

      const post: any = await compose.executeQuery<{
        createPosts: {
          document: Post;
        };
      }>(`
        mutation {
          createPosts(input: {
            content: {
              body: """${dataToEncryptHash}"""
              to: "${address}"
              created: "${new Date().toISOString()}"
              ciphertext: "${ciphertext}"
              chain: "${chain}"
              accessControlConditions: "${encoded}"
              accessControlConditionType: "accessControlConditions"
            }
          })
          {
            document {
              body
              to
              created
              ciphertext
              chain
              accessControlConditions
            }
          }
        }
      `);

      console.log(post)
      sendANewMessage({
        sentAt: new Date(post.data.createPosts.document.created),
        sentBy: address,
        isChatOwner: true,
        text: post.data.createPosts.document.body,
        ...post.data.createPosts.document,
      });

      console.log(post);
      console.log(address);
      setNewMessage("");
    }
  };

  return (
    <div className="px-6 py-4 bg-white w-100 overflow-hidden rounded-bl-xl rounded-br-xla">
      <div className="flex flex-row items-center space-x-5">
        <DebouncedInput
          value={newMessage ?? ""}
          debounce={100}
          onChange={(value) => setNewMessage(String(value))}
        />
        <button
          type="button"
          disabled={!newMessage || newMessage.length === 0}
          className="px-3 py-2 text-xs font-medium text-center text-white bg-purple-500 rounded-lg hover:bg-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 disabled:opacity-50"
          onClick={() => doSendMessage()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatInputBox;

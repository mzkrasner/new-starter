import React from "react";
import { Message } from "../../types";
import {} from "../hooks/messages-transform.types";
import { decryptWithLit, decodeb64 } from "../../utils/lit";
import Avatar from "./avatar";
import { ILitNodeClient } from "@lit-protocol/types";

interface ChatContentProps {
  messages: Message[];
  lit: ILitNodeClient;
}

const ChatContent = ({ messages, lit }: ChatContentProps) => {

  const handleDecrypt = async (event: any, message: Message) => {
    const encryptedMessage = message.body;
    const ciphertext = message.ciphertext;
    const accessControl = await decodeb64(message.accessControlConditions);
    const decoded = new TextDecoder().decode(accessControl);
    const decodedMessage = await decryptWithLit(
      lit,
      ciphertext,
      encryptedMessage,
      JSON.parse(decoded),
      message.chain
    );
    event.target.parentElement.children[1].innerText = decodedMessage;
    event.target.innerText = "Decoded!"
  }


  return (
    <div className="max-h-100 h-80 px-6 py-1 overflow-auto">
      {messages.map((message: Message, index: number) => (
        <div
          key={index}
          className={`py-2 flex flex-row w-full ${
            message.isChatOwner ? "justify-end" : "justify-start"
          }`}
        >
          <div className={`${message.isChatOwner ? "order-2" : "order-1"}`}>
            <Avatar />
          </div>
          <div
            className={`px-2 w-fit py-3 flex flex-col bg-purple-500 rounded-lg text-white ${
              message.isChatOwner ? "order-1 mr-2" : "order-2 ml-2"
            }`}
          >
            <span className="text-xs text-gray-200">
              {message.sentBy}&nbsp;-&nbsp;
              {new Date(message.sentAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <div className="text-s max-w-md break-words" id="targetItem">{message.text}</div>
            {message.isChatOwner && (
              <button
                type="button"
                className="bg-transparent hover:bg-red-500 text-blue-200 font-semibold hover:text-black text-xs px-4 py-2  border border-black-300 hover:border-transparent rounded w-1/4 "
                onClick={(el) => handleDecrypt(el, message)}
              >
                Decrypt
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatContent;

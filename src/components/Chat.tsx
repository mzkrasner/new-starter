import React, { useEffect } from "react";
import ChatHeader from "../fragments/chatheader";
import PowerUp from "../fragments/powerup";
import Consume from "../fragments/consume";
import Context from "../fragments/context";
import ChatInputBox from "../fragments/chatinputbox";
import { Post, Message } from "../../types";
import { ILitNodeClient } from "@lit-protocol/types";
import { useComposeDB } from '../fragments'

type ChatProps = { address: string, lit: ILitNodeClient };

const Chat = ({ address, lit }: ChatProps) => {
  const [chatMessages, setChatMessages] = React.useState<Message[]>([]);
  const { compose, isAuthenticated } = useComposeDB()


  

  /** State to control new messages */

  /**
   *
   * @param message
   * "Create" a new message
   */
  const sendANewMessage = (message: Message) => {
    if(chatMessages){
      setChatMessages((chatMessages) => [...chatMessages, message]);
    }
    
  };

  /**
   * Reset chat to the default messages
   */

  useEffect(() => {
    // getMessages();
  }, []);

  return (
    <div className="max-w-xxl mx-auto mt-32 w-5/6 min-h-200">
      <div className="flex flex-row justify-between items-center py-2"></div>
      <div className="bg-white border border-gray-200 rounded-lg shadow relative">
        <h2 className="font-bold">Create Issuer Example</h2>
        <ChatHeader
          name={address}
          numberOfMessages={chatMessages ? chatMessages.length : 0}
        />
        <ChatInputBox sendANewMessage={sendANewMessage} address={address} lit={lit}/>
      </div>
      <br></br>
      <div className="bg-white border border-gray-200 rounded-lg shadow relative">
        <h2 className="font-bold">Create a Context</h2>
        <ChatHeader
          name={address}
          numberOfMessages={chatMessages ? chatMessages.length : 0}
        />
        <Context sendANewMessage={sendANewMessage} address={address} lit={lit}/>
      </div>
      <br></br>
      <div className="bg-white border border-gray-200 rounded-lg shadow relative">
        <h2 className="font-bold">Create PowerUp Instance</h2>
        <p>Copy the blue StreamID from "Create a Context" above into "Context Stream ID"</p>
        <ChatHeader
          name={address}
          numberOfMessages={chatMessages ? chatMessages.length : 0}
        />
        <PowerUp sendANewMessage={sendANewMessage} address={address} lit={lit}/>
      </div>
      <br></br>
      <div className="bg-white border border-gray-200 rounded-lg shadow relative">
        <h2 className="font-bold">Consume a PowerUp</h2>
        <p>Copy the blue StreamID from "Create a PowerUp Instance" above into "PowerUp Stream ID"</p>
        <ChatHeader
          name={address}
          numberOfMessages={chatMessages ? chatMessages.length : 0}
        />
        <Consume sendANewMessage={sendANewMessage} address={address} lit={lit}/>
      </div>
      <br></br>
    </div>
  );
};

export default Chat;

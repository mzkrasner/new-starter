import React, { useEffect } from "react";
import ChatHeader from "../fragments/chatheader";
import ChatContent from "../fragments/chatcontent";
import ChatInputBox from "../fragments/chatinputbox";
import { Post, Message } from "../../types";
import { ILitNodeClient } from "@lit-protocol/types";
import { useComposeDB } from '../fragments'

type ChatProps = { address: string, lit: ILitNodeClient };

const Chat = ({ address, lit }: ChatProps) => {
  const [chatMessages, setChatMessages] = React.useState<Message[]>([]);
  const { compose, isAuthenticated } = useComposeDB()


  const getMessages = async () => {
    const posts = await compose.executeQuery<{
      postsIndex: {
        edges: {
          node: Post;
        }[];
      };
    }>(`
    query {
        postsIndex (last:20) {
          edges {
            node {
              id
              author{
                id
              }
              body
              to
              created
              ciphertext
              chain
              accessControlConditions
              accessControlConditionType
            }
          }
        }
      }
    `);
    console.log(posts)
    const messageArray: Message[] = [];
    if(posts.data && posts.data.postsIndex === null){
      return
    }
    if (posts.data && posts.data.postsIndex) {
      posts.data.postsIndex.edges.forEach((el: { node: Post }) => {
        messageArray.push({
          text: el.node.body,
          sentBy: el.node.author.id.split(':')[4]!!,
          sentAt: new Date(el.node.created),
          isChatOwner: address === el.node.author.id.split(':')[4]!!,
          ...el.node
        });
      });
    }
    setChatMessages(messageArray);
    // console.log(messages)
  };

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
    getMessages();
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
    </div>
  );
};

export default Chat;

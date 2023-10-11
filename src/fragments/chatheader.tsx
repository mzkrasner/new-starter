import React from "react";
import { PhoneIcon, CameraIcon } from "@heroicons/react/24/outline";
import Avatar from "./avatar";

interface ChatHeaderProps {
  name: string;
  numberOfMessages: number;
}

const ChatHeader = ({ name, numberOfMessages = 0 }: ChatHeaderProps) => {
  return (
    <div className="border-b-2 border-b-gray-200 py-3 px-6 flex flex-row justify-between items-center">
      <div className="flex flex-row items-center space-x-1.5">
        <Avatar />
        <div className="flex flex-col">
          <p className="text-xs text-gray-600">{name}</p>
          <p className="text-xs text-gray-400">{numberOfMessages} messages</p>
        </div>
      </div>
      <div className="space-x-1">
        <button
          type="button"
          className="hover:bg-gray-100 rounded-full font-medium text-sm p-1.5 text-center inline-flex items-center"
        >
          <PhoneIcon className="text-gray-600 w-5 h-5" />
        </button>
        <button
          type="button"
          className="hover:bg-gray-100 rounded-full font-medium text-sm p-1.5 text-center inline-flex items-center"
        >
          <CameraIcon className="text-gray-600 w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;

import React, { useState } from "react";
import { Message, Post } from "../../types";
import DebouncedInput from "./debounced";
import { encryptWithLit, encodeb64 } from "../../utils/lit";
import { EASContractAddress, getAddressForENS } from "../../utils/utils";
import { useComposeDB } from "../fragments";
import { ILitNodeClient } from "@lit-protocol/types";
import { networks } from "../../utils/networks";
import { ethers } from "ethers";
import {
  EAS,
  OffchainAttestationParams,
  SchemaEncoder,
} from "@ethereum-attestation-service/eas-sdk";
import { useNetwork, useSwitchNetwork, sepolia } from "wagmi";
import { type } from "os";
import { toBytes } from "viem";
import {
  EIP712DomainTypedData,
  EIP712MessageTypes,
  Signature,
} from "@ethereum-attestation-service/eas-sdk/dist/offchain/typed-data-handler";
import { request } from "http";
import { FullAttestation, Template, WattType } from "../../utils/types";
import { set } from "zod";

interface ChatInputBoxProps {
  sendANewMessage: (message: Message) => void;
  address: string;
  lit: ILitNodeClient;
}

type RequestBody = {
  account: string;
  uid: string;
  domain: EIP712DomainTypedData;
  primaryType: string | number;
  types: EIP712MessageTypes;
  message: OffchainAttestationParams;
  signature: Signature;
};

enum Powers {
  VWATT = "VWATT",
  SWATT = "SWATT",
  CWATT = "CWATT",
  NWATT = "NWATT",
  XWATT = "XWATT",
  LWATT = "LWATT",
  PWATT = "PWATT",
  TVL = "TVL",
}

const chain = "ethereum";

const Context = ({ sendANewMessage, address, lit }: ChatInputBoxProps) => {
  const [result, setResult] = React.useState("");
  const [streamId, setStreamId] = React.useState("");
  const [recipient, setNewRecipient] = React.useState(
    "did:pkh:eip155:11155111:0x514e3b94f0287caf77009039b72c321ef5f016e6"
  );
  const [power, setPower] = useState<WattType>();
  const [context, setContext] = useState<string>(
    "bafybeihewi4brhhmjqvquwdqnlzhnamfh26txwmw2fe4nfswfckpthowna"
  );
  const { compose, isAuthenticated } = useComposeDB();
  const { chains, error, isLoading, pendingChainId, switchNetwork } =
    useSwitchNetwork();
  const { chain } = useNetwork();
  const eas = new EAS(EASContractAddress);
  let powers = [
    { label: "VWATT", value: "VWATT" },
    { label: "SWATT", value: "SWATT" },
    { label: "CWATT", value: "CWATT" },
    { label: "NWATT", value: "NWATT" },
    { label: "XWATT", value: "XWATT" },
    { label: "LWATT", value: "LWATT" },
    { label: "PWATT", value: "PWATT" },
    { label: "TVL", value: "TVL" },
  ];
  /**
   * Send message handler
   * Should empty text field after sent
   */
  const doSendMessage = async () => {
    try {
      if (context === undefined || context === "") {
        alert("No context has been defined");
        return;
      }
      if (recipient !== undefined && recipient === "") {
        alert("No recipient has been defined");
        return;
      }

      const requestBody = {
        context,
        recipient,
      };

      await saveToComposeDB(requestBody);
    } catch (error) {
      console.log(error);
    }
  };

  const saveToComposeDB = async (request: {
    context: string;
    recipient: string;
  }) => {
    const { context, recipient } = request;

    const data = await compose.executeQuery<{
      createContext: {
        document: {
          id: string;
          controller: {
            id: string;
          };
          entityCreator: {
            id: string;
          };
          context: string;
        };
      };
    }>(`
      mutation {
        createContext(input: {
          content: {
            entityCreator: "${recipient}"
            context: "${context}"
          }
        }) 
        {
          document {
            id
            controller{
                id
            }
            entityCreator{
                id
            }
            context
          }
        }
      }
    `);
    console.log(data);
    setResult(JSON.stringify(data));
    setStreamId(data?.data?.createContext?.document?.id || ""); // provide default value
    setNewRecipient("");
    setContext("");
    setPower(undefined);
  };

  return (
    <>
      <div className="max-h-100 h-80 px-6 py-1 overflow-auto">
        {streamId && (
          <div className="text-s w-full break-words text-indigo-600">
            {streamId}
          </div>
        )}
        <br />
        {result && <div className="text-s w-full break-words">{result}</div>}
      </div>
      <div className="px-6 py-4 bg-white w-100 overflow-hidden rounded-bl-xl rounded-br-xla">
        <div className="flex flex-row items-center space-x-5">
          <div className="flex flex-row items-center space-x-5">
            <div className="flex flex-col items-center space-x-5">
              <p>Entity Creator:</p>
              <p>(you can leave in the default example)</p>
              <DebouncedInput
                value={recipient ?? ""}
                debounce={100}
                onChange={(value) => setNewRecipient(String(value))}
              />
            </div>
          </div>
          <div className="flex flex-row items-center space-x-5"></div>
          <div className="flex flex-row items-center space-x-5">
            <div className="flex flex-col items-center space-x-5">
              <p>Context:</p>
              <p>(CID left as example)</p>
              <DebouncedInput
                value={context ?? ""}
                debounce={100}
                onChange={(value) => setContext(String(value))}
              />
            </div>
          </div>
          <button
            type="button"
            disabled={!context || !recipient}
            className="px-3 py-2 text-xs font-medium text-center text-white bg-purple-500 rounded-lg hover:bg-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 disabled:opacity-50 mt-6"
            onClick={() => {
              if (chain !== sepolia) {
                switchNetwork?.(sepolia.id);
              }
              doSendMessage();
            }}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
};

export default Context;

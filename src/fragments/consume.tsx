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

const Consume = ({ sendANewMessage, address, lit }: ChatInputBoxProps) => {
  const [result, setResult] = React.useState("");
  const [streamId, setStreamId] = React.useState("");
  const { compose, isAuthenticated } = useComposeDB();
  const { chains, error, isLoading, pendingChainId, switchNetwork } =
    useSwitchNetwork();
  const { chain } = useNetwork();
  /**
   * Send message handler
   * Should empty text field after sent
   */
  const doSendMessage = async () => {
    try {
      if (streamId === undefined || streamId === "") {
        alert("No PowerUp stream has been defined");
        return;
      }

      const requestBody = {
        streamId
      };

      await saveToComposeDB(requestBody);
    } catch (error) {
      console.log(error);
    }
  };

  const saveToComposeDB = async (request: {streamId: string}) => {
    const { streamId } = request;

    const data = await compose.executeQuery<
    {
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
    }
    >(`
      mutation {
        createConsumePowerUp(input: {
          content: {
            powerUpId: "${streamId}"
          }
        }) 
        {
          document {
            id
            controller{
                id
            }
            powerUp{
                recipient
                verifyingContract
                easVersion
                context{
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
        }
      }
    `);
    console.log(data);
    setResult(JSON.stringify(data));

  };

  return (
    <>
      <div className="max-h-100 h-80 px-6 py-1 overflow-auto">
        {result && <div className="text-s w-full break-words">{result}</div>}
        <br />
      </div>
      <div className="px-6 py-4 bg-white w-100 overflow-hidden rounded-bl-xl rounded-br-xla">
        <div className="flex flex-row items-center space-x-5">
          <div className="flex flex-row items-center space-x-5">
          </div>
          <div className="flex flex-row items-center space-x-5">
          </div>
          <div className="flex flex-row items-center space-x-5">
            <div className="flex flex-col items-center space-x-5">
              <p>PowerUp Stream ID:</p>
              <p>(Take from Above)</p>
              <DebouncedInput
                value={streamId ?? ""}
                debounce={100}
                onChange={(value) => setStreamId(String(value))}
              />
            </div>
          </div>
          <button
            type="button"
            disabled={!streamId}
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

export default Consume;

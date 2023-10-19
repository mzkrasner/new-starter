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

const PowerUp = ({ sendANewMessage, address, lit }: ChatInputBoxProps) => {
  const [result, setResult] = React.useState("");
  const [recipient, setNewRecipient] = React.useState("");
  const [stream, setStream] = React.useState("");
  const [powerStream, setPowerStream] = React.useState("");
  const [power, setPower] = useState<WattType>();
  const [multiplier, setMultiplier] = useState<number>();
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
      if (multiplier !== undefined && (multiplier > 1 || multiplier < 0)) {
        alert("Multiplier must be between 0 and 1");
        return;
      }
      if (recipient !== undefined && !ethers.utils.isAddress(recipient)) {
        alert("Not valid address");
        return;
      }
      if (power === undefined) {
        alert("No power selected");
        return;
      }

      if (stream === undefined || stream === "") {
        alert("No Context Stream ID has been defined");
        return;
      }

      console.log("test", toBytes(multiplier ?? 0));

      const provider = new ethers.providers.Web3Provider(
        window.ethereum as unknown as ethers.providers.ExternalProvider
      );
      const signer = provider.getSigner();
      eas.connect(signer);

      const schemaEncoder = new SchemaEncoder(
        "address issuer,string wattType,bytes multiplier"
      );
      const encoded = schemaEncoder.encodeData([
        { name: "issuer", type: "address", value: address },
        { name: "wattType", type: "string", value: power },
        //@ts-ignore
        { name: "multiplier", type: "bytes", value: toBytes(multiplier ?? 0) },
      ]);

      const offchain = await eas.getOffchain();

      const time = Math.floor(Date.now() / 1000);
      const offchainAttestation = await offchain.signOffchainAttestation(
        {
          recipient: recipient.toLowerCase(),
          // Unix timestamp of when attestation expires. (0 for no expiration)
          expirationTime: 0,
          // Unix timestamp of current time
          time,
          revocable: true,
          version: 1,
          nonce: 0,
          // schema of deployed definition: https://easscan.org/schema/view/0xee196aa65d79be45b762eea4a8b60cd8eaf11bd414263c3f1f5b1e9e387f2b98
          schema:
            "0xee196aa65d79be45b762eea4a8b60cd8eaf11bd414263c3f1f5b1e9e387f2b98",
          refUID:
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          data: encoded,
        },
        signer
      );
      const userAddress = await signer.getAddress();
      console.log(offchainAttestation);

      const requestBody: RequestBody = {
        ...offchainAttestation,
        account: userAddress.toLowerCase(),
      };

      await saveToComposeDB(requestBody, power);
    } catch (error) {
      console.log(error);
    }
  };

  const saveToComposeDB = async (request: RequestBody, power: WattType) => {
    const { message, uid, account, domain, types, signature } = request;

    const watt: Template = {
      wattType: power,
      multiplier: multiplier ?? 0,
    };

    const data = await compose.executeQuery<{
      createPowerUpAttestation: {
        document: FullAttestation;
      };
    }>(`
      mutation {
        createPowerUpAttestation(input: {
          content: {
            uid: "${uid}"
            schema: "${message.schema}"
            attester: "${account}"
            verifyingContract: "${domain.verifyingContract}"
            easVersion: "${domain.version}"
            version: ${message.version}
            templateType: {
                  wattType: ${JSON.stringify(watt.wattType)
                    .replaceAll('"wattType"', "wattType")
                    .replaceAll('"VWATT"', "VWATT")
                    .replaceAll('"SWATT"', "SWATT")
                    .replaceAll('"CWATT"', "CWATT")
                    .replaceAll('"NWATT"', "NWATT")
                    .replaceAll('"XWATT"', "XWATT")
                    .replaceAll('"LWATT"', "LWATT")
                    .replaceAll('"PWATT"', "PWATT")
                    .replaceAll('"TVL"', "TVL")}
                    multiplier: ${watt.multiplier}
                }
            chainId: ${domain.chainId}
            r: "${signature.r}"
            s: "${signature.s}"
            v: ${signature.v}
            types: ${JSON.stringify(types.Attest)
              .replaceAll('"name"', "name")
              .replaceAll('"type"', "type")}
            recipient: "${message.recipient}"
            refUID: "${message.refUID}"
            data: "${message.data}"
            contextId: "${stream}"
            time: ${message.time}
          }
        }) 
        {
          document {
            id
            uid
            schema
            attester
            verifyingContract 
            easVersion
            version 
            chainId 
            types{
              name
              type
            }
            r
            s
            v
            recipient
            refUID
            data
            context{
                id
                controller{
                    id
                }
                entityCreator{
                    id
                }
            }
            time
          }
        }
      }
    `);
    console.log(data);
    setResult(JSON.stringify(data));
    if (data && data.data) {
      setPowerStream(data.data.createPowerUpAttestation.document.id);
    }
    setNewRecipient("");
    setStream("");
    setMultiplier(undefined);
    setPower(undefined);
  };

  return (
    <>
      <div className="max-h-100 h-80 px-6 py-1 overflow-auto">
        {powerStream && (
          <div className="text-s w-full break-words text-indigo-600">
            {powerStream}
          </div>
        )}
        <br />
        {result && <div className="text-s w-full break-words">{result}</div>}
      </div>
      <div className="px-6 py-4 bg-white w-100 overflow-hidden rounded-bl-xl rounded-br-xla">
        <div className="flex flex-row items-center space-x-5">
          <div className="flex flex-row items-center space-x-5">
            <div className="flex flex-col items-center space-x-5">
              <p>Recipient:</p>
              <DebouncedInput
                value={recipient ?? ""}
                debounce={100}
                onChange={(value) => setNewRecipient(String(value))}
              />
            </div>
          </div>
          <div className="flex flex-row items-center space-x-5">
            <select
              onChange={(value: React.ChangeEvent<HTMLSelectElement>) => {
                setPower(value.target.value as unknown as WattType);
              }}
            >
              <option value="⬇️ Select a Watt Category ⬇️">
                {" "}
                -- Select a watt category --{" "}
              </option>
              {powers.map((power) => (
                <option
                  key={powers.indexOf(power)}
                  value={power.value}
                  id={power.label}
                >
                  {power.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-row items-center space-x-5">
            <div className="flex flex-col items-center space-x-5">
              <p>Multiplier:</p>
              <DebouncedInput
                value={multiplier ?? ""}
                debounce={100}
                onChange={(value) => setMultiplier(value as number)}
              />
            </div>
          </div>
          <div className="flex flex-row items-center space-x-5">
            <div className="flex flex-col items-center space-x-5">
              <p>Context Stream ID:</p>
              <DebouncedInput
                value={stream ?? ""}
                debounce={100}
                onChange={(value) => setStream(String(value))}
              />
            </div>
          </div>
          <button
            type="button"
            disabled={!multiplier || !power || !recipient || !stream}
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

export default PowerUp;

import React, { useState } from "react";
import { Message, Post } from "../../types";
import DebouncedInput from "./debounced";
import { encryptWithLit, encodeb64 } from "../../utils/lit";
import { EASContractAddress, getAddressForENS } from "../../utils/utils";
import { useComposeDB } from "../fragments";
import { ILitNodeClient } from "@lit-protocol/types";
import { networks } from "../../utils/networks";
import { ethers } from "ethers";
import { EAS, OffchainAttestationParams, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { useNetwork, useSwitchNetwork, sepolia } from "wagmi";
import { type } from "os";
import { toBytes } from "viem";
import { EIP712DomainTypedData, EIP712MessageTypes, Signature } from "@ethereum-attestation-service/eas-sdk/dist/offchain/typed-data-handler";
import { request } from "http";
import { FullAttestation } from "../../utils/types";
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
}

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

const ChatInputBox = ({ sendANewMessage, address, lit }: ChatInputBoxProps) => {
  const [result, setResult] = React.useState("");
  const [issuer, setNewIssuer] = React.useState('');
  const [power, setPower] = useState<Powers>();
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
        if(multiplier !== undefined && (multiplier > 1 || multiplier < 0)){
          alert("Multiplier must be between 0 and 1");
          return;
        }
        if(issuer !== undefined && (!ethers.utils.isAddress(issuer))){
          alert("Not valid address");
          return;
        }
        if(power === undefined ){
          alert("No power selected");
          return;
        }

        console.log('test', toBytes(multiplier ?? 0));
       
        const provider = new ethers.providers.Web3Provider(
          window.ethereum as unknown as ethers.providers.ExternalProvider
        );
        const signer = provider.getSigner();
        eas.connect(signer);

        const schemaEncoder = new SchemaEncoder(
          "address issuer,string wattType,bytes multiplier"
        );
        const encoded = schemaEncoder.encodeData([
          { name: "issuer", type: "address", value: issuer },
          { name: "wattType", type: "string", value: power },
          //@ts-ignore
          { name: "multiplier", type: "bytes", value: toBytes(multiplier ?? 0) },
        ]);

        //represents newCoin or whoever is confirming the issuer instance
        const recipient = '0x8071f6F971B438f7c0EA72C950430EE7655faBCe'

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

        await saveToComposeDB(requestBody);

      } catch (error) {
        console.log(error);
      }
  };

  const saveToComposeDB = async (request: RequestBody) => {
    const { message, uid, account, domain, types, signature } = request;

    const data = await compose.executeQuery<
    {
      createIssuerAttestation: {
        document: FullAttestation;
      };
    }
    >(`
      mutation {
        createIssuerAttestation(input: {
          content: {
            uid: "${uid}"
            schema: "${message.schema}"
            attester: "${account}"
            verifyingContract: "${domain.verifyingContract}"
            easVersion: "${domain.version}"
            version: ${message.version}
            chainId: ${domain.chainId}
            r: "${signature.r}"
            s: "${signature.s}"
            v: ${signature.v}
            types: ${JSON.stringify(types.Attest).replaceAll('"name"', 'name').replaceAll('"type"', 'type')}
            recipient: "${message.recipient}"
            issuer: "${issuer}"
            refUID: "${message.refUID}"
            data: "${message.data}"
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
            issuer
            refUID
            data
            time
          }
        }
      }
    `);
    console.log(data);
    setResult(JSON.stringify(data));
    setNewIssuer('');
    setMultiplier(undefined);
    setPower(undefined);
  }

  return (
    <>
    <div className="max-h-100 h-80 px-6 py-1 overflow-auto">
    {result && <div className="text-s w-full break-words">{result}</div>}
    </div>
    <div className="px-6 py-4 bg-white w-100 overflow-hidden rounded-bl-xl rounded-br-xla">
      <div className="flex flex-row items-center space-x-5">
        <div className="flex flex-row items-center space-x-5">
          <div className="flex flex-col items-center space-x-5">
            <p>Issuer:</p>
            <DebouncedInput
              value={issuer ?? ""}
              debounce={100}
              onChange={(value) => setNewIssuer(String(value))}
            />
          </div>
        </div>
        <div className="flex flex-row items-center space-x-5">
          <select
            onChange={(value: React.ChangeEvent<HTMLSelectElement>) => {
              setPower(value.target.value as Powers);
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
        <button
          type="button"
          disabled={!multiplier || !power || !issuer}
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

export default ChatInputBox;

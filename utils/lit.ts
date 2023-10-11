import * as LitJsSdk from "@lit-protocol/lit-node-client-nodejs";
import { checkAndSignAuthMessage } from "@lit-protocol/lit-node-client";
import { AccessControlConditions, ILitNodeClient } from "@lit-protocol/types";


declare global {
  interface Window {
    [index: string]: any;
  }
}

export function encodeb64(uintarray: any) {
  const b64 = Buffer.from(uintarray).toString("base64");
  return b64;
}

export function blobToBase64(blob: Blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      resolve(
        // @ts-ignore
        reader.result.replace("data:application/octet-stream;base64,", "")
      );
    reader.readAsDataURL(blob);
  });
}

export function decodeb64(b64String: any) {
  return new Uint8Array(Buffer.from(b64String, "base64"));
}

export async function encryptWithLit(
  litNodeClient: ILitNodeClient,
  aStringThatYouWishToEncrypt: string,
  accessControlConditions: AccessControlConditions,
  chain: string
): Promise<{ ciphertext: string; dataToEncryptHash: string }> {
  let authSig = await checkAndSignAuthMessage({
    chain,
  });

  const { ciphertext, dataToEncryptHash } = await LitJsSdk.encryptString(
    {
      accessControlConditions,
      authSig,
      chain: 'ethereum',
      dataToEncrypt: aStringThatYouWishToEncrypt,
    },
    litNodeClient,
  );

  return {
    ciphertext,
    dataToEncryptHash,
  };
}

export async function decryptWithLit(
  litNodeClient: ILitNodeClient,
  ciphertext: string,
  dataToEncryptHash: string,
  accessControlConditions: AccessControlConditions,
  chain: string,
): Promise<string> {
  let authSig = await checkAndSignAuthMessage({
    chain,
  });

  const decryptedString = await LitJsSdk.decryptToString(
    {
      accessControlConditions,
      ciphertext,
      dataToEncryptHash,
      authSig,
      chain: 'ethereum',
    },
    litNodeClient,
  );
  return decryptedString;
}

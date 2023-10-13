import { readFileSync } from "fs";
import { CeramicClient } from "@ceramicnetwork/http-client";
import {
  createComposite,
  readEncodedComposite,
  writeEncodedComposite,
  writeEncodedCompositeRuntime,
} from "@composedb/devtools-node";
import { Composite } from "@composedb/devtools";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { fromString } from "uint8arrays/from-string";
import ora from "ora";

const ceramic = new CeramicClient("http://localhost:7007");

/**
 * @param {ora} spinner - to provide progress status.
 * @return {Promise<void>} - return void when composite finishes deploying.
 */
export const writeComposite = async (spinner) => {
  await authenticate();

  const issuerComposite = await createComposite(
    ceramic,
    "./composites-attestations/00-issuer-Attestation.graphql"
  );

  const issuerConfirmSchema = readFileSync(
    "./composites-attestations/01-issuer-Confirm.graphql",
    {
      encoding: "utf-8",
    }
  ).replace("$ATTESTATION_ID", issuerComposite.modelIDs[0] ?? "");

  const issuerConfirmComposite = await Composite.create({
    ceramic,
    schema: issuerConfirmSchema,
  });

  const confirmConnectSchema = readFileSync(
    "./composites-attestations/02-confirmConnect.graphql",
    {
      encoding: "utf-8",
    }
  )
    .replace("$CONFIRM_ID", issuerConfirmComposite.modelIDs[1] ?? "")
    .replace("$ISSUERATTESTATION_ID", issuerComposite.modelIDs[0] ?? "");

  const confirmConnectComposite = await Composite.create({
    ceramic,
    schema: confirmConnectSchema,
  });

  const contextComposite = await createComposite(
    ceramic,
    "./composites-attestations/03-context.graphql"
  );

  const powerUpSchema = readFileSync(
    "./composites-attestations/04-powerUp-Attestation.graphql",
    {
      encoding: "utf-8",
    }
  ).replace("$CONTEXT_ID", contextComposite.modelIDs[0] ?? "");

  const powerUpComposite = await Composite.create({
    ceramic,
    schema: powerUpSchema,
  });

  const contextConnectSchema = readFileSync(
    "./composites-attestations/05-contextConnect.graphql",
    {
      encoding: "utf-8",
    }
  )
    .replace("$POWERATTESTATION_ID", powerUpComposite.modelIDs[1] ?? "")
    .replace("$CONTEXT_ID", contextComposite.modelIDs[0] ?? "");

  const contextConnectComposite = await Composite.create({
    ceramic,
    schema: contextConnectSchema,
  });

  const composite = Composite.from([
    issuerComposite,
    issuerConfirmComposite,
    confirmConnectComposite,
    contextComposite,
    powerUpComposite,
    contextConnectComposite,
  ]);

  await writeEncodedComposite(composite, "./src/__generated__/definition.json");
  
  // @ts-ignore
  spinner.info("creating composite for runtime usage");
  await writeEncodedCompositeRuntime(
    ceramic,
    "./src/__generated__/definition.json",
    "./src/__generated__/definition.js"
  );
  // @ts-ignore
  spinner.info("deploying composite");
  const deployComposite = await readEncodedComposite(
    ceramic,
    "./src/__generated__/definition.json"
  );

  await deployComposite.startIndexingOn(ceramic);
  // @ts-ignore
  spinner.succeed("composite deployed & ready for use");
};

/**
 * Authenticating DID for publishing composite
 * @return {Promise<void>} - return void when DID is authenticated.
 */
const authenticate = async () => {
  const seed = readFileSync("./admin_seed.txt");
  // @ts-ignore
  const key = fromString(seed, "base16");
  const did = new DID({
    resolver: getResolver(),
    provider: new Ed25519Provider(key),
  });
  await did.authenticate();
  ceramic.did = did;
};

import Head from "next/head";
import Nav from "../components/Navbar";
import styles from "./index.module.css";
import Chat from "../components/Chat";
import type { NextPage } from "next";
import { useEffect, useState } from "react";
import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { ILitNodeClient } from "@lit-protocol/types";
import { WagmiConfig, useAccount } from "wagmi";
import { useComposeDB } from '../fragments'
import { networks } from "../../utils/networks";
import { AttestationItem } from "../components/AttestationItem";
import { ResolvedAttestation } from "../../utils/types";

const Home: NextPage = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [lit, setLit] = useState<ILitNodeClient>();
  // const [address, setAddress] = useState<string>("");
  const { address, isConnecting, isDisconnected } = useAccount()
  const { isAuthenticated, compose } = useComposeDB();
  const [account, setAccount] = useState("");
  const [network, setNetwork] = useState("");
  const [attestations, setAttestations] = useState<ResolvedAttestation[]>([]);
  const [loading, setLoading] = useState(false);

  const startLitClient = (window: Window): ILitNodeClient => {
    // connect to lit
    console.log("Starting Lit Client...");
    const client = new LitJsSdk.LitNodeClient({
      url: window.location.origin,
    });
    client.connect();
    return client as ILitNodeClient;
  };


  //method to get all attestations
  async function getAtts() {
    if(isDisconnected) return;
    setLoading(true);
    const data: any = await compose.executeQuery(`
            query {
              powerUpAttestationIndex(filters: {
                or: [
          {
            where: {
              attester: { 
                    equalTo: "${address}"
                  } 
            }
          },
          {
            and: {
              where: {
            recipient : {
                    equalTo: "${address}"
                  } 
              }
            }
          }
            ],
            } 
          first: 100) {
            edges {
              node {
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
                    time
                }
              }
            }
          }
      `);
    console.log(data)
    //exit call if no attestations are found
    // if (!account || !tmpAttestations.data) {
    //   return;
    // }

    // //establish allRecords to check whether corresponding confirmations exist
    // const allRecords = tmpAttestations.data.attestationIndex.edges;
    // const addresses = new Set<string>();

    // allRecords.forEach((att: any) => {
    //   const obj = att.node;
    //   addresses.add(obj.attester);
    //   addresses.add(obj.recipient);
    // });


    // const records: any[] = [];
    // allRecords.forEach((att: any) => {
    //   const item = att.node;
    //   //if confirm field contains an item, a confirmation has been found
    //   if (att.node.confirm.edges.length) {
    //     item.confirmation = true;
    //   }
    //   item.uid = att.node.uid;
    //   item.currAccount = account;
    //   records.push(item);
    // });
    // setAttestations([...attestations, ...records]);
    // console.log(records)
    setLoading(false);
  }


  useEffect(() => {
    getAtts();
  }, [account]);

  const handleLogin = async () => {
      const thisLit = startLitClient(window);
      setLit(thisLit);
  };



  return (
    <>
      <Nav />
      <Head>
        <title>Ceramic Message Board with LIT</title>
        <meta
          name="description"
          content="A proof-of-concept application that uses LIT Protocol with storage on Ceramic using ComposeDB."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {(!isDisconnected) ? (
        <main className={styles.main}>
          {lit && address && <h1 className={styles.title}>
            Test <span className={styles.pinkSpan}>Consuming</span> PowerUps
          </h1>}
          {lit && address && <Chat address={address?.toLowerCase()} lit={lit} />}
        </main>
      ) : (
        <main className={styles.main}></main>
      )}
    </>
  );
};

export default Home;

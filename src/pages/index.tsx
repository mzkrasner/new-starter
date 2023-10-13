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

const Home: NextPage = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [lit, setLit] = useState<ILitNodeClient>();
  // const [address, setAddress] = useState<string>("");
  const { address, isConnecting, isDisconnected } = useAccount()
  const { isAuthenticated } = useComposeDB();

  const handleLogin = async () => {
      const thisLit = startLitClient(window);
      setLit(thisLit);
  };

  const startLitClient = (window: Window): ILitNodeClient => {
    // connect to lit
    console.log("Starting Lit Client...");
    const client = new LitJsSdk.LitNodeClient({
      url: window.location.origin,
    });
    client.connect();
    return client as ILitNodeClient;
  };

  useEffect(() => {
    handleLogin();
  }, []);

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
            ComposeDB <span className={styles.pinkSpan}>with</span> EAS + NewCoin
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

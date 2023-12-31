import type { NextPage } from "next";
import Head from "next/head";
import { useState, useEffect } from "react";
import type { BasicProfile } from "@datamodels/identity-profile-basic";
import { useCeramicContext } from "../context";
import { authenticateCeramic } from "../utils";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  const clients = useCeramicContext();
  const { ceramic, composeClient } = clients;
  const [profile, setProfile] = useState<BasicProfile | undefined>();
  const [loading, setLoading] = useState<boolean>(false);
  const [username, setUsername] = useState("");
  const [weight, setWeight] = useState("");
  const [res, setRes] = useState("");

  const handleLogin = async () => {
    await authenticateCeramic(ceramic, composeClient);
    await getProfile();
  };

  const getProfile = async () => {
    setLoading(true);
    if (ceramic.did !== undefined) {
      const profile = await composeClient.executeQuery(`
        query {
          viewer {
            basicProfile {
              id
              name
              description
              gender
              emoji
            }
          }
        }
      `);

      setProfile(profile?.data?.viewer?.basicProfile);
      setLoading(false);
    }
  };

  const createIssuer = async () => {
    if (ceramic.did !== undefined) {
      const item = await composeClient.executeQuery(`
      mutation {
        createIssuer(
          input: {
            content: {
              agent: "${ceramic.did.id}"
              username: "${username}"
              wattWeight: ${Number(weight)}
            }
          }
        ) {
          document {
            id
            controller {
              id
            }
            agent {
              id
            }
            username
            wattWeight
          }
          
        }
      }
      `);
      console.log(item);
      setRes(JSON.stringify(item));
      setLoading(false);
    }
  };

  /**
   * On load check if there is a DID-Session in local storage.
   * If there is a DID-Session we can immediately authenticate the user.
   * For more details on how we do this check the 'authenticateCeramic function in`../utils`.
   */
  useEffect(() => {
    if (localStorage.getItem("did")) {
      handleLogin();
    }
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create ceramic app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        {profile === undefined && ceramic.did === undefined ? (
          <button
            onClick={() => {
              handleLogin();
            }}
          >
            Login
          </button>
        ) : (
          <>
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label>Username</label>
                <input
                  type="text"
                  defaultValue={""}
                  onChange={(e) => {
                    setUsername(e.target.value);
                  }}
                />
                <label>Watt Weight</label>
                <input
                  type="text"
                  defaultValue={""}
                  onChange={(e) => {
                    setWeight(e.target.value);
                  }}
                />
              </div>
              <div className={styles.buttonContainer}>
                <button
                  onClick={() => {
                    createIssuer();
                  }}
                >
                  {loading ? "Loading..." : "Create Issuer"}
                </button>
              </div>
            </div>
            <br></br>
            <label>Result </label>
            <textarea
              style={{ height: "20rem", width: "50rem", padding: "1rem" }}
              value={res}
              onChange={(e) => {
                setRes(e.target.value);
              }}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default Home;

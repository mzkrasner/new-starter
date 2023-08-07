# ComposeDB + Newcoin Prototype

This repo contains a rough first stab at the data models needed for ComposeDB to accommodate Newcoin's PowerUP verifiable credential concept.

## Getting Started

1. Install your dependencies:

Install your dependencies:

```bash
npm install
```

2. Generate an admin seed and enter it into admin_seed.txt - you can reference our [set up your environment](https://composedb.js.org/docs/0.4.x/set-up-your-environment) page for both this step and the next

3. Generate an admin did from your seed and enter it into composedb.config.json in the admin-dids array

4. In your terminal, run the following to start your Postgres instance:

```bash
docker-compose up
```
5. Finally, run your application in a new terminal (first ensure you are running node v16 in your terminal):

```bash
npm run dev
```
- Open [http://localhost:3000](http://localhost:3000) with your browser to see the result and generate issuer instances
- Open [http://localhost:3000/powerup](http://localhost:3000/powerup) with your browser to generate PowerUP instances
- Open [http://localhost:3000/query](http://localhost:3000/query) to test some pre-written queries

## Learn More

To learn more about Ceramic please visit the following links

- [Ceramic Documentation](https://developers.ceramic.network/learn/welcome/) - Learn more about the Ceramic Ecosystem.
- [ComposeDB](https://composedb.js.org/) - Details on how to use and develop with ComposeDB!

You can check out [Create Ceramic App repo](https://github.com/ceramicstudio/create-ceramic-app) and provide us with your feedback or contributions! 

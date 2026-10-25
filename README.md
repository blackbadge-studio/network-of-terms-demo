# Network of Terms demonstrator

This is a demonstrator for the [Network of Terms](https://www.netwerkdigitaalerfgoed.nl/en/knowledge-services/usable-digital-heritage/network-of-terms/).

Collection managers can [use this demonstrator](https://termennetwerk.netwerkdigitaalerfgoed.nl/) for looking up terms in the Network of Terms.

Software developers may be interested in the source code as an example implementation of a client for the 
[Network of Terms GraphQL API](https://github.com/netwerk-digitaal-erfgoed/network-of-terms-api). 

This implementation is a TypeScript/Vue 3 browser client app.

## Development

Start by cloning the repository:

```bash 
$ git clone https://github.com/netwerk-digitaal-erfgoed/network-of-terms-demo.git
$ cd network-of-terms-demo
```

To run the development version using docker:
```bash
$ docker compose run --service-ports --rm node
```

To run the development version using node:

```bash 
$ npm install
$ npm run dev
```



## Vlaams Termennetwerk (proof of concept)

This branch restyles the demonstrator as the Flemish search interface on top of the
Black Badge Studio fork of the Network of Terms API, with meemoo's brand tokens
(`src/index.css`). Runs on Laravel Cloud as a Node app:

- Build: `npm ci --audit false` then `npm run build`
- Start: `npm start` (serves `dist/` with SPA fallback on `PORT`)
- Env: `VITE_GRAPHQL_URL` is read at build time; `.env.production` points at the POC API.

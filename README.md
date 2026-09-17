# Avalanche ICM Visualizer

A focused, read-only visualization of Interchain Messaging traffic between Avalanche L1s.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The default mock provider works without RPC configuration.

## Data modes

Mock traffic is the default and is suitable for development. Use the mode control to try the live provider. Live traffic requires configured RPC endpoints and protocol contract addresses on the supplied chain configuration; the UI reports unavailable or failed live sources without fabricating traffic.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Custom chains are stored locally in the browser. Useful network and filter state can be shared through URL query parameters, including a selected message.

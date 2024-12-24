# Privy Server Wallet for AI Agents

This package provides a plugin for AI agents to interact with Privy server wallets, enabling secure blockchain transactions across multiple networks.

## Features

- Create server wallets using Privy's API
- Send transactions across supported networks (Ethereum, EVM-compatible chains, Solana)
- Check native and token balances
- Transaction history logging in agent memory
- TypeScript support with proper type definitions

## Installation

```bash
npm install @graviton/agent-privy-serverwallet
# or
yarn add @graviton/agent-privy-serverwallet
# or
pnpm add @graviton/agent-privy-serverwallet
```

## Usage

```typescript
import { createWalletAction, sendTransactionAction, getBalanceAction } from '@graviton/agent-privy-serverwallet';

// Create a new wallet
const wallet = await createWalletAction.handler(runtime, {
  network: 'ethereum',
  credentials: {
    appId: 'your-privy-app-id',
    secret: 'your-privy-secret'
  }
});

// Send a transaction
const tx = await sendTransactionAction.handler(runtime, {
  walletAddress: wallet.address,
  network: 'ethereum',
  to: '0x...',
  value: '0.1',
  credentials: {
    appId: 'your-privy-app-id',
    secret: 'your-privy-secret'
  }
});

// Check wallet balance
const balance = await getBalanceAction.handler(runtime, {
  walletAddress: wallet.address,
  network: 'ethereum',
  credentials: {
    appId: 'your-privy-app-id',
    secret: 'your-privy-secret'
  }
});
```

## Configuration

The plugin requires Privy API credentials:

- `appId`: Your Privy application ID
- `secret`: Your Privy API secret key

These can be provided when calling any of the actions.

## Actions

### createWallet

Creates a new server wallet on the specified network.

```typescript
interface CreateWalletParams {
  network: string;
  credentials: {
    appId: string;
    secret: string;
  };
}
```

### sendTransaction

Sends a transaction from a server wallet.

```typescript
interface SendTransactionParams {
  walletAddress: string;
  network: string;
  to: string;
  value: string;
  data?: string;
  credentials: {
    appId: string;
    secret: string;
  };
}
```

### getBalance

Retrieves the balance of a server wallet.

```typescript
interface GetBalanceParams {
  walletAddress: string;
  network: string;
  credentials: {
    appId: string;
    secret: string;
  };
}
```

## Transaction History

All transactions are automatically logged to the agent's memory for future reference. The transaction history includes:

- Transaction hash
- Network
- From/To addresses
- Value
- Status
- Timestamp

## Error Handling

The plugin includes comprehensive error handling for:

- Invalid credentials
- Network errors
- Transaction failures
- Invalid parameters

All errors are properly typed and include descriptive messages.

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test
pnpm test
```

## License

MIT

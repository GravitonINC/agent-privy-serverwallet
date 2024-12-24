// src/actions/createWallet.ts
import axios from "axios";

// src/utils/transactionLogger.ts
async function logTransaction(runtime, log) {
  const memory = runtime.memory;
  await memory.remember({
    type: "blockchain_transaction",
    content: JSON.stringify(log),
    metadata: {
      type: log.type,
      network: log.network,
      timestamp: log.timestamp,
      ...log.hash && { hash: log.hash },
      ...log.from && { from: log.from },
      ...log.to && { to: log.to },
      ...log.address && { address: log.address }
    }
  });
}

// src/actions/createWallet.ts
var createWalletAction = {
  name: "createWallet",
  description: "Creates a new Privy server wallet",
  similes: [
    "create a new wallet",
    "initialize a blockchain wallet",
    "set up a new wallet"
  ],
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Create a new wallet on Ethereum network"
        }
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Created new wallet on Ethereum network with address 0xabc..."
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Initialize a server wallet on Polygon"
        }
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Initialized new wallet on Polygon network with address 0xdef..."
        }
      }
    ]
  ],
  validate: async (runtime, message) => {
    const params = message.content;
    return !!(params?.network && params?.credentials?.appId && params?.credentials?.secret);
  },
  async handler(runtime, message, _state) {
    const params = message.content;
    const { network, credentials } = params;
    const { appId, secret } = credentials;
    if (!appId || !secret) {
      throw new Error("Missing required credentials");
    }
    try {
      const response = await axios.post(
        "https://auth.privy.io/api/v1/server_wallets",
        { network },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${secret}`,
            "X-App-Id": appId
          }
        }
      );
      const wallet = {
        address: response.data.address,
        network: response.data.network
      };
      await logTransaction(runtime, {
        type: "WALLET_CREATION",
        network: wallet.network,
        address: wallet.address,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return wallet;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to create wallet: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }
};

// src/actions/sendTransaction.ts
import axios2 from "axios";
var sendTransactionAction = {
  name: "sendTransaction",
  description: "Sends a transaction from a Privy server wallet",
  similes: [
    "send tokens",
    "transfer funds",
    "make a transaction"
  ],
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Send 0.1 ETH from wallet 0xabc... to 0x123..."
        }
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Transaction sent successfully. Hash: 0x789..."
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Transfer 1 SOL from wallet abc to xyz"
        }
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Transaction sent successfully. Hash: abc123..."
        }
      }
    ]
  ],
  validate: async (runtime, message) => {
    const params = message.content;
    return !!(params?.walletAddress && params?.network && params?.to && params?.value && params?.credentials?.appId && params?.credentials?.secret);
  },
  async handler(runtime, message, _state) {
    const params = message.content;
    const { walletAddress, network, to, value, data, credentials } = params;
    const { appId, secret } = credentials;
    if (!appId || !secret) {
      throw new Error("Missing required credentials");
    }
    try {
      const response = await axios2.post(
        `https://auth.privy.io/api/v1/server_wallets/${walletAddress}/transactions`,
        {
          network,
          to,
          value,
          data
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${secret}`,
            "X-App-Id": appId
          }
        }
      );
      const transaction = {
        hash: response.data.hash,
        network,
        from: walletAddress,
        to,
        value
      };
      await logTransaction(runtime, {
        type: "TRANSACTION",
        hash: transaction.hash,
        network: transaction.network,
        from: transaction.from,
        to: transaction.to,
        value: transaction.value,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return transaction;
    } catch (error) {
      if (axios2.isAxiosError(error)) {
        throw new Error(`Failed to send transaction: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }
};

// src/actions/getBalance.ts
import axios3 from "axios";
var getBalanceAction = {
  name: "getBalance",
  description: "Gets the balance of a Privy server wallet",
  similes: [
    "check wallet balance",
    "view account balance",
    "get token balance"
  ],
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Check balance of wallet 0xabc... on Ethereum"
        }
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Wallet 0xabc... has a balance of 1.5 ETH"
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Get balance for address 0x123... on Polygon"
        }
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Wallet 0x123... has a balance of 100 MATIC"
        }
      }
    ]
  ],
  validate: async (runtime, message) => {
    const params = message.content;
    return !!(params?.walletAddress && params?.network && params?.credentials?.appId && params?.credentials?.secret);
  },
  async handler(runtime, message, _state) {
    const params = message.content;
    const { walletAddress, network, credentials } = params;
    const { appId, secret } = credentials;
    if (!appId || !secret) {
      throw new Error("Missing required credentials");
    }
    try {
      const response = await axios3.get(
        `https://auth.privy.io/api/v1/server_wallets/${walletAddress}/balance`,
        {
          params: { network },
          headers: {
            "Authorization": `Bearer ${secret}`,
            "X-App-Id": appId
          }
        }
      );
      return {
        address: walletAddress,
        network,
        nativeBalance: response.data.nativeBalance,
        tokens: response.data.tokens
      };
    } catch (error) {
      if (axios3.isAxiosError(error)) {
        throw new Error(`Failed to get balance: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }
};
export {
  createWalletAction,
  getBalanceAction,
  sendTransactionAction
};
//# sourceMappingURL=index.js.map
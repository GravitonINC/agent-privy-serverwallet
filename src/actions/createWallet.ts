import axios from 'axios';
import { Action, IAgentRuntime, Memory, State } from '@ai16z/eliza';
import { logTransaction } from '../utils/transactionLogger';

export interface CreateWalletParams {
  network: string;
  credentials: {
    appId: string;
    secret: string;
  };
}

export interface CreateWalletResponse {
  address: string;
  network: string;
}

export const createWalletAction: Action = {
  name: 'createWallet',
  description: 'Creates a new Privy server wallet',
  similes: [
    'create a new wallet',
    'initialize a blockchain wallet',
    'set up a new wallet'
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
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const params = message.content as unknown as CreateWalletParams;
    return !!(params?.network && params?.credentials?.appId && params?.credentials?.secret);
  },

  async handler(runtime: IAgentRuntime, message: Memory, _state?: State) {
    const params = message.content as unknown as CreateWalletParams;
    const { network, credentials } = params;
    const { appId, secret } = credentials;

    if (!appId || !secret) {
      throw new Error('Missing required credentials');
    }

    try {
      const response = await axios.post(
        'https://auth.privy.io/api/v1/server_wallets',
        { network },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${secret}`,
            'X-App-Id': appId,
          },
        }
      );

      const wallet = {
        address: response.data.address,
        network: response.data.network,
      };

      // Log wallet creation
      await logTransaction(runtime, {
        type: 'WALLET_CREATION',
        network: wallet.network,
        address: wallet.address,
        timestamp: new Date().toISOString(),
      });

      return wallet;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to create wallet: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  },
};

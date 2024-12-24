import axios from 'axios';
import { Action, IAgentRuntime, Memory, State } from '@ai16z/eliza';

export interface GetBalanceParams {
  walletAddress: string;
  network: string;
  credentials: {
    appId: string;
    secret: string;
  };
}

export interface TokenBalance {
  token: string;
  amount: string;
  symbol: string;
  decimals: number;
}

export interface GetBalanceResponse {
  address: string;
  network: string;
  nativeBalance: string;
  tokens?: TokenBalance[];
}

export const getBalanceAction: Action = {
  name: 'getBalance',
  description: 'Gets the balance of a Privy server wallet',
  similes: [
    'check wallet balance',
    'view account balance',
    'get token balance'
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
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const params = message.content as unknown as GetBalanceParams;
    return !!(
      params?.walletAddress &&
      params?.network &&
      params?.credentials?.appId &&
      params?.credentials?.secret
    );
  },

  async handler(runtime: IAgentRuntime, message: Memory, _state?: State) {
    const params = message.content as unknown as GetBalanceParams;
    const { walletAddress, network, credentials } = params;
    const { appId, secret } = credentials;

    if (!appId || !secret) {
      throw new Error('Missing required credentials');
    }

    try {
      const response = await axios.get(
        `https://auth.privy.io/api/v1/server_wallets/${walletAddress}/balance`,
        {
          params: { network },
          headers: {
            'Authorization': `Bearer ${secret}`,
            'X-App-Id': appId,
          },
        }
      );

      return {
        address: walletAddress,
        network,
        nativeBalance: response.data.nativeBalance,
        tokens: response.data.tokens,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get balance: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  },
};

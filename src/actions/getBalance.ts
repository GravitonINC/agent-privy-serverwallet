import axios from 'axios';
import { Action } from '@graviton/agent-core';

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

export const getBalanceAction: Action<GetBalanceParams, GetBalanceResponse> = {
  name: 'getBalance',
  description: 'Gets the balance of a Privy server wallet',
  parameters: {
    type: 'object',
    properties: {
      walletAddress: {
        type: 'string',
        description: 'Address of the server wallet',
      },
      network: {
        type: 'string',
        description: 'Blockchain network to check balance on',
      },
      credentials: {
        type: 'object',
        properties: {
          appId: {
            type: 'string',
            description: 'Privy App ID',
          },
          secret: {
            type: 'string',
            description: 'Privy API Secret',
          },
        },
        required: ['appId', 'secret'],
      },
    },
    required: ['walletAddress', 'network', 'credentials'],
  },

  async handler(runtime, params) {
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

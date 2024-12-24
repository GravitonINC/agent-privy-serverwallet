import axios, { AxiosError } from 'axios';
import { Action, Runtime } from '@graviton/agent-core';

export interface GetAggregatedBalanceParams {
  walletIds?: string[];
  tags?: string[];
  network?: string;
  credentials: {
    appId: string;
    secret: string;
  };
}

export interface Balance {
  address: string;
  network: string;
  balance: string;
  metadata?: {
    customId?: string;
    tags?: string[];
    description?: string;
  };
}

export interface GetAggregatedBalanceResponse {
  balances: Balance[];
  totalBalance: string;
}

export const getAggregatedBalanceAction: Action<GetAggregatedBalanceParams, GetAggregatedBalanceResponse> = {
  name: 'getAggregatedBalance',
  description: 'Get aggregated balance for multiple wallets by IDs or tags',
  parameters: {
    type: 'object',
    properties: {
      walletIds: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'List of wallet addresses to query',
      },
      tags: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'List of tags to filter wallets by',
      },
      network: {
        type: 'string',
        description: 'Optional network to filter balances by',
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
    oneOf: [
      { required: ['walletIds', 'credentials'] },
      { required: ['tags', 'credentials'] },
    ],
  },

  async handler(runtime: Runtime, params: GetAggregatedBalanceParams) {
    const { walletIds, tags, network, credentials } = params;
    const { appId, secret } = credentials;

    if (!appId || !secret) {
      throw new Error('Missing required credentials');
    }

    if (!walletIds && !tags) {
      throw new Error('Either walletIds or tags must be provided');
    }

    try {
      const response = await axios.post(
        'https://auth.privy.io/api/v1/server_wallets/balances/aggregate',
        {
          walletIds,
          tags,
          network,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${secret}`,
            'X-App-Id': appId,
          },
        }
      );

      const result = {
        balances: response.data.balances,
        totalBalance: response.data.totalBalance,
      };

      // Log the aggregated balance query
      await runtime.memory.remember({
        type: 'balance_query',
        content: JSON.stringify({
          type: 'AGGREGATED_BALANCE',
          walletIds,
          tags,
          network,
          totalBalance: result.totalBalance,
          timestamp: new Date().toISOString(),
        }),
        metadata: {
          type: 'AGGREGATED_BALANCE',
          network: network || 'all',
          timestamp: new Date().toISOString(),
          walletCount: result.balances.length,
        },
      });

      return result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        throw new Error(`Failed to get aggregated balance: ${axiosError.response?.data?.message || axiosError.message}`);
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred');
    }
  },
};

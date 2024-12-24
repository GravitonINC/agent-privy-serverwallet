import axios from 'axios';
import { Action } from '@graviton/agent-core';
import { logTransaction } from '../utils/transactionLogger';

import { WalletMetadata } from '../utils/transactionLogger';

export interface CreateWalletParams {
  network: string;
  metadata?: WalletMetadata;
  credentials: {
    appId: string;
    secret: string;
  };
}

export interface CreateWalletResponse {
  address: string;
  network: string;
}

export const createWalletAction: Action<CreateWalletParams, CreateWalletResponse> = {
  name: 'createWallet',
  description: 'Creates a new Privy server wallet',
  parameters: {
    type: 'object',
    properties: {
      network: {
        type: 'string',
        description: 'Blockchain network to create the wallet on',
      },
      metadata: {
        type: 'object',
        properties: {
          customId: {
            type: 'string',
            description: 'Custom identifier for the wallet',
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Tags for organizing wallets',
          },
          description: {
            type: 'string',
            description: 'Optional description of the wallet',
          },
        },
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
    required: ['network', 'credentials'],
  },

  async handler(runtime, params) {
    const { network, metadata, credentials } = params;
    const { appId, secret } = credentials;

    if (!appId || !secret) {
      throw new Error('Missing required credentials');
    }

    try {
      const response = await axios.post(
        'https://auth.privy.io/api/v1/server_wallets',
        { 
          network,
          ...(metadata && { metadata }),
        },
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
        metadata,
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

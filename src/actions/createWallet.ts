import axios from 'axios';
import { Action } from '@graviton/agent-core';
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

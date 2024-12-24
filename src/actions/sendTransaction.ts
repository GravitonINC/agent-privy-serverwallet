import axios from 'axios';
import { Action } from '@graviton/agent-core';
import { logTransaction } from '../utils/transactionLogger';

export interface SendTransactionParams {
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

export interface SendTransactionResponse {
  hash: string;
  network: string;
  from: string;
  to: string;
  value: string;
}

export const sendTransactionAction: Action<SendTransactionParams, SendTransactionResponse> = {
  name: 'sendTransaction',
  description: 'Sends a transaction from a Privy server wallet',
  parameters: {
    type: 'object',
    properties: {
      walletAddress: {
        type: 'string',
        description: 'Address of the server wallet',
      },
      network: {
        type: 'string',
        description: 'Blockchain network to send the transaction on',
      },
      to: {
        type: 'string',
        description: 'Recipient address',
      },
      value: {
        type: 'string',
        description: 'Amount to send (in native currency)',
      },
      data: {
        type: 'string',
        description: 'Optional transaction data',
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
    required: ['walletAddress', 'network', 'to', 'value', 'credentials'],
  },

  async handler(runtime, params) {
    const { walletAddress, network, to, value, data, credentials } = params;
    const { appId, secret } = credentials;

    if (!appId || !secret) {
      throw new Error('Missing required credentials');
    }

    try {
      const response = await axios.post(
        `https://auth.privy.io/api/v1/server_wallets/${walletAddress}/transactions`,
        {
          network,
          to,
          value,
          data,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${secret}`,
            'X-App-Id': appId,
          },
        }
      );

      const transaction = {
        hash: response.data.hash,
        network,
        from: walletAddress,
        to,
        value,
      };

      // Log transaction
      await logTransaction(runtime, {
        type: 'TRANSACTION',
        hash: transaction.hash,
        network: transaction.network,
        from: transaction.from,
        to: transaction.to,
        value: transaction.value,
        timestamp: new Date().toISOString(),
      });

      return transaction;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to send transaction: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  },
};

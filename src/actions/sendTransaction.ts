import axios, { AxiosError } from 'axios';
import { Action, Runtime } from '@graviton/agent-core';
import { logTransaction } from '../utils/transactionLogger';

export interface SendTransactionParams {
  walletAddress: string;
  network: string;
  to: string;
  value: string;
  data?: string;
  idempotencyKey?: string;
  useThirdPartyGas?: boolean;
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
  gasUsed?: string;
  gasPayedBy?: string;
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
      useThirdPartyGas: {
        type: 'boolean',
        description: 'Whether to use third-party gas payment for this transaction',
        default: false,
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
      idempotencyKey: {
        type: 'string',
        description: 'Optional unique key to prevent duplicate transactions',
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

  async handler(runtime: Runtime, params: SendTransactionParams) {
    const { walletAddress, network, to, value, data, idempotencyKey, useThirdPartyGas, credentials } = params;
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
          idempotencyKey,
          useThirdPartyGas,
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
        gasUsed: response.data.gasUsed,
        gasPayedBy: useThirdPartyGas ? 'privy' : walletAddress,
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
        metadata: {
          useThirdPartyGas: useThirdPartyGas || false,
          gasUsed: response.data.gasUsed,
          gasPayedBy: useThirdPartyGas ? 'privy' : transaction.from,
        },
      });

      return transaction;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        throw new Error(`Failed to send transaction: ${axiosError.response?.data?.message || axiosError.message}`);
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred');
    }
  },
};

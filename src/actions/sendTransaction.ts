import axios from 'axios';
import { Action, IAgentRuntime, Memory, State } from '@ai16z/eliza';
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

export const sendTransactionAction: Action = {
  name: 'sendTransaction',
  description: 'Sends a transaction from a Privy server wallet',
  similes: [
    'send tokens',
    'transfer funds',
    'make a transaction'
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
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const params = message.content as unknown as SendTransactionParams;
    return !!(
      params?.walletAddress &&
      params?.network &&
      params?.to &&
      params?.value &&
      params?.credentials?.appId &&
      params?.credentials?.secret
    );
  },

  async handler(runtime: IAgentRuntime, message: Memory, _state?: State) {
    const params = message.content as unknown as SendTransactionParams;
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

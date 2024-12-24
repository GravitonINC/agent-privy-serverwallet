import { Runtime } from '@graviton/agent-core';

export interface WalletMetadata {
  customId?: string;
  tags?: string[];
  description?: string;
  useThirdPartyGas?: boolean;
  gasUsed?: string;
  gasPayedBy?: string;
}

interface TransactionLog {
  type: 'TRANSACTION' | 'WALLET_CREATION';
  hash?: string;
  network: string;
  from?: string;
  to?: string;
  value?: string;
  address?: string;
  metadata?: WalletMetadata;
  timestamp: string;
}

export async function logTransaction(runtime: Runtime, log: TransactionLog): Promise<void> {
  const memory = runtime.memory;
  
  // Create a memory entry for the transaction
  await memory.remember({
    type: 'blockchain_transaction',
    content: JSON.stringify(log),
    metadata: {
      type: log.type,
      network: log.network,
      timestamp: log.timestamp,
      ...(log.hash && { hash: log.hash }),
      ...(log.from && { from: log.from }),
      ...(log.to && { to: log.to }),
      ...(log.address && { address: log.address }),
      ...(log.metadata && { metadata: log.metadata }),
    },
  });
}

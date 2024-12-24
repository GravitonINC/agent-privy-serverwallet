import { Action } from '@ai16z/eliza';

interface CreateWalletParams {
    network: string;
    credentials: {
        appId: string;
        secret: string;
    };
}
interface CreateWalletResponse {
    address: string;
    network: string;
}
declare const createWalletAction: Action;

interface SendTransactionParams {
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
interface SendTransactionResponse {
    hash: string;
    network: string;
    from: string;
    to: string;
    value: string;
}
declare const sendTransactionAction: Action;

interface GetBalanceParams {
    walletAddress: string;
    network: string;
    credentials: {
        appId: string;
        secret: string;
    };
}
interface TokenBalance {
    token: string;
    amount: string;
    symbol: string;
    decimals: number;
}
interface GetBalanceResponse {
    address: string;
    network: string;
    nativeBalance: string;
    tokens?: TokenBalance[];
}
declare const getBalanceAction: Action;

export { type CreateWalletParams, type CreateWalletResponse, type GetBalanceParams, type GetBalanceResponse, type SendTransactionParams, type SendTransactionResponse, createWalletAction, getBalanceAction, sendTransactionAction };

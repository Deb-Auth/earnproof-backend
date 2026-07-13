export type HorizonPaymentRecord = {
  id: string;
  type: string;
  transaction_hash: string;
  created_at: string;
  from?: string;
  to?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
  amount?: string;
};

export type HorizonCollection<TRecord> = {
  _embedded?: {
    records?: TRecord[];
  };
};

export type NormalizedPayment = {
  operationId: string;
  stellarTransactionHash: string;
  sourceAddress: string;
  destinationAddress: string;
  assetCode: string;
  assetIssuer: string | null;
  amount: string;
  occurredAt: Date;
};

export type AuthenticatedUser = {
  id: string;
  walletAddress: string;
  walletHash: string;
  role: string;
};

export type AuthTokenPayload = AuthenticatedUser & {
  exp: number;
};

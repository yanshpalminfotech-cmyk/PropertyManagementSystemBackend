export enum TokenType {
  REFRESH = 'REFRESHTOKEN',
  ACCESS = 'ACCESSTOKEN',
}

export interface IToken {
  id: string;
  hashedToken: string;
  expiresAt: Date;
  isRevoked: boolean;
  tokenType: TokenType;
  userId: string;
  createdAt: Date;
}

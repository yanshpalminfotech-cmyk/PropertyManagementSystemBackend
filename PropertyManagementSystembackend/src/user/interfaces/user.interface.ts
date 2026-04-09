export enum UserRole {
  ADMIN = 'ADMIN',
  BROKER = 'BROKER',
  CUSTOMER = 'CUSTOMER',
}
  
export interface IUser {
  id: string;
  userCode: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  failedLoginAttempts: number;
  isLocked: boolean;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

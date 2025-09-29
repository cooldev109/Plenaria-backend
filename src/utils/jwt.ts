import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: (user._id as any).toString(),
    email: user.email,
    role: user.role
  };

  const jwtSecret = process.env.JWT_SECRET || 'plenaria-dev-secret-key-2024';
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn } as any);
};

export const verifyToken = (token: string): JWTPayload => {
  const jwtSecret = process.env.JWT_SECRET || 'plenaria-dev-secret-key-2024';
  
  return jwt.verify(token, jwtSecret) as JWTPayload;
};

export const generateRefreshToken = (user: IUser): string => {
  const payload = {
    userId: (user._id as any).toString(),
    type: 'refresh'
  };

  const jwtSecret = process.env.JWT_SECRET || 'plenaria-dev-secret-key-2024';
  const refreshExpiresIn = '30d'; // Refresh tokens last longer

  return jwt.sign(payload, jwtSecret, { expiresIn: refreshExpiresIn } as any);
};

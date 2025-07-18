import { Request, Response, NextFunction } from 'express';
import { sequelize } from '../config/database';
import initUserModel from '../models/userModel';
import { DataTypes } from 'sequelize';

const User = initUserModel(sequelize, DataTypes);

declare module 'express-session' {
  interface SessionData {
    userId: number;
    isAdmin: boolean;
  }
}

export const requireLogin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    res.redirect('/login');
    return;
  }
  next();
};

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.session.userId);
    if (!user || !(user as any).isAdmin) {
      res.status(403).send('Acesso negado');
      return;
    }
    next();
  } catch (error) {
    console.error('Erro no middleware isAdmin:', error);
    res.status(500).send('Erro interno');
  }
};
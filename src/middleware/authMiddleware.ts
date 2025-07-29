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

// Middleware para adicionar dados úteis a todas as views
export const viewDataMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.locals.currentPath = req.path;
    res.locals.currentQuery = req.query;
    
    // Garante que user sempre exista, mesmo que seja null
    res.locals.user = null;
    
    if (req.session.userId) {
      const user = await User.findByPk(req.session.userId);
      if (user) {
        res.locals.user = user.get({ plain: true }); // Converte para objeto simples
      }
    }
    next();
  } catch (error) {
    console.error('Error in viewDataMiddleware:', error);
    next(error);
  }
};

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
    next(error);
  }
};
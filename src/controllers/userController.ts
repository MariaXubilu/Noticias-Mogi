import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import initUserModel from '../models/userModel';
import { sequelize } from '../config/database';
import { DataTypes, Model } from 'sequelize';

// Interface local
interface UserAttributes {
  id?: number;
  username: string;
  email: string;
  password: string;
  isAdmin?: boolean;
  foto?: string;
  biografia?: string;
}

interface UserInstance extends Model<UserAttributes>, UserAttributes {}

// Inicializa o modelo User
const User = initUserModel(sequelize, DataTypes) as unknown as typeof Model & {
  new (): UserInstance;
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.create(req.body as UserAttributes) as UserInstance;
    req.session.userId = user.id as number;
    res.redirect('/');
  } catch (error: any) {
    res.status(400).render('register', { 
      error: error.message,
      formData: req.body
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } }) as UserInstance;
    
    if (!user) {
      res.status(401).render('login', { 
        error: 'Usuário ou senha incorretos',
        username
      });
      return;
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      res.status(401).render('login', { 
        error: 'Usuário ou senha incorretos',
        username
      });
      return;
    }
    
    req.session.userId = user.id as number;
    res.redirect('/');
  } catch (error) {
    res.status(500).render('login', { 
      error: 'Erro no servidor',
      username: req.body.username
    });
  }
};

export const logout = (req: Request, res: Response): void => {
  req.session.destroy(err => {
    if (err) {
      res.redirect('/');
      return;
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const updateData: Partial<UserAttributes> = {
      username: req.body.username,
      biografia: req.body.biografia
    };

    if (req.file) {
      updateData.foto = '/uploads/' + req.file.filename;
    }

    if (req.body.password && req.body.password.trim() !== '') {
      updateData.password = await bcrypt.hash(req.body.password, 10);
    }

    await User.update(updateData, {
      where: { id: req.session.userId }
    });

    res.redirect('/perfil?success=perfil');
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.redirect('/perfil?error=perfil');
  }
};
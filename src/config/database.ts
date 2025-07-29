import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false // Alterado para false para desativar TODOS os logs SQL
});

export { 
  sequelize, 
  Sequelize,
  Op 
};
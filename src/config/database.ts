import { Sequelize, Op } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: console.log
});

export { 
  sequelize, 
  Sequelize,
  Op
};
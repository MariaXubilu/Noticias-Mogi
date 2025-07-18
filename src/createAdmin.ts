import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from './config/database';
import bcrypt from 'bcrypt';
import initUserModel from './models/userModel';
import { DataTypes } from 'sequelize';

const User = initUserModel(sequelize, DataTypes);

async function createAdmin() {
  try {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_EMAIL_PASSWORD) {
      throw new Error('Variáveis ADMIN_EMAIL e ADMIN_EMAIL_PASSWORD não encontradas no .env');
    }

    await sequelize.authenticate();
    await sequelize.sync();

    const existingAdmin = await User.findOne({
      where: { email: process.env.ADMIN_EMAIL }
    });

    if (existingAdmin) {
      console.log('Administrador já existe. Atualizando para admin...');
      await existingAdmin.update({ 
        isAdmin: true,
        password: await bcrypt.hash(process.env.ADMIN_EMAIL_PASSWORD, 10)
      });
      console.log('Administrador atualizado com sucesso!');
    } else {
      const adminData = {
        username: 'admin',
        email: process.env.ADMIN_EMAIL,
        password: await bcrypt.hash(process.env.ADMIN_EMAIL_PASSWORD, 10),
        isAdmin: true
      };

      await User.create(adminData);
      console.log('Administrador criado com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao criar/atualizar administrador:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

createAdmin();
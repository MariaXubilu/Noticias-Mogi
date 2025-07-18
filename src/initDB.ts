import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize, DataTypes } from 'sequelize';
import * as bcrypt from 'bcrypt';

// Importar modelos como funções de fábrica
import initUserModel from './models/userModel';
import initContatoModel from './models/Contato';
import initNoticiaModel from './models/Noticia';

// Configuração do Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: console.log
});

// Inicializar modelos
const User = initUserModel(sequelize, DataTypes);
const Contato = initContatoModel(sequelize, DataTypes);
const Noticia = initNoticiaModel(sequelize, DataTypes);

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco estabelecida.');

    // Sincronizar modelos
    await sequelize.sync({ force: true });
    console.log('Tabelas criadas com sucesso!');

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_EMAIL_PASSWORD) {
      throw new Error('Variáveis ADMIN_EMAIL e ADMIN_EMAIL_PASSWORD não encontradas no .env');
    }

    // Criar admin
    await User.create({
      username: 'admin',
      email: process.env.ADMIN_EMAIL,
      password: await bcrypt.hash(process.env.ADMIN_EMAIL_PASSWORD, 10),
      isAdmin: true
    });
    console.log('Usuário admin criado!');
  } catch (error) {
    console.error('Erro na inicialização:', error);
  } finally {
    await sequelize.close();
  }
}

initializeDatabase();
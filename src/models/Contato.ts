import { Model, DataTypes, Sequelize } from 'sequelize';

interface ContatoAttributes {
  id?: number;
  nome: string;
  cpf: string;
  email: string;
  mensagem: string;
}

class Contato extends Model<ContatoAttributes> implements ContatoAttributes {
  public id!: number;
  public nome!: string;
  public cpf!: string;
  public email!: string;
  public mensagem!: string;
}

export default function initContatoModel(sequelize: Sequelize, dataTypes: typeof DataTypes) {
  Contato.init({
    nome: {
      type: dataTypes.STRING,
      allowNull: false
    },
    cpf: {
      type: dataTypes.STRING,
      allowNull: false
    },
    email: {
      type: dataTypes.STRING,
      allowNull: false
    },
    mensagem: {
      type: dataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'contatos'
  });

  return Contato;
}
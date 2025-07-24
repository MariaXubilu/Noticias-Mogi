import { Model, DataTypes, Sequelize } from 'sequelize';

interface CardAttributes {
  id?: number;
  titulo: string;
  imagem: string;
  conteudo: string; // JSON stringify de um array
  posicao: number;
  categoria?: string; // <-- ADICIONE ESTA LINHA
}

export default function initCardModel(sequelize: Sequelize, dataTypes: typeof DataTypes) {
  const Card = sequelize.define<Model<CardAttributes>>(
    'Card',
    {
      titulo: {
        type: dataTypes.STRING,
        allowNull: false
      },
      imagem: {
        type: dataTypes.STRING,
        allowNull: false,
        defaultValue: '/images/default.jpg'
      },
      conteudo: {
        type: dataTypes.TEXT,
        allowNull: false,
        get() {
          const rawValue = this.getDataValue('conteudo');
          return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value: string[]) {
          this.setDataValue('conteudo', JSON.stringify(value));
        }
      },
      posicao: {
        type: dataTypes.INTEGER,
        allowNull: false,
      
      },
      categoria: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      tableName: 'cards',
      timestamps: true
    }
  );

  return Card;
}
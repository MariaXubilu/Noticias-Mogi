import { Model, DataTypes, Sequelize, ModelStatic } from 'sequelize';

interface NoticiaAttributes {
  id?: number;
  titulo: string;
  subtitulo: string;
  imagem: string;
  conteudo: string;
  status?: 'pendente' | 'aprovada' | 'rejeitada';
  userId: number;
}

interface NoticiaModel extends ModelStatic<Model<NoticiaAttributes>> {
  associate?: (models: any) => void;
}

const initNoticiaModel = (sequelize: Sequelize, dataTypes: typeof DataTypes): NoticiaModel => {
  const Noticia = sequelize.define<Model<NoticiaAttributes>>(
    'Noticia',
    {
      titulo: dataTypes.STRING,
      subtitulo: dataTypes.STRING,
      imagem: dataTypes.STRING,
      conteudo: dataTypes.TEXT,
      status: {
        type: dataTypes.ENUM('pendente', 'aprovada', 'rejeitada'),
        defaultValue: 'pendente'
      },
      userId: dataTypes.INTEGER
    },
    {
      timestamps: true
    }
  ) as NoticiaModel;

  Noticia.associate = function(models: any) {
    Noticia.belongsTo(models.User, { 
      foreignKey: 'userId',
      as: 'User' 
    });
  };

  return Noticia;
};

export default initNoticiaModel;
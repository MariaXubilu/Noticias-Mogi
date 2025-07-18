import { Model, DataTypes, Sequelize, ModelStatic } from 'sequelize';

interface UserAttributes {
  id?: number;
  username: string;
  email: string;
  password: string;
  isAdmin?: boolean;
  foto?: string;
  biografia?: string;
}

interface UserModel extends ModelStatic<Model<UserAttributes>> {
  associate?: (models: any) => void;
}

const initUserModel = (sequelize: Sequelize, dataTypes: typeof DataTypes): UserModel => {
  const User = sequelize.define<Model<UserAttributes>>(
    'User',
    {
      username: {
        type: dataTypes.STRING,
        unique: true,
        allowNull: false
      },
      email: {
        type: dataTypes.STRING,
        unique: true,
        allowNull: false
      },
      password: {
        type: dataTypes.STRING,
        allowNull: false
      },
      isAdmin: {
        type: dataTypes.BOOLEAN,
        defaultValue: false
      },
      foto: dataTypes.STRING,
      biografia: dataTypes.TEXT
    },
    {
      tableName: 'users'
    }
  ) as UserModel;

  User.associate = function(models: any) {
    User.hasMany(models.Noticia, {
      foreignKey: 'userId',
      as: 'noticias'
    });
  };

  return User;
};

export default initUserModel;
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("user", {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            unique: true,
            autoIncrement: true,
            primaryKey: true
        },
        compte_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
            unique: false,
            references: {
                model: 'userscomptes',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        role_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            defaultValue: 0,
            unique: false,
            references: {
                model: 'roles',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        id_portefeuille: {
            type: DataTypes.ARRAY(DataTypes.BIGINT),
            allowNull: true
        },
        username: {
            type: DataTypes.STRING(150),
            unique: false,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(150),
            unique: true,
            isEmail: true,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        // roles: {
        //     type: DataTypes.JSON,
        //     allowNull: false
        // },
        refresh_token: {
            type: DataTypes.STRING(350),
            allowNull: true
        },
        membre_id: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
    }, { timestamps: true },)
    return User
}
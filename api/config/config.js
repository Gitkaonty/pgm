// Configuration sequelize-cli : lit les identifiants depuis le .env,
// exactement comme l'application (voir Models/index.js).
// => plus de duplication de secrets, plus de dérive avec config.json.
require('dotenv').config();

const common = {
    username: process.env.NODE_API_USER,
    password: process.env.NODE_API_PWD,
    database: process.env.NODE_API_DBNAME,
    host: process.env.NODE_API_URL,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: false,
};

module.exports = {
    development: common,
    test: common,
    production: common,
};

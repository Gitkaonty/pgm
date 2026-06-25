//importing modules
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

//Database connection with dialect of postgres specifying the database we are using
//port for my database is 5433
//database name is discover
const DB_ConnexionString = `postgresql://${process.env.NODE_API_USER}:${process.env.NODE_API_PWD}@${process.env.NODE_API_URL}:${process.env.DB_PORT}/${process.env.NODE_API_DBNAME}`;
const sequelize = new Sequelize(
    DB_ConnexionString,
    {
        dialect: "postgres",
        logging: false
    }

)
//const sequelize = new Sequelize(`postgresql://postgres:admin@localhost:5432/kaonty`, {dialect: "postgres"})

//checking if connection is done
sequelize.authenticate().then(() => {
    console.log(`Database connected to discover`)
}).catch((err) => {
    console.log(err)
})

const db = {}
db.Sequelize = Sequelize
db.sequelize = sequelize

//connecting to model
db.users = require('./userModel')(sequelize, DataTypes);
db.resetToken = require('./resetTokenModel')(sequelize, DataTypes);

//Gsetion rôle et permission
db.roles = require('./rolesModel')(sequelize, DataTypes);
db.permissions = require('./permissionsModel')(sequelize, DataTypes);
db.userPermission = require('./userPermissionsModel')(sequelize, DataTypes);
db.rolePermission = require('./rolePermissionsModel')(sequelize, DataTypes);

//gestion des membres
db.membres = require('./membreIdentiteModel')(sequelize, DataTypes);
db.membres_updates = require("./membreUpdateModel")(sequelize, Sequelize);

//paramétres - exercice
db.exercices = require('./exerciceModel')(sequelize, Sequelize);
db.grille_tarifaires = require('./grilleTarifaire')(sequelize, Sequelize);

//paramètres cotisation
db.appels = require("./appelModel")(sequelize, Sequelize);
db.ajustementappels = require("./ajustementappel")(sequelize, Sequelize);
db.autres_appels = require("./autreAppel")(sequelize, Sequelize);
db.paiements = require("./paiementModel")(sequelize, Sequelize);
db.emaillogs = require("./emailLog")(sequelize, Sequelize);
db.emaillogsappels = require("./emailLogAppel")(sequelize, Sequelize);
db.settings_ordre = require("./setting_ordreModel")(sequelize, Sequelize);
db.attestations = require("./attestationModel")(sequelize, Sequelize);

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

// Rôle et permission
db.roles.hasMany(db.rolePermission, { foreignKey: 'role_id', sourceKey: 'id' });
db.rolePermission.belongsTo(db.roles, { foreignKey: 'role_id', targetKey: 'id' });

db.permissions.hasMany(db.rolePermission, { foreignKey: 'permission_id', sourceKey: 'id' });
db.rolePermission.belongsTo(db.permissions, { foreignKey: 'permission_id', targetKey: 'id' });

db.users.hasMany(db.userPermission, { foreignKey: 'user_id', sourceKey: 'id' });
db.userPermission.belongsTo(db.users, { foreignKey: 'user_id', targetKey: 'id' });

db.permissions.hasMany(db.userPermission, { foreignKey: 'permission_id', sourceKey: 'id' });
db.userPermission.belongsTo(db.permissions, { foreignKey: 'permission_id', targetKey: 'id' });

db.roles.hasMany(db.users, { foreignKey: 'role_id', sourceKey: 'id' });
db.users.belongsTo(db.roles, { foreignKey: 'role_id', targetKey: 'id' });

// Définir la relation (Pour le JOIN)
db.membres.hasMany(db.membres_updates, { foreignKey: 'membre_id' });
db.membres_updates.belongsTo(db.membres, { foreignKey: 'membre_id', as: 'membre_info' });

// --- DÉFINITION DES RELATIONS ---
// Un exercice possède plusieurs tarifs
db.exercices.hasMany(db.grille_tarifaires, { foreignKey: 'exercice_id', as: 'tarifs' });
// Un tarif appartient à un seul exercice
db.grille_tarifaires.belongsTo(db.exercices, { foreignKey: 'exercice_id' });

// Optionnel : Définir les relations pour faciliter les futures requêtes
db.appels.belongsTo(db.exercices, { foreignKey: "exercice_id" });
db.appels.belongsTo(db.membres, { foreignKey: "membre_id" });

db.paiements.belongsTo(db.exercices, { foreignKey: "exercice_id" });

// L'appel appartient à un membre
db.appels.belongsTo(db.membres, { 
    foreignKey: 'membre_id', 
    as: 'membre' // Cet alias DOIT être le même que dans ton include
});

// Un membre peut avoir plusieurs appels (optionnel mais recommandé)
db.membres.hasMany(db.appels, { 
    foreignKey: 'membre_id', 
    as: 'appels' 
});

db.membres.hasMany(db.paiements, { foreignKey: 'membre_id', as: 'paiements' });
db.paiements.belongsTo(db.membres, { foreignKey: 'membre_id', as: 'membre' });

db.paiements.hasMany(db.emaillogs, { 
    foreignKey: "paiement_id", 
    as: "email_logs" 
});
db.emaillogs.belongsTo(db.paiements, { 
    foreignKey: "paiement_id", 
    as: "paiement" 
});

db.appels.hasMany(db.emaillogsappels, { 
    foreignKey: "appel_id", 
    as: "email_logsappels" 
});
db.emaillogsappels.belongsTo(db.appels, { 
    foreignKey: "appel_id", 
    as: "appels" 
});

//exporting the module
module.exports = db;
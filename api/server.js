const express = require('express');
const errorHandler = require('./Middlewares/errorHandler');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./Models');
const corsOptions = require('./config/corsOptions');
const verifyJWT = require('./Middlewares/verifyJWT');
const credentials = require('./Middlewares/credentials');

const pg = require('pg');
pg.types.setTypeParser(20, val => parseInt(val));

require('dotenv').config();

const PORT = process.env.NODE_API_PORT || 5100;

//Définition du moteur d'affichage
const app = express();
app.use(credentials);
app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(express.json());
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, '/public')));
app.use('/public', express.static(path.join(__dirname, '/public')));
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

//synchronizing the database and forcing it to false so we dont lose data (ito no ampiasaina ra toa ka executena ny DROP TABLE am sequelize)
//db.sequelize.sync({ force: true }).then(() => {
//console.log("db has been re sync")
//})

// Static folder
// app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

//synchronizing the database and forcing it to false so we dont lose data
db.sequelize.sync().then(() => {
    console.log("db has been re synchronized")
})

//----------------------------------------------------------------------------------------------------------------
// AUTHENTIFICATION
//----------------------------------------------------------------------------------------------------------------

//register
app.use('/api/register', require('./Routes/registerRoute'));
//Login
app.use('/api/', require('./Routes/authRoute'));
//refreshToken
app.use('/api/refreshToken', require('./Routes/refreshRoute'));
//logout
app.use('/api/logout', require('./Routes/logoutRoute'));
//change password
app.use('/api/auth', require('./Routes/changePassword'));



//placer la vérification pour les routes qui ne nécessite pas de vérification
// app.use(verifyJWT);


//routes pour l'authentification
//app.use('/', userRoutes);
//----------------------------------------------------------------------------------------------------------------
// INFOS OECFM
//----------------------------------------------------------------------------------------------------------------
app.use('/api/settings-ordre', require('./Routes/oecfm/oecfmRoute'));

//----------------------------------------------------------------------------------------------------------------
// MENU DASHBOARD
//----------------------------------------------------------------------------------------------------------------
app.use('/api/dashboard', require('./Routes/dashboard/dashboardRoute'));


//----------------------------------------------------------------------------------------------------------------
// MENU GESTION DES MEMBRES
//----------------------------------------------------------------------------------------------------------------
app.use('/api/membres', require('./Routes/gestionMembre/membreRoute'));
app.use('/api/membres-updates', require('./Routes/gestionMembre/membreUpdateRoute'));
app.use('/api/membres-situation', require('./Routes/gestionMembre/membreSituationRoute'));

//--------------------------------------------------------------------------------------------------------
//MENU PARAMETRES
//-------------------------------------------------------------------------------------------------------------
app.use('/api/exercices', require('./Routes/parametres/exerciceRoute'));
app.use('/api/grille-tarifaire', require('./Routes/parametres/grilleTarifaireRoute'));


//--------------------------------------------------------------------------------------------------------
//MENU COTISATION
//-------------------------------------------------------------------------------------------------------------
app.use("/api/cotisations", require('./Routes/cotisation/appelRoute'));
app.use('/api/paiements', require('./Routes/cotisation/paiementRoute'));
app.use('/api/compta', require('./Routes/cotisation/grandLivreRoute'));

//--------------------------------------------------------------------------------------------------------
//MENU ATTESTATION
//-------------------------------------------------------------------------------------------------------------
app.use("/api/attestations", require('./Routes/attestation/attestationRoute'));

/*app.all('*', (req,res) => {
    res.status(404);
    if(req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'));
    }else if (req.accepts('json')){
        res.json({error: '404 Not Found'});
    }else{
        res.type('txt').send('404 Not Found');
    }
});*/

//app.use(errorHandler);

app.get('/', function (req, res) {
    res.send('hello');
})

app.listen(PORT, () => {
    console.log(`listen on port ${PORT}`);
});

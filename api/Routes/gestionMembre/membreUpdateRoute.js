const express = require('express');
const multer = require('multer');
const router = express.Router();
const membreUpdateController = require('../../Controllers/gestionMembre/membreUpdateController');
const uploadExcelFile = multer({ dest: 'uploads/temp/' });
const verifyJWT = require('../../Middlewares/verifyJWT');

// Récupérer toutes les lignes
router.get('/', verifyJWT, membreUpdateController.getAllUpdates);

// Créer une nouvelle ligne (quand on clique sur Save après "Nouvelle mise à jour")
router.post('/', verifyJWT, membreUpdateController.createUpdate);

// Modifier une ligne existante
router.put('/:id', verifyJWT, membreUpdateController.updateRow);

// Supprimer une ligne
router.delete('/:id', verifyJWT, membreUpdateController.deleteUpdate);

//import fichier excel
router.post('/import-excel', verifyJWT, uploadExcelFile.single('file'), membreUpdateController.importExcelUpdate);

// Récupérer les dernières informations du membre
router.get('/last/:membre_id', verifyJWT, membreUpdateController.getMembreLastUpdate);

// Liste des dates historisées pour un membre donnéversion/${selectedMembre.id}/${date}
router.get('/dates/:membre_id', verifyJWT, membreUpdateController.getHistoriqueMembre);

// Récupération des informations du membre pour une date données
router.get('/version/:membre_id/:date_modif', verifyJWT, membreUpdateController.getMembreByDateInfos);

// Route pour la modification d'une version précise
router.put('/:membre_id', verifyJWT, membreUpdateController.updateHistoriqueMembre);

//récupérer l' historique
router.get('/historique/:id', membreUpdateController.getMembreHistorique);

module.exports = router;
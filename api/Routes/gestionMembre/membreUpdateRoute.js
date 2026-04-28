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

module.exports = router;
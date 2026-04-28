const express = require('express');
const router = express.Router();
const multer = require('multer');
const membreController = require('../../Controllers/gestionMembre/membreController');
const upload = require('../../Middlewares/upload');
const verifyJWT = require('../../Middlewares/verifyJWT');
const uploadExcelFile = multer({ dest: 'uploads/temp/' });

router.post('/', verifyJWT, upload.single('photo'), membreController.createMembre);
// GET : Liste de tous les membres
router.get('/', verifyJWT, membreController.getAllMembres);
router.get('/:id/active', verifyJWT, membreController.getAllMembresActive);
router.get('/activeLastUpdate', verifyJWT, membreController.getAllMembresActiveLastUpdate);

// POST : Ajouter un nouveau membre (Popup)
router.post('/', verifyJWT, membreController.createMembre);

// PUT : Modifier un membre (Inline Edit du tableau)
router.put('/:id', verifyJWT, membreController.updateMembre);

// DELETE : Supprimer un membre
router.delete('/:id', verifyJWT, membreController.deleteMembre);

// POST : Changer UNIQUEMENT la photo d'un membre existant
router.post('/:id/upload-photo', verifyJWT, upload.single('photo'), membreController.uploadPhoto);

//import fichier excel
router.post('/import-excel', verifyJWT, uploadExcelFile.single('file'), membreController.importExcel);

module.exports = router;
const express = require('express');
const router = express.Router();
const grilleController = require('../../Controllers/parametres/grilleTarifaireController');
const verifyJWT = require('../../Middlewares/verifyJWT');

router.get('/', verifyJWT, grilleController.getGrille);
router.post('/', verifyJWT, grilleController.createTarif);
router.delete('/:id', verifyJWT, grilleController.deleteTarif);
router.put('/:id', verifyJWT, grilleController.updateTarif);

module.exports = router;
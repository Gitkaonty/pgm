const express = require('express');
const router = express.Router();
const exerciceController = require('../../Controllers/parametres/exerciceController');
const verifyJWT = require('../../Middlewares/verifyJWT');

// Routes pour /api/exercices
router.get('/',verifyJWT, exerciceController.getExercices);
router.post('/', verifyJWT, exerciceController.createExercice);
router.delete('/:id', verifyJWT, exerciceController.deleteExercice);
router.put('/:id', verifyJWT, exerciceController.updateExercice);

module.exports = router;
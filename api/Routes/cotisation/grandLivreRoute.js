const express = require('express');
const router = express.Router();
const verifyJWT = require('../../Middlewares/verifyJWT'); // Optionnel si tu veux sécuriser
const grandLivreController = require('../../Controllers/cotisation/grandLivreController');

router.get('/grand-livre', verifyJWT, grandLivreController.getGrandLivre);

module.exports = router;
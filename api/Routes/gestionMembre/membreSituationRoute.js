const express = require('express');
const router = express.Router();
const membreSituationController = require('../../Controllers/gestionMembre/membreSituation');
const verifyJWT = require('../../Middlewares/verifyJWT');

// @route   GET /api/membres-situation
// @desc    Récupère la situation des membres à une date précise (jointure identité + dernière update)
// @access  Private
router.get('/', verifyJWT, membreSituationController.getMembreSituation);

module.exports = router;
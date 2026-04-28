const express = require('express');
const router = express.Router();
const verifyJWT = require('../../Middlewares/verifyJWT'); // Optionnel si tu veux sécuriser
const dashboardController = require("../../Controllers/dashboard/dashboard");

// Route pour récupérer toutes les stats du dashboard
router.get('/stats/:exerciceId',verifyJWT, dashboardController.getDashboardStats);

module.exports = router;
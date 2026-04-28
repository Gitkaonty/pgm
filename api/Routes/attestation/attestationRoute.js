const express = require('express');
const router = express.Router();
const verifyJWT = require('../../Middlewares/verifyJWT'); // Optionnel si tu veux sécuriser
const attestationController = require("../../Controllers/attestation/attestationController");

// Récupérer la liste des attestations
router.get("/", verifyJWT, attestationController.findAll);

// Créer une nouvelle demande
router.post("/create", verifyJWT, attestationController.create);

// Supprimer une demande (si aucune validation)
router.delete("/delete/:id", verifyJWT, attestationController.delete);

// Route pour valider (sécurisée par JWT)
router.patch("/validate/:id", verifyJWT, attestationController.validateStep);

module.exports = router;
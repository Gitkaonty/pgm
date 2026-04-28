const express = require('express');
const router = express.Router();
const verifyJWT = require('../../Middlewares/verifyJWT'); // Optionnel si tu veux sécuriser
const paiementController = require("../../Controllers/cotisation/paiementController");

// Créer un nouveau paiement
router.post("/", verifyJWT, paiementController.createPaiement);

// Récupérer tous les paiements (filtrés par exercice via query param)
// Exemple: /api/paiements?exerciceId=1
router.get("/", verifyJWT, paiementController.findAllPaiements);

router.put("/:id/validate", verifyJWT, paiementController.validate);
router.put("/:id/unvalidate", verifyJWT, paiementController.unvalidate);
router.delete("/:id", verifyJWT, paiementController.delete);

//récupérer l'historique de mail pour un ticket sélectionné
router.get('/:paiementId/email-logs', verifyJWT, paiementController.getEmailLogs);

//Route pour envoyer le mail d'un paiement spécifique
router.post('/:id/send-email', verifyJWT, paiementController.sendPaiementEmail);

// Route pour l'envoi groupé
router.post('/send-email-bulk', verifyJWT, paiementController.sendBulkEmails);

//récupération infos membre (total appel, anouveau et autre appel)
router.get('/synthese-reglement', verifyJWT, paiementController.getSyntheseReglement);

module.exports = router;
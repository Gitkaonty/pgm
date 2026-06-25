const express = require('express');
const router = express.Router();
const verifyJWT = require('../../Middlewares/verifyJWT'); // Optionnel si tu veux sécuriser
const appelController = require("../../Controllers/cotisation/appelController");

// Récupérer les appels existants pour un exercice (Affichage auto)
router.get("/exercice/:exerciceId", verifyJWT, appelController.getAppelsByExercice);

// Route pour le calcul temporaire (affichage front)
router.post("/generate-appels", verifyJWT, appelController.generateAppelsBrouillon);
router.post('/generate-appels-manuels', verifyJWT, appelController.generateAppelsManuels);

// Valider une ligne ou un groupe de lignes
router.post("/valider-appels", verifyJWT, appelController.validerAppels);

//supprimer un appel
router.delete('/:id', verifyJWT, appelController.deleteAppel);

// --- SECTION : AJUSTEMENTS (Tab 2) ---
// Récupérer les ajustements
router.get('/ajustements/:exerciceId', verifyJWT, appelController.getAjustementsByExercice);
// Générer les ajustements forfaitaires
router.post('/generate-ajustements', verifyJWT, appelController.generateAjustements);

// Validation global des appels
router.post('/valider-appels', verifyJWT, appelController.validerPlusieurs);

// validation d'une ligne appel
router.patch('/status/:id', verifyJWT, appelController.updateStatus);

//supprimer un ajustement
router.delete('/ajustements/:id', verifyJWT, appelController.deleteAjustement);

// Validation global des appels
router.post('/valider-ajustements', verifyJWT, appelController.validerPlusieursAjustements);

// --- SECTION : AUTRES APPEL (Tab 3) ---
// Récupérer les autres appel
router.get('/autres-appels/:exerciceId', verifyJWT, appelController.getAutresAppelsByExercice);
// Générer les autres appel forfaitaires
router.post('/generate-autres-appels', verifyJWT, appelController.generateAutresAppels);
// Validation groupée des autres appel
router.post('/valider-autres-appels', verifyJWT, appelController.validerPlusieursAutresAppels);
// Supprimer un autre appel
router.delete('/autres-appels/:id', verifyJWT, appelController.deleteAutreAppel);

//récupération infos membre (total appel, anouveau et autre appel)
router.get('/synthese-appel', verifyJWT, appelController.getSyntheseReglementAppel);

//récupérer l'historique de mail pour un ticket sélectionné
router.get('/:appelsId/email-logs', verifyJWT, appelController.getEmailLogs);

//Route pour envoyer le mail d'un paiement spécifique
router.post('/:id/send-email', verifyJWT, appelController.sendPaiementEmail);

// Route pour l'envoi groupé
router.post('/send-email-bulk', verifyJWT, appelController.sendBulkEmails);

module.exports = router;
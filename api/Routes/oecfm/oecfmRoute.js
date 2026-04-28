const express = require('express');
const router = express.Router();
const verifyJWT = require('../../Middlewares/verifyJWT'); // Optionnel si tu veux sécuriser
const settings = require("../../Controllers/oecfm/oecfmController");
const upload = require('../../Middlewares/upload_Sign'); // Importe le middleware multer qu'on a créé

router.get("/", verifyJWT, settings.getSettings);
router.put("/update", verifyJWT, settings.updateSettings);

// AJOUT : La route pour l'upload des signatures
// Le paramètre :poste doit correspondre aux clés envoyées par le front (President, Secretaire, Tresorier)
router.post("/upload/:poste", verifyJWT, upload.single('signature'), settings.uploadSignature);

module.exports = router;
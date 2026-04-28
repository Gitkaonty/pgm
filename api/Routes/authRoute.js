const express = require('express');
const router = express.Router();
const authController = require('../Controllers/authController');

router.post('/',authController.handleLogin);

router.get('/roles',authController.getAllRoles);

router.get('/users',authController.getAllUsers);

//router.post('/create-account', [verifyToken, isAdmin], authController.createAccount);
router.post('/create-account', authController.createAccount);

// Modification d'un role pour l'utilisateur
router.put('/users/:userId/role', authController.updateUserRole);

// Supprimer un compte utilisateur
router.delete('/users/:userId', authController.deleteUser);

// Supprimer un compte utilisateur
router.post('/create-accounts-bulk', authController.createAccountsBulk);

module.exports = router;
const express = require('express');
const router = express.Router();
const changePasswordController = require('../Controllers/changePasswordController');

router.post('/change-password',changePasswordController.changePassword);

module.exports = router;
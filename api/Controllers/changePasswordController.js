const bcrypt = require("bcrypt");
const db = require("../Models");
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { Op } = require('sequelize');

const User = db.users;
const Userscomptes = db.userscomptes;
const roles = db.roles;
const userPermission = db.userPermission;
const permissions = db.permissions;

exports.changePassword = async (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;

    try {
        const user = await User.findByPk(userId); // ou findOne

        // Vérifier si l'ancien mot de passe est correct
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "L'ancien mot de passe est incorrect" });
        }

        // Hasher le nouveau mot de passe
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        await user.save();
        res.status(200).json({ message: "Mot de passe modifié" });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};
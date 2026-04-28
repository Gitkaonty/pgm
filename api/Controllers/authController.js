const bcrypt = require("bcrypt");
const db = require("../Models");
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { Op } = require('sequelize');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('sequelize');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const path = require('path');
const User = db.users;
const Userscomptes = db.userscomptes;
const roles = db.roles;
const userPermission = db.userPermission;
const permissions = db.permissions;
const membre = db.membres;

const rolePermissionMiddleware = require('../Middlewares/RolePermission/rolePermission');
const createUserPermission = rolePermissionMiddleware.createUserPermission;

// User.belongsTo(Userscomptes, { foreignKey: 'compte_id' });
// Userscomptes.hasMany(User, { foreignKey: 'compte_id' });

const generatePassword = (length = 12) => {
    // On définit les caractères autorisés pour éviter les symboles trop complexes 
    // qui pourraient poser problème selon l'encodage
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
    let password = "";
    const bytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
        password += charset[bytes[i] % charset.length];
    }
    return password;
};

const sendAccessEmail = async (emailDestinataire, username, rawPassword) => {
    const appUrl = process.env.APP_URL || "https://www.pgm-oecfm.mg"; // Exemple d'URL

    // 2. Transporteur
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT == 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        tls: { rejectUnauthorized: false }
    });

    await transporter.sendMail({
        from: `"Administration OECFM" <${process.env.SMTP_USER}>`,
        to: emailDestinataire,
        subject: "Vos identifiants de connexion - Plateforme Portail Gestion de l'Ordre",
        attachments: [
            {
                filename: 'logo500.png',
                path: path.join(__dirname, '../../api/public/logo/logo500.png'),
                cid: 'logo_oecfm' // L'identifiant est bien là
            }
        ],
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                <div style="text-align: center; border-bottom: 2px solid #497a48; padding-bottom: 15px; margin-bottom: 20px;">
                    <div style="margin-bottom: 10px;">
                        <img src="cid:logo_oecfm" alt="OECFM" style="max-height: 40px; width: auto;" />
                    </div>
                    <h2 style="color: #497a48; margin: 0;">Espace Membre OECFM</h2>
                </div>
                
                <p>Bonjour <strong>${username}</strong>,</p>
                
                <p>Un compte utilisateur a été créé pour vous sur la plateforme <strong>Portail de Gestion des Membres (PGM)</strong>. Vous pouvez désormais accéder à votre espace personnel en utilisant les identifiants ci-dessous :</p>
                
                <div style="background-color: #f8fafc; border-radius: 6px; padding: 15px; margin: 20px 0; border-left: 4px solid #497a48;">
                    <p style="margin: 5px 0;"><strong>Identifiant (Email) :</strong> ${emailDestinataire}</p>
                    <p style="margin: 5px 0;"><strong>Mot de passe temporaire :</strong> <code style="background: #e2e8f0; padding: 2px 4px; borderRadius: 4px;">${rawPassword}</code></p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${appUrl}" style="background-color: #497a48; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Accéder à l'application
                    </a>
                </div>

                <p style="font-size: 0.9rem; color: #64748b;">
                    <em>Note : Pour des raisons de sécurité, nous vous recommandons de modifier votre mot de passe dès votre première connexion.</em>
                </p>

                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                
                <p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">
                    Cordialement,<br/>
                    <strong>L'équipe administrative de l'OECFM</strong>
                </p>
            </div>
        `
    });
};

const handleLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!password || !email) return res.status(400).json({ 'message': 'L\'email et mot de passe sont obligatoires.' });

    const foundUser = await User.findOne({
        where: { email: email },
        // include: [{ model: Userscomptes, attributes: ['nom'] }]
    });

    if (!foundUser) return res.status(401).json({ 'message': 'Compte non trouvé.' });

    const id_role = foundUser.role_id;
    const foundRole = await roles.findByPk(id_role);

    if (!foundRole) return res.status(401).json({ 'message': 'Rôle non trouvé.' });

    const match = await bcrypt.compare(password, foundUser.password);
    if (match) {
        //const userRoles = Object.values(foundUser.roles).filter(Boolean);
        const role = foundRole.code;

        let permissionUser = await userPermission.findAll({
            where: {
                user_id: foundUser.id,
                allowed: true
            }
        })

        if (permissionUser.length === 0) {
            const userPermissionCreated = await createUserPermission(foundUser.id, id_role);
            permissionUser = userPermissionCreated.filter(val => val.allowed === true);
        }

        const permissionId = permissionUser.map(val => Number(val.permission_id));

        const permissionData = await permissions.findAll({
            where: {
                id: { [Op.in]: permissionId }
            },
            attributes: ['code']
        })

        const permissioDataName = permissionData.map(val => val.code);

        const accessToken = jwt.sign(
            {
                'UserInfo':
                {
                    'username': foundUser.username,
                    // 'roles': userRoles,
                    'roles': role,
                    'permission': permissioDataName,
                    'compteId': foundUser.compte_id,
                    'compte': foundUser?.userscompte?.nom,
                    'userId': foundUser.id,
                    'portefeuille': foundUser.id_portefeuille
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15s' }
        );

        const refreshToken = jwt.sign(
            { 'username': foundUser.username },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        );

        await User.update({ refresh_token: refreshToken }, { where: { id: foundUser.id } });

        res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'Lax', maxAge: 24 * 60 * 60 * 1000 });
        res.json({ accessToken });
    } else {
        res.sendStatus(401);
    }
}

const getAllRoles = async (req, res) => {
    try {
        const rolesData = await roles.findAll({ order: [['id', 'ASC']] });
        return res.status(200).json(rolesData);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erreur serveur', state: false, error: error.message });
    }
}

const getAllUsers = async (req, res) => {
    try {
    const usersWithMembers = await db.sequelize.query(
        `SELECT 
            u.id, 
            u.email, 
            u.role_id,
            u.username,
            m.nom, 
            m.prenom, 
            m.matricule,
            m.login_id
         FROM users u
         LEFT JOIN membresidentites m ON u.id = m.login_id
         ORDER BY u.id ASC`,
        {
            type: db.sequelize.QueryTypes.SELECT
        }
    );

    return res.status(200).json(usersWithMembers);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            message: 'Erreur serveur', 
            state: false, 
            error: error.message 
        });
    }
}

const createAccount = async (req, res) => {
    const { email, password, role_id, username, member_id } = req.body;
    const t = await db.sequelize.transaction();

    try {
        // 1. Vérifier si l'email existe déjà
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }

        // 2. Hasher le mot de passe
        const rawPassword = generatePassword(12);
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // 3. Créer l'utilisateur
        const newUser = await User.create({
            email,
            username,
            password: hashedPassword,
            role_id: role_id,
            membre_id : member_id || 0,
        }, { transaction: t });

        // 4. Si lié à un membre, mettre à jour la table membre
        if (member_id) {
            await membre.update(
                { login_id: newUser.id },
                { where: { id: member_id }, transaction: t }
            );
        }

        await t.commit();

        sendAccessEmail(email, username, rawPassword);


        return res.status(201).json({ 
            message: "Compte créé avec succès", 
            userId: newUser.id 
        });

    } catch (error) {
        await t.rollback();
        console.error(error);
        return res.status(500).json({ message: "Erreur lors de la création du compte." });
    }
};

const updateUserRole = async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body; // C'est le newRole envoyé par le front

    try {
        // 1. Vérifier si l'utilisateur existe
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        // 2. Mise à jour des deux champs pour la cohérence
        // Rappel : ton modèle exige un JSON pour 'roles' et un BIGINT pour 'role_id'
        await User.update(
            {
            role_id: Number(role),
            //roles: [Number(role)] // On met à jour le JSON avec le nouvel ID
            },
            {
                where: { id: userId } // LA CLAUSE MANQUANTE
            }
        );

        return res.status(200).json({ 
            message: `Rôle mis à jour avec succès pour ${user.username}` 
        });

    } catch (error) {
        console.error("Erreur updateRole:", error);
        return res.status(500).json({ 
            message: "Erreur lors de la mise à jour du rôle.",
            error: error.message 
        });
    }
};

const deleteUser = async (req, res) => {
    const { userId } = req.params;
    const t = await db.sequelize.transaction();

    try {
        // 1. Vérifier si l'utilisateur existe
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

        // 2. Si l'utilisateur est lié à un membre, on détache le lien dans MembreIdentite
        // Optionnel : selon ta logique métier, tu peux aussi laisser le login_id orphelin
        await membre.update(
            { login_id: null }, 
            { where: { login_id: userId }, transaction: t }
        );

        // 3. Suppression du compte
        await User.destroy({ where: { id: userId }, transaction: t });

        await t.commit();
        res.status(200).json({ message: "Utilisateur supprimé" });

    } catch (error) {
        if (t) await t.rollback();
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la suppression" });
    }
};

const createAccountsBulk = async (req, res) => {
    const { users } = req.body;
    const report = {
        success: [],
        errors: []
    };

    for (const userData of users) {
        try {
            // 1. Vérifier si l'email existe déjà
            const existingUser = await User.findOne({ where: { email: userData.email } });
            
            if (existingUser) {
                report.errors.push({
                    email: userData.email,
                    username: userData.username,
                    reason: "Email déjà utilisé"
                });
                continue; // On passe au suivant sans bloquer
            }

            // 2. Création (On utilise une mini-transaction par utilisateur)
            await db.sequelize.transaction(async (t) => {
                const rawPassword = generatePassword(12);
                const hashedPassword = await bcrypt.hash(rawPassword, 10);
                
                const newUser = await User.create({
                    email: userData.email,
                    username: userData.username,
                    password: hashedPassword,
                    role_id: userData.role_id,
                    //roles: [userData.role_id],
                    membre_id: userData.member_id,
                    compte_id: 0
                }, { transaction: t });

                await membre.update(
                    { login_id: newUser.id },
                    { where: { id: userData.member_id }, transaction: t }
                );
                sendAccessEmail(userData.email, userData.username, rawPassword);
                report.success.push({ email: userData.email, username: userData.username });
            });

        } catch (err) {
            report.errors.push({
                email: userData.email,
                username: userData.username,
                reason: "Erreur technique : " + err.message
            });
        }
    }

    res.status(207).json({
        message: "Traitement terminé",
        summary: {
            total: users.length,
            successCount: report.success.length,
            errorCount: report.errors.length
        },
        details: report
    });
};

module.exports = { handleLogin, getAllRoles, getAllUsers, createAccount, updateUserRole, deleteUser, createAccountsBulk };
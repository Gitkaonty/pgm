const db = require("../Models");
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { Op } = require('sequelize');

const User = db.users;
const Userscomptes = db.userscomptes;
const roles = db.roles;
const userPermission = db.userPermission;
const permissions = db.permissions;

const rolePermissionMiddleware = require('../Middlewares/RolePermission/rolePermission');
const createUserPermission = rolePermissionMiddleware.createUserPermission;

// User.belongsTo(Userscomptes, { foreignKey: 'compte_id' });
// Userscomptes.hasMany(User, { foreignKey: 'compte_id' });

const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.status(401).json({ message: 'TOken invalide' });

    const refreshToken = cookies.jwt;

    const foundUser = await User.findOne({
        where: { refresh_token: refreshToken },
        // include: [{ model: Userscomptes, attributes: ['nom'] }]
    });

    if (!foundUser) return res.sendStatus(403);

    const id_role = foundUser.role_id;
    const foundRole = await roles.findByPk(id_role);

    if (!foundRole) return res.status(401).json({ 'message': 'Rôle non trouvé.' });

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if (err) {
                await User.update(
                    { refresh_token: null },
                    { where: { id: foundUser.id } }
                );
                return res.sendStatus(403);
            }

            if (foundUser.username !== decoded.username)
                return res.sendStatus(403);

            // const roles = Object.values(foundUser.roles).filter(Boolean);
            // const role = foundRole.code;

            const id_role = foundUser.role_id;
            const foundRole = await roles.findByPk(id_role);
            const role = foundRole.code;
        
            if (!role) return res.status(401).json({ 'message': 'Rôle non trouvé.' });

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
                    'UserInfo': {
                        'username': decoded.username,
                        // 'roles': roles,
                        'roles': role,
                        'permission': permissioDataName,
                        'compteId': foundUser.compte_id,
                        'compte': foundUser?.userscompte?.nom,
                        'userId': foundUser.id,
                        'portefeuille': foundUser.id_portefeuille
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '1d' }
            );

            return res.json({ accessToken });
        }
    );
}

module.exports = { handleRefreshToken };

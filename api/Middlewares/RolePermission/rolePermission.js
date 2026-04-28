const db = require('../../Models');
const userPermission = db.userPermission;
const rolePermission = db.rolePermission;

// const createUserPermission = async (user_id, role_id) => {
//     const testIfUserPermissionExist = await userPermission.findAll({
//         where: { user_id }
//     });

//     if (testIfUserPermissionExist.length > 0) return;

//     const rolePermissionData = await rolePermission.findAll({
//         where: { role_id }
//     });

//     const data = [];

//     for (const rp of rolePermissionData) {
//         const dataCreated = await userPermission.create({
//             user_id,
//             permission_id: rp.permission_id,
//             allowed: rp.allowed
//         });
//         data.push(dataCreated);
//     }

//     return data;
// };

const createUserPermission = async (user_id, role_id) => {
    try {
        return await db.sequelize.transaction(async (t) => {
            const existingCount = await db.sequelize.query(`
                SELECT COUNT(*) AS count
                FROM userpermissions
                WHERE user_id = :user_id
      `, {
                replacements: { user_id },
                type: db.sequelize.QueryTypes.SELECT,
                transaction: t
            });

            if (existingCount[0].count > 0) return [];

            await db.sequelize.query(`
                INSERT INTO userpermissions (user_id, permission_id, allowed, "createdAt", "updatedAt")
                SELECT :user_id, rp.permission_id, rp.allowed, NOW(), NOW()
                FROM rolepermissions rp
                WHERE rp.role_id = :role_id
      `, {
                replacements: { user_id, role_id },
                transaction: t
            });

            const createdPermissions = await db.sequelize.query(`
                SELECT *
                FROM userpermissions
                WHERE user_id = :user_id
      `, {
                replacements: { user_id },
                type: db.sequelize.QueryTypes.SELECT,
                transaction: t
            });

            return createdPermissions;
        });
    } catch (error) {
        console.error("Erreur createUserPermission:", error);
        throw error;
    }
};

module.exports = {
    createUserPermission
}
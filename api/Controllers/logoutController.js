const db = require("../Models");
require('dotenv').config();

const User = db.users;
//const dossierPasswordAccess = db.dossierPasswordAccess;

const handleLogout = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204);
    const refreshToken = cookies.jwt;

    //is refreshToken in db?
    const foundUser = await User.findOne({ where: { refresh_token: refreshToken } });
    if (!foundUser) {
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'Lax' });
        return res.sendStatus(204);
    }

    const user_id = Number(foundUser.id);

    //delete refreshToken in db
    await User.update(
        { refresh_token: null },
        {
            where: { refresh_token: refreshToken }
        }

    );

    // await dossierPasswordAccess.destroy({
    //     where: {
    //         user_id
    //     }
    // })

    res.clearCookie('jwt', { httpOnly: true, sameSite: 'Lax' });
    res.sendStatus(204);
}

module.exports = { handleLogout };
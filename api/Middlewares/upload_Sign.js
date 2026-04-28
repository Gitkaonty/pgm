const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/signatures/'); // Assure-toi que ce dossier existe
    },
    filename: (req, file, cb) => {
        const poste = req.params.poste || 'unknown';
        const uniqueName = `${poste}-${Date.now()}.png`;
        const extension = path.extname(file.originalname);
        // Exemple : President-1713782400000.png
        req.finalFileName = uniqueName;
        //cb(null, `${poste}-${Date.now()}${extension}`);
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });
module.exports = upload;
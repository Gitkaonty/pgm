const db = require('../../Models'); // Vérifie que le chemin vers ton dossier models est bon
const Exercice = db.exercices;

// 1. Récupérer tous les exercices
const getExercices = async (req, res) => {
    try {
        const exercices = await Exercice.findAll({
            order: [['date_debut', 'DESC']] // Les plus récents en premier
        });
        return res.status(200).json(exercices);
    } catch (error) {
        console.error("Erreur GET Exercices:", error);
        return res.status(500).json({ message: "Erreur lors de la récupération", error: error.message });
    }
};

// 2. Créer un exercice
const createExercice = async (req, res) => {
    try {
        const { libelle, date_debut, date_fin } = req.body;
        
        // Création via Sequelize
        const nouveau = await Exercice.create({
            libelle,
            date_debut,
            date_fin,
            cloture: false // Par défaut ouvert
        });

        return res.status(201).json(nouveau);
    } catch (error) {
        console.error("Erreur POST Exercice:", error);
        return res.status(500).json({ message: "Erreur lors de la création", error: error.message });
    }
};

// 3. Supprimer un exercice
const deleteExercice = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Exercice.destroy({
            where: { id: id }
        });

        if (deleted) {
            return res.status(200).json({ message: "Exercice supprimé avec succès" });
        }
        return res.status(404).json({ message: "Exercice non trouvé" });
    } catch (error) {
        console.error("Erreur DELETE Exercice:", error);
        return res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
    }
};

const updateExercice = async (req, res) => {
    try {
        const { id } = req.params;
        const [updated] = await Exercice.update(req.body, {
            where: { id: id }
        });

        if (updated) {
            const updatedExercice = await Exercice.findByPk(id);
            return res.status(200).json(updatedExercice);
        }
        throw new Error('Exercice non trouvé');
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// Exportation des fonctions
module.exports = {
    updateExercice,
    getExercices,
    createExercice,
    deleteExercice
};
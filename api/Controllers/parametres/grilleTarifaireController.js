const db = require('../../Models');
const Grille = db.grille_tarifaires;

const getGrille = async (req, res) => {
    try {
        // Extraction du paramètre ?exercice_id=2
        const { exercice_id } = req.query; 

        // Construction dynamique de la clause WHERE
        const condition = exercice_id ? { exercice_id: exercice_id } : {};

        const data = await Grille.findAll({
            where: condition,
            order: [['section', 'ASC'], ['montant', 'ASC']]
        });

        res.status(200).json(data);
    } catch (error) {
        console.error("Erreur backend grille:", error);
        res.status(500).json({ message: "Erreur lors de la récupération de la grille" });
    }
};

const createTarif = async (req, res) => {
    try {
        const nouveau = await Grille.create(req.body);
        res.status(201).json(nouveau);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteTarif = async (req, res) => {
    try {
        await Grille.destroy({ where: { id: req.params.id } });
        res.status(200).json({ message: "Tarif supprimé" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Modifier un tarif existant (PUT)
const updateTarif = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [updated] = await Grille.update(req.body, {
            where: { id: id }
        });

        if (updated) {
            const updatedRow = await Grille.findByPk(id);
            return res.status(200).json(updatedRow);
        }
        
        throw new Error('Tarif non trouvé');
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getGrille, createTarif, deleteTarif, updateTarif };
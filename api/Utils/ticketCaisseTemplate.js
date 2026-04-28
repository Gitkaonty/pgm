const React = require('react');
const { Document, Page, View, Text, Image } = require('@react-pdf/renderer');

const TicketCaisseTemplate = ({ row, exercice }) => {
    
    // Formatage des nombres sans virgule (Style Kaonti)
    const fNum = (val) => {
        if (!val) return "0";
        return Math.round(parseFloat(val))
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };

    // Formatage de l'exercice (ex: 2020 - 2020)
    const formatExerciceStr = () => {
        // Dans le back, exercice est déjà l'objet correspondant ou un tableau
        const ex = Array.isArray(exercice) ? exercice.find(e => e.id === row.exercice_id) : exercice;
        if (!ex) return "";
        const start = new Date(ex.date_debut).getFullYear();
        const end = new Date(ex.date_fin).getFullYear();
        return `${start} - ${end}`;
    };

    // Conversion Chiffre -> Lettres
    const nombreEnLettres = (valeurEntrante) => {
        const nb = Math.abs(parseInt(valeurEntrante, 10));
        const unites = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
        const dizaines = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];
        
        if (isNaN(nb)) return "";
        if (nb === 0) return "zéro";

        const conv = (n) => {
            if (n < 10) return unites[n];
            if (n < 20) {
                const exceptions = {10:"dix", 11:"onze", 12:"douze", 13:"treize", 14:"quatorze", 15:"quinze", 16:"seize"};
                return exceptions[n] || "dix-" + unites[n-10];
            }
            if (n < 100) {
                const d = Math.floor(n / 10);
                const r = n % 10;
                if (d === 7) return "soixante-" + (r === 1 ? "et-onze" : conv(10 + r));
                if (d === 9) return "quatre-vingt-" + conv(10 + r);
                const liaison = (r === 1 && d < 8) ? " et " : "-";
                return dizaines[d] + (r === 0 ? "" : liaison + unites[r]);
            }
            if (n < 1000) {
                const c = Math.floor(n / 100);
                const r = n % 100;
                const centStr = c === 1 ? "cent" : unites[c] + " cent";
                return (centStr + " " + conv(r)).trim();
            }
            if (n < 1000000) {
                const m = Math.floor(n / 1000);
                const r = n % 1000;
                const milleStr = m === 1 ? "mille" : conv(m) + " mille";
                return (milleStr + " " + conv(r)).trim();
            }
            if (n < 1000000000) {
                const mil = Math.floor(n / 1000000);
                const r = n % 1000000;
                const millionStr = mil === 1 ? "un million" : conv(mil) + " millions";
                return (millionStr + " " + conv(r)).trim();
            }
            return n.toString();
        };

        return conv(nb).trim().toLowerCase().replace(/\s+/g, ' ');
    };

    return React.createElement(Document, {},
        React.createElement(Page, { size: "A4", style: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' } },
            
            React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 } },
                React.createElement(View, { style: { width: 100, height: 100 } },
                    React.createElement(Image, { 
                        style: { width: 100, height: 100, objectFit: 'contain' },
                        src: "public/logo/logo500.png" 
                    })
                ),
                React.createElement(View, { style: { flex: 1, alignItems: 'flex-end' } },
                    React.createElement(Text, { style: { fontSize: 8, textAlign: 'right' } }, "Régie par l'Ordonnance modifiée n°92-047 du 05/11/1992"),
                    React.createElement(Text, { style: { fontSize: 8, textAlign: 'right' } }, "Immeuble Santa, Lot IV - 3 ème étage - Antanimena"),
                    React.createElement(Text, { style: { fontSize: 8, textAlign: 'right' } }, "8737 - (101) ANTANANARIVO - Tel : +261 20 22 632 23 - E-mail : oecfm@moov.mg"),
                    React.createElement(View, { style: { marginTop: 15 } },
                        React.createElement(Text, { style: { fontSize: 8 } }, 
                            React.createElement(Text, { style: { textDecoration: 'underline' } }, "Membre de :"),
                            " - L'international Federation of Accountants (IFAC)"
                        ),
                        React.createElement(Text, { style: { fontSize: 8, marginLeft: 50, marginTop: 4 } }, "- Pan African Federation of Accountants (PAFA)"),
                        React.createElement(Text, { style: { fontSize: 8, marginLeft: 50, marginTop: 4 } }, "- La Fédération Internationale Des Experts comptables Francophones (FIDEF)")
                    )
                )
            ),

            React.createElement(View, { style: { borderBottomColor: '#EEE', borderBottomWidth: 1, marginVertical: 10 } }),

            // Titre
            React.createElement(Text, { style: { textAlign: 'center', fontSize: 14, fontWeight: 'bold', marginVertical: 15 } },
                `TICKET DE CAISSE ${row.valide ? "" : "(NON VALIDÉ)"}`
            ),

            // Infos Client
            React.createElement(View, { style: { marginBottom: 20, lineHeight: 0.85 } },
                React.createElement(Text, {}, `Date d'édition : ${new Date(row.createdAt || row.created_at).toLocaleDateString('fr-FR')}`),
                React.createElement(Text, {}, `Date de paiement : ${new Date(row.date_paiement).toLocaleDateString('fr-FR')}`),
                React.createElement(Text, {}, `Exercice : ${formatExerciceStr()}`),
                React.createElement(Text, {}, `Référence : ${row.num_ticket || ""}`),
                React.createElement(Text, { style: { fontWeight: 'bold', marginTop: 5 } }, `Nom : ${row.nom || row.membre?.nom || ""}`),
                React.createElement(Text, { style: { fontWeight: 'bold' } }, `Prénom (s) : ${row.prenom || row.membre?.prenom || ""}`)
            ),

            // Tableau des règlements
            React.createElement(View, { style: { border: '0.5pt solid #000' } },
                // Header Tableau
                React.createElement(View, { style: { flexDirection: 'row', backgroundColor: '#F0FDF4', padding: 5, borderBottom: '0.5pt solid #000' } },
                    React.createElement(Text, { style: { flex: 2, fontWeight: 'bold' } }, "Détail du règlement"),
                    React.createElement(Text, { style: { flex: 1, textAlign: 'right', fontWeight: 'bold' } }, "Paiement")
                ),
                // Lignes
                [
                    { label: "Sur solde A nouveau", val: row.anouveau || 0 },
                    { label: `Sur cotisation de l'exercice ${formatExerciceStr()}`, val: row.cotis_annee || 0 },
                    { label: `Sur autre appel ${formatExerciceStr()}`, val: row.autre_appel || 0 }
                ].map((item, i) => 
                    React.createElement(View, { key: i, style: { flexDirection: 'row', borderBottom: '0.5pt solid #EEE', padding: 5 } },
                        React.createElement(Text, { style: { flex: 2 } }, item.label),
                        React.createElement(Text, { style: { flex: 1, textAlign: 'right' } }, `${fNum(item.val)} Ar`)
                    )
                ),
                // Total
                React.createElement(View, { style: { flexDirection: 'row', padding: 5, backgroundColor: '#F8FAFC', fontWeight: 'bold' } },
                    React.createElement(Text, { style: { flex: 2 } }, "Total payé"),
                    React.createElement(Text, { style: { flex: 1, textAlign: 'right' } }, `${fNum(row.total)} Ar`)
                )
            ),

            // Arrêté à la somme
            React.createElement(Text, { style: { marginTop: 20, fontStyle: 'italic' } },
                `Arrêté à la somme de : ${nombreEnLettres(row.total)} Ariary`
            ),

            // Signatures
            React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 60 } },
                React.createElement(Text, { style: { textDecoration: 'none' } }, "Le Trésorier"),
                React.createElement(Text, { style: { textDecoration: 'none' } }, "Le Caissier"),
                React.createElement(Text, { style: { textDecoration: 'none' } }, "Le Remettant")
            )
        )
    );
};

module.exports = TicketCaisseTemplate;
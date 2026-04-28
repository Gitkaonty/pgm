const React = require('react');
const { Document, Page, View, Text, Image } = require('@react-pdf/renderer');

const TicketNoteTemplate = ({ row, exercice, synthese, telephone }) => {
    // 1. Fonctions de formatage identiques au front
    const formatExercice = () => {
        const ex = exercice.find(e => e.id === row.exercice_id);
        if (!ex) return "";
        const start = new Date(ex.date_debut).getFullYear();
        const end = new Date(ex.date_fin).getFullYear();
        return `${start} - ${end}`;
    };

    const formatExerciceLong = (liaison) => {
        const ex = exercice.find(e => e.id === row.exercice_id);
        if (!ex) return "";
        return `${new Date(ex.date_debut).toLocaleDateString('fr-FR')} ${liaison} ${new Date(ex.date_fin).toLocaleDateString('fr-FR')}`;
    };

    const fNum = (val) => {
        if (val === undefined || val === null) return "0";
        
        // 1. On utilise Math.round() ou parseInt() pour supprimer les décimales
        // 2. On formate avec les espaces pour les milliers
        return Math.round(parseFloat(val))
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };

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
            if (n < 1000000000000) {
                const mrd = Math.floor(n / 1000000000);
                const r = n % 1000000000;
                const milliardStr = mrd === 1 ? "un milliard" : conv(mrd) + " milliards";
                return (milliardStr + " " + conv(r)).trim();
            }
            return n.toString();
        };
        return conv(nb).trim().toLowerCase().replace(/\s+/g, ' ');
    };

    // 2. Construction du PDF avec React.createElement
    return React.createElement(Document, {},
        React.createElement(Page, { size: "A4", style: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' } },
            
            // Header complet avec Logo et Mentions Internationales
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

            // Trait de séparation
            React.createElement(View, { style: { borderBottomColor: '#e2e8f0', borderBottomWidth: 1, marginVertical: 10, marginHorizontal: 20 } }),

            React.createElement(Text, { style: { textAlign: 'left', marginVertical: 5 } }, 
                `Antananarivo, le ${new Date(row.date_appel).toLocaleDateString('fr-FR')}`
            ),

            React.createElement(Text, { style: { textAlign: 'center', fontSize: 14, fontWeight: 'bold', marginVertical: 10 } },
                `NOTE ${row.num_note || ""} ${row.valide ? "" : "(Non validée)"}`
            ),

            // Bloc Adressé à
            React.createElement(View, { style: { marginBottom: 10, lineHeight: 0.85 } },
                React.createElement(Text, {}, "Adressé à: "),
                React.createElement(Text, { style: { fontWeight: 'bold' } }, `${row.membre.nom} ${row.membre.prenom}`),
                React.createElement(Text, {}, row.section || ""),
                React.createElement(Text, {}, `${row.titre || ""} - Promotion : ${row.membre.promotion || ""}`),
                React.createElement(Text, {}, `Téléphone : ${telephone || ""}`)
            ),

            // Tableau I : Note Actuelle
            React.createElement(View, { style: { border: '1pt solid #000' } },
                React.createElement(View, { style: { flexDirection: 'row', backgroundColor: '#f0fdf4', fontWeight: 'bold', borderBottom: '1pt solid #000', padding: 5 } },
                    React.createElement(Text, { style: { flex: 2 } }, "Intitulé"),
                    React.createElement(Text, { style: { flex: 1, textAlign: 'right' } }, "Montant")
                ),
                React.createElement(View, { style: { flexDirection: 'row', borderBottom: '0.5pt solid #eee', padding: 5 } },
                    React.createElement(Text, { style: { flex: 2 } }, `Cotisation pour l'exercice ${formatExercice()}`),
                    React.createElement(Text, { style: { flex: 1, textAlign: 'right' } }, `${fNum(row.appelnet)} Ar`)
                ),
                React.createElement(View, { style: { flexDirection: 'row', borderBottom: '0.5pt solid #eee', padding: 5 } },
                    React.createElement(Text, { style: { flex: 2 } }, `Période de facturation du ${formatExerciceLong('au')}`),
                    React.createElement(Text, { style: { flex: 1, textAlign: 'right' } }, "")
                ),
                React.createElement(View, { style: { flexDirection: 'row', padding: 5, fontWeight: 'bold', backgroundColor: '#f8fafc' } },
                    React.createElement(Text, { style: { flex: 2 } }, "Montant total de la Note"),
                    React.createElement(Text, { style: { flex: 1, textAlign: 'right' } }, `${fNum(row.appelnet)} Ar`)
                )
            ),

            React.createElement(Text, { style: { marginTop: 5, fontStyle: 'italic', fontSize: 9 } },
                `Le montant total de la note est arrêté à ${nombreEnLettres(row.appelnet)} Ariary`
            ),

            // État du compte
            React.createElement(Text, { style: { marginTop: 20, textDecoration: 'underline', marginBottom: 5 } }, "Etat du compte:"),
            React.createElement(View, { style: { border: '1pt solid #000' } },
                React.createElement(View, { style: { flexDirection: 'row', backgroundColor: '#f0fdf4', fontWeight: 'bold', borderBottom: '1pt solid #000', padding: 5 } },
                    React.createElement(Text, { style: { flex: 2 } }, "Intitulé"),
                    React.createElement(Text, { style: { flex: 1, textAlign: 'right' } }, "Montant")
                ),
                React.createElement(View, { style: { flexDirection: 'row', borderBottom: '0.5pt solid #eee', padding: 5 } },
                    React.createElement(Text, { style: { flex: 2 } }, "Cotisation restant due sur les exercices précédents:"),
                    React.createElement(Text, { style: { flex: 1, textAlign: 'right' } }, `${fNum(synthese.anouveau)} Ar`)
                ),
                React.createElement(View, { style: { flexDirection: 'row', borderBottom: '0.5pt solid #eee', padding: 5 } },
                    React.createElement(Text, { style: { flex: 2 } }, `Paiement reçu entre le du ${formatExerciceLong('et le')}`),
                    React.createElement(Text, { style: { flex: 1, textAlign: 'right' } }, `${fNum(synthese.recuAnnee)} Ar`)
                ),
                React.createElement(View, { style: { flexDirection: 'row', borderBottom: '0.5pt solid #eee', padding: 5 } },
                    React.createElement(Text, { style: { flex: 2 } }, `Cotisation pour l'exercice ${formatExercice()}`),
                    React.createElement(Text, { style: { flex: 1, textAlign: 'right' } }, `${fNum(row.appelnet)} Ar`)
                ),
                React.createElement(View, { style: { flexDirection: 'row', padding: 5, fontWeight: 'bold', backgroundColor: '#f8fafc' } },
                    React.createElement(Text, { style: { flex: 2 } }, "Total à payer"),
                    React.createElement(Text, { style: { flex: 1, textAlign: 'right' } }, `${fNum(synthese.totalAPayer)} Ar`)
                )
            ),

            React.createElement(Text, { style: { marginTop: 5, fontStyle: 'italic', fontSize: 9 } },
                `Arrêté à la somme de : ${nombreEnLettres(synthese.totalAPayer)} Ariary`
            ),

            // Informations Bancaires
            React.createElement(View, { style: { marginTop: 20, lineHeight: 1.2 } },
                React.createElement(Text, { style: { textDecoration: 'underline' } }, "Informations bancaires:"),
                React.createElement(Text, { style: { fontSize: 8, marginLeft: 20 } }, "- 33- OECFM - n°00005 00002 209618 50200 72 - CABNI - Antsahavola - 101 - Antananarivo"),
                React.createElement(Text, { style: { fontSize: 8, marginLeft: 20 } }, "- 34- OECFM - n°00012 01200 61005213011 13 - BGFI MADAGASCAR - Antsahavola - 101 - Antananarivo")
            ),

            // Signatures
            React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 } },
                React.createElement(Text, {}, "Le Trésorier"),
                React.createElement(Text, {}, "Le Vice-Président Administratif")
            )
        )
    );
};

module.exports = TicketNoteTemplate;
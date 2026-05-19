import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
import { URL } from '../../../config/axios';

const fNum = (val) => {
    if (val === undefined || val === null) return "0";

    // 1. On convertit en entier pour enlever les virgules si besoin
    // 2. On utilise une regex pour ajouter un espace tous les 3 chiffres
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

//export PDF du ticket de caisse
const TicketCaissePDF = ({ row, exercice, selectedEx, orderInfo }) => {
    const data = Array.isArray(orderInfo) ? orderInfo[0] : orderInfo;
    const url = URL;

    // On utilise l'accession sécurisée
    const nom_tresorier = data?.noms_signataires?.["Trésorier"] || "Nom inconnu";
    const nom_vice_president_admin = data?.noms_signataires?.["Vice-Président Administratif"] || "Nom inconnu";
    const nom_caissier = data?.noms_signataires?.["Caissier"] || "Nom inconnu";

    // Fonction pour extraire "AAAA - AAAA"
    const formatExercice = () => {
        const ex = exercice.find(e => e.id === selectedEx);
        if (!ex) return "";
        const start = new Date(ex.date_debut).getFullYear();
        const end = new Date(ex.date_fin).getFullYear();
        return `${start} - ${end}`;
    }

    const nombreEnLettres = (valeurEntrante) => {
        const nb = Math.abs(parseInt(valeurEntrante, 10));

        const unites = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
        const dizaines = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];

        if (isNaN(nb)) return "";
        if (nb === 0) return "zéro";

        const conv = (n) => {
            if (n < 10) return unites[n];

            if (n < 20) {
                const exceptions = { 10: "dix", 11: "onze", 12: "douze", 13: "treize", 14: "quatorze", 15: "quinze", 16: "seize" };
                return exceptions[n] || "dix-" + unites[n - 10];
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

            // NOUVEAU : Gestion des Millions
            if (n < 1000000000) {
                const mil = Math.floor(n / 1000000);
                const r = n % 1000000;
                const millionStr = mil === 1 ? "un million" : conv(mil) + " millions";
                return (millionStr + " " + conv(r)).trim();
            }

            // NOUVEAU : Gestion des Milliards
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

    return (
        <Document>
            <Page size="A4" style={{ padding: 40, fontSize: 10, fontFamily: 'Helvetica' }}>
                {/* Header avec Logo (Placeholder) */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    {/* LOGO à gauche */}
                    <View style={{ width: 100, height: 100, backgroundColor: 'transparent', borderRadius: 30 }} >
                        <Image
                            style={{ width: 100, height: 100, marginRight: 10, objectFit: 'contain' }}
                            src="/logo500.png" // Assure-toi que le nom du fichier est exact
                        />
                    </View>

                    {/* BLOC TEXTE à droite */}
                    <View style={{ marginLeft: 0, marginBottom: 0 }}>
                        <View style={{
                            flex: 1,               // Prend tout l'espace restant pour permettre l'alignement
                            alignItems: 'flex-end' // Aligne le conteneur lui-même vers la droite
                        }}>
                            <Text style={{ fontSize: 8, textAlign: 'right' }}>
                                Régie par l'Ordonnance modifiée n°92-047 du 05/11/1992
                            </Text>
                            <Text style={{ fontSize: 8, textAlign: 'right' }}>
                                {data.adresse}
                            </Text>
                            <Text style={{ fontSize: 8, textAlign: 'right' }}>
                                8737 - ({data.boite_postale}) ANTANANARIVO - Tel : {data.telephone} - E-mail :{" "}
                                <Text style={{ color: "blue", textDecorationLine: "underline" }}>
                                    {data.email}
                                </Text>
                            </Text>
                        </View>

                        <View style={{ marginLeft: 0, marginBottom: 0 }}>
                            {/* Première ligne */}
                            <Text style={{ fontSize: 8 }}>
                                <Text style={{ textDecoration: 'underline' }}>Membre de :</Text>
                                {" "} - L'international Federation of Accountants (IFAC)
                            </Text>

                            <View style={{ marginLeft: 50, marginBottom: 10 }}>
                                {/* Deuxième ligne décalée vers le bas avec un petit marginTop */}
                                <Text style={{ fontSize: 8, marginTop: 4 }}>
                                    - Pan African Federation of Accountants (PAFA)
                                </Text>
                                <Text style={{ fontSize: 8, marginTop: 4 }}>
                                    - La Fédération Internationale Des Experts comptables Francophones (FIDEF)
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={{
                    borderBottomColor: '#e2e8f0', // Couleur grise légère (style Pennylane)
                    borderBottomWidth: 1,         // Épaisseur du trait
                    marginTop: 10,                // Espace au-dessus
                    marginBottom: 0,             // Espace en-dessous
                    marginLeft: 20,              // Pour l'aligner avec vos textes décalés
                    marginRight: 20               // Pour ne pas qu'il touche le bord droit
                }} />

                <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginVertical: 20, textDecoration: 'none' }}>
                    Ticket de caisse {row.valide ? "" : "(Non validé)"}
                </Text>

                <View style={{ marginBottom: 20, lineHeight: 1 }}>
                    <Text>Date d'édition : {new Date(row.created_at).toLocaleDateString('fr-FR')}</Text>
                    <Text>Date de paiement : {new Date(row.date).toLocaleDateString('fr-FR')}</Text>
                    <Text>Exercice : {formatExercice(exercice)}</Text>
                    <Text>Référence : {row.num_ticket}</Text>
                    <Text>Nom : {row.nom}</Text>
                    <Text>Prénom (s) : {row.prenom}</Text>
                </View>

                {/* Tableau des règlements */}
                <View style={{ border: '1pt solid #000' }}>
                    <View style={{ flexDirection: 'row', backgroundColor: '#f0fdf4', fontWeight: 'bold', borderBottom: '1pt solid #000', padding: 5 }}>
                        <Text style={{ flex: 2 }}>Détail du règlement</Text>
                        <Text style={{ flex: 1, textAlign: 'right' }}>Paiement</Text>
                    </View>
                    {[
                        { label: "Sur solde A nouveau", val: row.anouveau ? row.anouveau : 0 },
                        { label: `Sur cotisation de l'exercice ${formatExercice(exercice)}`, val: row.cotis_annee ? row.cotis_annee : 0 },
                        { label: `Sur autre appel ${formatExercice(exercice)}`, val: row.autre_appel ? row.autre_appel : 0 }
                    ].map((item, i) => (
                        <View key={i} style={{ flexDirection: 'row', borderBottom: '0.5pt solid #eee', padding: 5 }}>
                            <Text style={{ flex: 2 }}>{item.label}</Text>
                            <Text style={{ flex: 1, textAlign: 'right' }}>{fNum(item.val)} Ar</Text>
                        </View>
                    ))}
                    <View style={{ flexDirection: 'row', padding: 5, fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                        <Text style={{ flex: 2 }}>Total payé</Text>
                        <Text style={{ flex: 1, textAlign: 'right' }}>{fNum(row.total)} Ar</Text>
                    </View>
                </View>

                <Text style={{ marginTop: 20, fontStyle: 'italic' }}>
                    Arrêté à la somme de : {nombreEnLettres(row.total)} Ariary
                </Text>

                {/* Signatures */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 50 }}>
                    <View style={{ width: 220, flexDirection: 'column', justifyContent: 'space-between', marginTop: 0, alignContent: 'center', alignItems: 'center' }}>
                        <Text style={{ textAlign: 'center' }}>Le Vice-Président</Text>
                        <Text style={{ textAlign: 'center' }}>Administratif</Text>
                        {row.valide &&
                            <Image
                                style={{ width: 100, height: 100, objectFit: 'contain' }}
                                src={`${url}/uploads/signatures/${data.sig_vice_president_admin}`}
                            />
                        }
                        <Text style={{ marginTop: row.valide ? 0 : 50, textAlign: 'center' }}>{nom_vice_president_admin}</Text>
                    </View>

                    <View style={{ width: 220, flexDirection: 'column', justifyContent: 'space-between', marginTop: 0, alignContent: 'center', alignItems: 'center' }}>
                        <Text style={{ textAlign: 'center' }}>Le Trésorier</Text>
                        {row.valide &&
                            <Image
                                style={{ width: 100, height: 100, objectFit: 'contain' }}
                                src={`${url}/uploads/signatures/${data.sig_tresorier}`}
                            />
                        }
                        <Text style={{ marginTop: row.valide ? 0 : 50, textAlign: 'center' }}>{nom_tresorier}</Text>
                    </View>

                    <View style={{ width: 220, flexDirection: 'column', justifyContent: 'space-between', marginTop: 0, alignContent: 'center', alignItems: 'center' }}>
                        <Text style={{ textAlign: 'center' }}>Le Caissier</Text>
                        {row.valide &&
                            <Image
                                style={{ width: 100, height: 100, objectFit: 'contain' }}
                                src={`${url}/uploads/signatures/${data.sig_caissier}`}
                            />
                        }
                        <Text style={{ marginTop: row.valide ? 0 : 50, textAlign: 'center' }}>{nom_caissier}</Text>
                    </View>

                    <Text style={{ width: 220, textAlign: 'center' }}>Le Remettant</Text>
                </View>
            </Page>
        </Document>
    );
}

export default TicketCaissePDF;
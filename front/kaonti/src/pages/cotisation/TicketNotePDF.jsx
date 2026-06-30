import React from 'react';
import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
import { URL } from '../../../config/axios';

// On passe 'anouveau', 'recuAnnee' et 'totalAPayer' directement en props
// On passe aussi 'selectedEx' et 'orderInfo' pour éviter les variables globales
const TicketNotePDF = ({ row, exercice, selectedEx, orderInfo, synthese, qrDataUrl }) => {

    const data = Array.isArray(orderInfo) ? orderInfo[0] : orderInfo;
    const url = URL; // À adapter ou passer en prop

    const nom_tresorier = data?.noms_signataires?.["Trésorier"] || "Nom inconnu";
    const nom_vice_president_admin = data?.noms_signataires?.["Vice-Président Administratif"] || "Nom inconnu";

    // Fonctions de formatage déplacées à l'intérieur mais sans dépendances d'état
    const formatExercice = () => {
        const ex = exercice.find(e => e.id === selectedEx);
        if (!ex) return "";
        const start = new Date(ex.date_debut).getFullYear();
        const end = new Date(ex.date_fin).getFullYear();
        return `${start} - ${end}`;
    };

    const formatExerciceLong = (liaison) => {
        const ex = exercice.find(e => e.id === selectedEx);
        if (!ex) return "";
        return `${new Date(ex.date_debut).toLocaleDateString('fr-FR')} ${liaison} ${new Date(ex.date_fin).toLocaleDateString('fr-FR')}`;
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
            return n.toString();
        };
        return conv(nb).trim().toLowerCase().replace(/\s+/g, ' ');
    };

    const fNum = (val) => {
        if (val === undefined || val === null) return "0";
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };

    return (
        <Document>
            <Page size="A4" style={{ padding: 40, fontSize: 10, fontFamily: 'Helvetica' }}>
                {/* QR code → site de l'ordre (placé dans l'espace vide en haut à droite) */}
                {qrDataUrl && (
                    <View style={{ position: 'absolute', top: 165, right: 45, alignItems: 'center' }}>
                        <Image src={qrDataUrl} style={{ width: 58, height: 58 }} />
                        <Text style={{ fontSize: 7, color: '#64748b', marginTop: 2 }}>
                            Scannez-moi
                        </Text>
                    </View>
                )}

                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <View style={{ width: 100, height: 100 }}>
                        <Image style={{ width: 100, height: 100, objectFit: 'contain' }} src="/logo500.png" />
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

                <View style={{ borderBottomColor: '#e2e8f0', borderBottomWidth: 1, marginVertical: 10 }} />

                <Text style={{ textAlign: 'left', fontSize: 10, marginVertical: 5, textDecoration: 'none' }}>
                    Antananarivo, le {new Date(row.date_appel).toLocaleDateString('fr-FR')}
                </Text>

                <Text style={{ textAlign: 'center', fontSize: 14, fontWeight: 'bold', marginVertical: 10 }}>
                    NOTE {row.num_note} {row.valide ? "" : "(Non validée)"}
                </Text>

                <View style={{ marginBottom: 10, lineHeight: 0.85 }}>
                    <Text>Adressé à: </Text>
                    <Text>{row.nom} {row.prenom}</Text>
                    <Text>{row.section}</Text>
                    <Text>{row.titre} - Promotion : {row.promotion}</Text>
                    <Text>Téléphone : {row.telephone}</Text>
                </View>

                {/* Tableau des règlements */}
                <View style={{ border: '1pt solid #000' }}>
                    <View style={{ flexDirection: 'row', backgroundColor: '#f0fdf4', fontWeight: 'bold', borderBottom: '1pt solid #000', padding: 5 }}>
                        <Text style={{ flex: 2 }}>Intitulé</Text>
                        <Text style={{ flex: 1, textAlign: 'right' }}>Montant</Text>
                    </View>
                    {[
                        { label: `Cotisation pour l'exercice ${formatExercice(exercice)}`, val: row.appelnet ? row.appelnet : 0 },
                        { label: `Période de facturation du ${formatExerciceLong('au')}`, val: null },
                    ].map((item, i) => (
                        <View key={i} style={{ flexDirection: 'row', borderBottom: '0.5pt solid #eee', padding: 5 }}>
                            <Text style={{ flex: 2 }}>{item.label}</Text>
                            <Text style={{ flex: 1, textAlign: 'right' }}>{item.val === null ? "" : fNum(item.val)} {item.val === null ? "" : " Ar"}</Text>
                        </View>
                    ))}
                    <View style={{ flexDirection: 'row', padding: 5, fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                        <Text style={{ flex: 2 }}>Montant total de la Note</Text>
                        <Text style={{ flex: 1, textAlign: 'right' }}>{fNum(row.appelnet ? row.appelnet : 0)} Ar</Text>
                    </View>
                </View>

                <Text style={{ marginTop: 5, fontStyle: 'italic' }}>
                    Le montant total de la note est arrêté à {nombreEnLettres(row.appelnet ? row.appelnet : 0)} Ariary
                </Text>

                <Text style={{ marginTop: 20, textDecoration: 'underline' }}>
                    Etat du compte:
                </Text>

                {/* Tableau II : État de compte utilisant les props 'synthese' */}
                {/* <View style={{ border: '1pt solid #000', marginTop: 5 }}>
                    <View style={{ flexDirection: 'row', backgroundColor: '#f0fdf4', padding: 5, fontWeight: 'bold' }}>
                        <Text style={{ flex: 2 }}>Intitulé</Text>
                        <Text style={{ flex: 1, textAlign: 'right' }}>Montant</Text>
                    </View>
                    <View style={{ flexDirection: 'row', borderBottom: '0.5pt solid #eee', padding: 5 }}>
                        <Text style={{ flex: 2 }}>Solde antérieur (Arriérés)</Text>
                        <Text style={{ flex: 1, textAlign: 'right' }}>{fNum(synthese.anouveau)} Ar</Text>
                    </View>
                    <View style={{ flexDirection: 'row', borderBottom: '0.5pt solid #eee', padding: 5 }}>
                        <Text style={{ flex: 2 }}>Paiements reçus sur l'exercice</Text>
                        <Text style={{ flex: 1, textAlign: 'right' }}>{fNum(synthese.recuAnnee)} Ar</Text>
                    </View>
                    <View style={{ flexDirection: 'row', padding: 5, backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                        <Text style={{ flex: 2 }}>TOTAL À PAYER</Text>
                        <Text style={{ flex: 1, textAlign: 'right' }}>{fNum(synthese.totalAPayer)} Ar</Text>
                    </View>
                </View>

                <Text style={{ marginTop: 5, fontStyle: 'italic' }}>
                    Arrêté à la somme de : {nombreEnLettres(synthese.totalAPayer)} Ariary
                </Text> */}

                {/* Tableau des règlements II */}
                <View style={{ border: '1pt solid #000' }}>
                    <View style={{ flexDirection: 'row', backgroundColor: '#f0fdf4', fontWeight: 'bold', borderBottom: '1pt solid #000', padding: 5 }}>
                        <Text style={{ flex: 2 }}>Intitulé</Text>
                        <Text style={{ flex: 1, textAlign: 'right' }}>Montant</Text>
                    </View>
                    {[
                        { label: `Cotisation restant due sur les exercices précédents: `, val: synthese.anouveau },
                        { label: `Paiement reçu entre le du ${formatExerciceLong('et le')}`, val: synthese.recuAnnee },
                        { label: `Cotisation pour l'exercice ${formatExercice(exercice)}`, val: row.appelnet ? row.appelnet : 0 }
                    ].map((item, i) => (
                        <View key={i} style={{ flexDirection: 'row', borderBottom: '0.5pt solid #eee', padding: 5 }}>
                            <Text style={{ flex: 2 }}>{item.label}</Text>
                            <Text style={{ flex: 1, textAlign: 'right' }}>{fNum(item.val)} Ar</Text>
                        </View>
                    ))}
                    <View style={{ flexDirection: 'row', padding: 5, fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                        <Text style={{ flex: 2 }}>Total à payer</Text>
                        <Text style={{ flex: 1, textAlign: 'right' }}>{fNum(synthese.totalAPayer)} Ar</Text>
                    </View>
                </View>

                <Text style={{ marginTop: 5, fontStyle: 'italic' }}>
                    Arrêté à la somme de : {nombreEnLettres(synthese.totalAPayer ? synthese.totalAPayer : 0)} Ariary
                </Text>

                <View style={{ marginTop: 20, lineHeight: 1 }}>
                    <Text style={{ textDecoration: 'underline' }}>Informations bancaires:</Text>
                    <Text style={{ fontSize: 9, marginLeft: 20 }}>- 33- OECFM - n°00005 00002 209618 50200 72 - CABNI - Antsahavola - 101 - Antananarivo</Text>
                    <Text style={{ fontSize: 9, marginLeft: 20 }}>- 34- OECFM - n°00012 01200 61005213011 13 - BGFI MADAGASCAR - Antsahavola - 101 - Antananarivo</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 }}>

                    {/* Trésorier */}
                    <View style={{ alignItems: 'center', width: 250 }}>
                        <Text
                            style={{
                                marginBottom: '-20px'
                            }}
                        >
                            Le Trésorier
                        </Text>
                        {/* Signature entre le titre et le nom (dans le flux, rien n'est caché) */}
                        {row.valide && data.sig_tresorier ? (
                            <Image
                                style={{
                                    width: 200,
                                    // height: 80,
                                    // objectFit: 'contain',
                                    // marginVertical: 4
                                }}
                                src={`${url}/uploads/signatures/${data.sig_tresorier}`}
                            />
                        ) : (
                            <View
                            // style={{ height: 50 }}
                            />
                        )}
                        <Text
                            style={{
                                marginTop: '-50px'
                            }}
                        >
                            {nom_tresorier}
                        </Text>
                    </View>

                    {/* Vice-Président */}
                    <View style={{ alignItems: 'center', width: 250 }}>
                        <Text
                            style={{
                                marginBottom: '-17px'
                            }}
                        >Le Vice-Président</Text>
                        {/* Signature entre le titre et le nom (dans le flux, rien n'est caché) */}
                        {row.valide && data.sig_vice_president_admin ? (
                            <Image
                                style={{
                                    width: 200,
                                    // height: 80,
                                    objectFit: 'contain',
                                    // marginVertical: 4
                                }}
                                src={`${url}/uploads/signatures/${data.sig_vice_president_admin}`}
                            />
                        ) : (
                            <View
                            // style={{
                            //     height: 50
                            // }}
                            />
                        )}
                        <Text
                            style={{
                                marginTop: '-50px'
                            }}
                        >{nom_vice_president_admin}</Text>
                    </View>

                </View>

            </Page>
        </Document>
    );
};

export default TicketNotePDF;
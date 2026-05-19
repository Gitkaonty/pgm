import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';
import { URL } from '../../../config/axios';

const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#334155' },
    // EN-TETE
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, borderBottomWidth: 2, borderBottomColor: '#1b4332', pb: 10 },
    logoSection: { flexDirection: 'row', alignItems: 'center' },
    logoPlaceholder: { width: 50, height: 50, backgroundColor: '#f1f5f9', marginRight: 10 }, // À remplacer par src={logoOECFM}
    headerText: { flexDirection: 'column' },
    oecfmTitle: { fontSize: 18, fontWeight: 'bold', color: '#1b4332', letterSpacing: 1 },
    oecfmSubtitle: { fontSize: 9, color: '#64748b', marginTop: 2 },
    logoImage: {
        width: 50,
        height: 50,
        marginRight: 10,
        // On peut ajouter objectFit pour éviter les déformations
        objectFit: 'contain'
    },

    // INFOS DOCUMENT
    docInfo: { marginBottom: 20, marginLeft: 150, textAlign: 'right' },
    title: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', color: '#1e293b' },
    exercice: { fontSize: 9, color: '#475569', marginTop: 4 },

    // TABLEAU
    table: { display: "table", width: "100%", borderStyle: "solid", marginTop: 10 },
    tableRow: { flexDirection: "row", borderBottomColor: '#e2e8f0', borderBottomWidth: 0.5, minHeight: 22, alignItems: 'center' },
    tableColHeader: { backgroundColor: '#1b4332', color: '#ffffff', fontWeight: 'bold', borderBottomWidth: 0, minHeight: 25, },
    tableCell: { padding: 4, fontSize: 7 },

    // Alignements et Largeurs
    col1: { width: '8%' }, // Matr
    col2: { width: '32%' }, // Nom/Prenom
    col3: { width: '15%' }, // Section
    col4: { width: '15%', textAlign: 'right' }, // Montant
    col5: { width: '15%', textAlign: 'right' }, // Ajust
    col6: { width: '15%', textAlign: 'right', fontWeight: 'bold' }, // Net

    colMatricule: { width: '6%' },
    colNom: { width: '22%' },
    colSection: { width: '10%' },
    colStatut: { width: '10%' },
    colTitre: { width: '8%' },
    colAssocies: { width: '8%' },
    colRegime: { width: '8%' },
    colMontant: { width: '9%', textAlign: 'right' },
    colAjust: { width: '9%', textAlign: 'right' },
    colNet: { width: '10%', textAlign: 'right', fontWeight: 'bold' },

    // Footer spécifique : on cumule les largeurs des 7 premières colonnes (6+22+10+10+8+8+8 = 72%)
    footerLabel: { width: '72%', fontWeight: 'bold', textAlign: 'right', color: '#1b4332', paddingRight: 10 },
    footerContainer: {
        position: 'absolute',
        bottom: 25,
        left: 40,
        right: 40,
    },
    footerLine: {
        borderTopWidth: 0.5,
        borderTopColor: '#cbd5e1', // Ligne gris clair très fine
        marginBottom: 5,
    },
    footerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerBranch: {
        fontSize: 8,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    pageNumber: {
        fontSize: 9,
        color: '#64748b',
        fontWeight: 'bold',
    },
});

const ExportAppelPDF = ({ data, tabValue, exerciceLabel }) => {
    // Calcul des totaux
    const totalCotisation = data.reduce((sum, r) => sum + (Number(tabValue === 0 ? r.montant : r.montant_ajustement) || 0), 0);
    const totalAjustement = data.reduce((sum, r) => sum + (Number(r.total_ajustement) || 0), 0);
    const totalNet = data.reduce((sum, r) => sum + (Number(r.appelnet) || 0), 0);

    const fNum = (val) => {
        return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 })
            .format(val || 0)
            .replace(/\s/g, ' ')
            .replace(/,/g, ' ');
    };

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Header Institutionnel */}
                <View fixed style={styles.headerContainer}>
                    <View style={styles.logoSection}>
                        <Image
                            style={styles.logoImage}
                            src="/logo500.png" // Assure-toi que le nom du fichier est exact
                        />
                        <View style={styles.headerText}>
                            <Text style={styles.oecfmTitle}>OECFM</Text>
                            <Text style={styles.oecfmSubtitle}>Ordre des Experts Comptables et Financiers de Madagascar</Text>
                        </View>
                    </View>
                    <View style={styles.docInfo}>
                        <Text style={styles.title}>{tabValue === 0 ? "Tableau des Appels de Cotisations" : "Récapitulatif des Ajustements"}</Text>
                        <Text style={styles.exercice}>Période : {exerciceLabel}</Text>
                        <Text style={styles.exercice}>Date d'édition : {new Date().toLocaleDateString('fr-FR')}</Text>
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    {/* Header du tableau - Nouvel Ordre */}
                    <View fixed style={[styles.tableRow, styles.tableColHeader]}>
                        <Text style={[styles.tableCell, styles.colMatricule]}>Matr.</Text>
                        <Text style={[styles.tableCell, styles.colNom]}>NOM ET PRÉNOMS</Text>
                        <Text style={[styles.tableCell, styles.colSection]}>SECTION</Text>
                        <Text style={[styles.tableCell, styles.colStatut]}>STATUT</Text>
                        <Text style={[styles.tableCell, styles.colTitre]}>TITRE</Text>
                        <Text style={[styles.tableCell, styles.colAssocies]}>ASSOC.</Text>
                        <Text style={[styles.tableCell, styles.colRegime]}>RÉGIME</Text>
                        <Text style={[styles.tableCell, styles.colMontant]}>{tabValue === 0 ? "COTIS." : "MONTANT"}</Text>
                        {tabValue === 0 && (
                            <>
                                <Text style={[styles.tableCell, styles.colAjust]}>AJUST.</Text>
                                <Text style={[styles.tableCell, styles.colNet]}>APPEL NET</Text>
                            </>
                        )}
                    </View>

                    <Text>{" "}</Text>

                    {/* Lignes de données */}
                    {data.map((row, i) => (
                        <View key={i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }]}>
                            <Text style={[styles.tableCell, styles.colMatricule]}>{row.matricule}</Text>
                            <Text style={[styles.tableCell, styles.colNom]}>{row.nom} {row.prenom}</Text>
                            <Text style={[styles.tableCell, styles.colSection]}>{row.section}</Text>
                            <Text style={[styles.tableCell, styles.colStatut]}>{row.statut || "-"}</Text>
                            <Text style={[styles.tableCell, styles.colTitre]}>{row.titre || "-"}</Text>
                            <Text style={[styles.tableCell, styles.colAssocies]}>{row.associes || "-"}</Text>
                            {/* Logique Régime : 0=Normal, 1=Réduit */}
                            <Text style={[styles.tableCell, styles.colRegime]}>
                                {row.regime === "1" || row.regime === 1 ? "Réduit" : row.regime === "0" || row.regime === 0 ? "Normal" : "-"}
                            </Text>
                            <Text style={[styles.tableCell, styles.colMontant]}>{fNum(tabValue === 0 ? row.montant : row.montant_ajustement)}</Text>
                            {tabValue === 0 && (
                                <>
                                    <Text style={[styles.tableCell, styles.colAjust]}>{fNum(row.total_ajustement)}</Text>
                                    <Text style={[styles.tableCell, styles.colNet]}>{fNum(row.appelnet)}</Text>
                                </>
                            )}
                        </View>
                    ))}

                    {/* FOOTER TOTALISATION */}
                    <View style={[styles.tableRow, { backgroundColor: '#dcfce7', borderBottomWidth: 0, marginTop: 2 }]}>
                        <Text style={[styles.tableCell, styles.footerLabel]}>TOTAL GÉNÉRAL :</Text>
                        <Text style={[styles.tableCell, styles.colMontant, { fontWeight: 'bold', color: '#1b4332' }]}>{fNum(totalCotisation)}</Text>
                        {tabValue === 0 && (
                            <>
                                <Text style={[styles.tableCell, styles.colAjust, { fontWeight: 'bold', color: '#1b4332' }]}>{fNum(totalAjustement)}</Text>
                                <Text style={[styles.tableCell, styles.colNet, { fontWeight: 'bold', color: '#1b4332' }]}>{fNum(totalNet)}</Text>
                            </>
                        )}
                    </View>
                </View>

                {/* BAS DE PAGE : NUMÉROTATION */}
                <View fixed style={styles.footerContainer}>
                    <View style={styles.footerLine} />
                    <View style={styles.footerContent}>
                        <Text style={styles.footerBranch}>OECFM - Tableau des Appels</Text>
                        <Text
                            style={styles.pageNumber}
                            render={({ pageNumber, totalPages }) => (
                                `Page ${pageNumber} / ${totalPages}`
                            )}
                        />
                    </View>
                </View>
            </Page>
        </Document>
    );
}

export default ExportAppelPDF;
import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';
import { URL } from '../../../config/axios';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#334155' },
  // EN-TETE
  headerContainer: { flexDirection: 'row', justifyContent: 'spaceBetween', marginBottom: 30, borderBottomWidth: 2, borderBottomColor: '#1b4332', pb: 10 },
  logoSection: { flexDirection: 'row', alignItems: 'center' },
  logoPlaceholder: { width: 50, height: 50, backgroundColor: '#f1f5f9', marginRight: 10 }, // À remplacer par src={logoOECFM}
  logoImage: {
    width: 50,
    height: 50,
    marginRight: 10,
    // On peut ajouter objectFit pour éviter les déformations
    objectFit: 'contain' 
  },
  headerText: { flexDirection: 'column' },
  oecfmTitle: { fontSize: 18, fontWeight: 'bold', color: '#1b4332', letterSpacing: 1 },
  oecfmSubtitle: { fontSize: 9, color: '#64748b', marginTop: 2 },
  
  // INFOS DOCUMENT
  docInfo: { marginBottom: 20, marginLeft: 150, textAlign: 'right' },
  title: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', color: '#1e293b' },
  exercice: { fontSize: 9, color: '#475569', marginTop: 4 },

  // TABLEAU
  table: { display: "table", width: "100%", borderStyle: "solid", marginTop: 10 },
  tableRow: { flexDirection: "row", borderBottomColor: '#e2e8f0', borderBottomWidth: 0.5, minHeight: 22, alignItems: 'center' },
  tableColHeader: { backgroundColor: '#1b4332', color: '#ffffff', fontWeight: 'bold', borderBottomWidth: 0 },
  tableCell: { padding: 4, fontSize: 7 },
  
  // Alignements et Largeurs
  col1: { width: '8%' }, // Matr
  col2: { width: '32%' }, // Nom/Prenom
  col3: { width: '15%' },
  col4: { width: '15%', textAlign: 'right' }, // Montant
  col5: { width: '15%', textAlign: 'right' }, // Ajust
  col6: { width: '15%', textAlign: 'right', fontWeight: 'bold' }, // Net

  colEdition: { width: '5%' },
  colDate: { width: '5%' },
  colMatricule: { width: '6%' },
  colNom: { width: '20%' },
  colDetail: { width: '20%' },
  colAnouveau: { width: '10%', textAlign: 'right' },
  colCotisation: { width: '10%' , textAlign: 'right'},
  colAutre: { width: '10%' , textAlign: 'right'},
  colTotal: { width: '10%' , textAlign: 'right'},
  colValide: { width: '4%', textAlign: 'center' },
  
  // Footer spécifique : on cumule les largeurs des 7 premières colonnes (6+22+10+10+8+8+8 = 72%)
  footerLabel: { width: '46%', fontWeight: 'bold', textAlign: 'left', color: '#1b4332', paddingRight: 10 },
  colInterm: { width: '10%', textAlign: 'center' },
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

const PaiementTableauPDF = ({ data, exerciceLabel }) => {
  // Calcul des totaux
  const totalAnouveau = data.reduce((sum, r) => sum + (Number(r.anouveau) || 0), 0);
  const totalCotisation = data.reduce((sum, r) => sum + (Number(r.cotisation) || 0), 0);
  const totalAutre = data.reduce((sum, r) => sum + (Number(r.autre) || 0), 0);
  const total = data.reduce((sum, r) => sum + (Number(r.total) || 0), 0);

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
            <Text style={styles.title}>{"Tableau des paiments de cotisations"}</Text>
            <Text style={styles.exercice}>Période : {exerciceLabel}</Text>
            <Text style={styles.exercice}>Date d'édition : {new Date().toLocaleDateString('fr-FR')}</Text>
          </View>
        </View>
        
        {/* Table */}
        <View style={styles.table}>
          {/* Header du tableau - Nouvel Ordre */}
          <View fixed style={[styles.tableRow, styles.tableColHeader]}>
            <Text style={[styles.tableCell, styles.colEdition]}>EDITION</Text>
            <Text style={[styles.tableCell, styles.colDate]}>DATE PAIEMENT</Text>
            <Text style={[styles.tableCell, styles.colMatricule]}>Matr.</Text>
            <Text style={[styles.tableCell, styles.colNom]}>NOM ET PRÉNOMS</Text>
            <Text style={[styles.tableCell, styles.colDetail]}>DETAILS PAIEMENT / REFERENCE</Text>
            <Text style={[styles.tableCell, styles.colAnouveau]}>PAI. ANOUVEAU</Text>
            <Text style={[styles.tableCell, styles.colCotisation]}>PAI. COTIS ANNEE</Text>
            <Text style={[styles.tableCell, styles.colAutre]}>PAI. AUTRE APPEL</Text>
            <Text style={[styles.tableCell, styles.colTotal]}>TOTAL</Text>
            <Text style={[styles.tableCell, styles.colValide]}>VALIDE</Text>
          </View>

          {/* Lignes de données */}
          {data.map((row, i) => (
            <View key={i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }]}>
                <Text style={[styles.tableCell, styles.colEdition]}>{new Date(row.created_at).toLocaleDateString('fr-FR')}</Text>
                <Text style={[styles.tableCell, styles.colDate]}>{new Date(row.date).toLocaleDateString('fr-FR')}</Text>
              <Text style={[styles.tableCell, styles.colMatricule]}>{row.matricule}</Text>
              <Text style={[styles.tableCell, styles.colNom]}>{row.nom} {row.prenom}</Text>
              <Text style={[styles.tableCell, styles.colDetail]}>{row.nom} {row.reference}</Text>
              <Text style={[styles.tableCell, styles.colAnouveau]}>{fNum(row.anouveau)}</Text>
              <Text style={[styles.tableCell, styles.colCotisation]}>{fNum(row.cotisation)}</Text>
              <Text style={[styles.tableCell, styles.colAutre]}>{fNum(row.autre)}</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>{fNum(row.total)}</Text>
              {/* Logique Régime : 0=Normal, 1=Réduit */}
              <Text style={[styles.tableCell, styles.colValide]}>
                {row.valide === true ? "oui" : "Non"}
              </Text>
            </View>
          ))}

          {/* FOOTER TOTALISATION */}
          <View style={[styles.tableRow, { backgroundColor: '#dcfce7', borderBottomWidth: 0, marginTop: 2 }]}>
            <Text style={[styles.tableCell, styles.footerLabel]}>TOTAL GÉNÉRAL :</Text>
            <Text style={[styles.tableCell, styles.colInterm]}></Text>
            <Text style={[styles.tableCell, styles.colAnouveau, { fontWeight: 'bold', color: '#1b4332' }]}>{fNum(totalAnouveau)}</Text>
            <Text style={[styles.tableCell, styles.colCotisation, { fontWeight: 'bold', color: '#1b4332' }]}>{fNum(totalCotisation)}</Text>
            <Text style={[styles.tableCell, styles.colAutre, { fontWeight: 'bold', color: '#1b4332' }]}>{fNum(totalAutre)}</Text>
            <Text style={[styles.tableCell, styles.colTotal, { fontWeight: 'bold', color: '#1b4332' }]}>{fNum(total)}</Text>
          </View>
        </View>

        {/* BAS DE PAGE : NUMÉROTATION */}
        <View fixed style={styles.footerContainer}>
            <View style={styles.footerLine} />
            <View style={styles.footerContent}>
                <Text style={styles.footerBranch}>OECFM - Tableau des paiements</Text>
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
};

export default PaiementTableauPDF;
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Enregistrement d'une police plus pro (optionnel)
Font.register({
  family: 'Helvetica-Bold',
  src: 'https://fonts.gstatic.com/s/helveticaneue/v70/pxiByp8kv8JHgFVrLCz7V1s.ttf'
});

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#FFFFFF', fontFamily: 'Helvetica', fontSize: 10 },
  header: { 
    flexDirection: 'row', 
    backgroundColor: '#2d6a4f', 
    padding: 20, 
    borderRadius: 5, 
    marginBottom: 20,
    color: 'white',
    alignItems: 'center'
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15, border: '2px solid white' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  subtitle: { fontSize: 10, opacity: 0.8 },
  
  section: { marginBottom: 15 },
  sectionTitle: { 
    fontSize: 9, 
    color: '#2d6a4f', 
    fontWeight: 'bold', 
    borderBottom: '1px solid #eee', 
    paddingBottom: 3, 
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  row: { flexDirection: 'row', marginBottom: 8 },
  column: { flex: 1 },
  label: { fontSize: 6, color: '#999', textTransform: 'uppercase', marginBottom: 2 },
  value: { fontSize: 10, color: '#333', fontWeight: 'normal' },
  
  footer: { 
    position: 'absolute', 
    bottom: 30, 
    left: 40, 
    right: 40, 
    borderTop: '1px solid #eee', 
    paddingTop: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    color: '#999',
    fontSize: 8
  }
});

const FicheMembrePDF = ({ data }) => (
  <Document title={`Fiche_${data.matricule}`}>
    <Page size="A4" style={styles.page}>
      {/* HEADER */}
      <View style={styles.header}>
        {data.photo_url && (
           <Image 
             src={`http://localhost:5100/uploads/profiles/${data.photo_url}`} 
             style={styles.avatar} 
           />
        )}
        <View>
          <Text style={styles.title}>{data.nom} {data.prenom}</Text>
          <Text style={styles.subtitle}>Matricule : {data.matricule} | Section : {data.section}</Text>
        </View>
      </View>

      {/* BLOC 1: ADMIN */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Situation Administrative</Text>
        <View style={styles.row}>
          <View style={styles.column}><Text style={styles.label}>Section</Text><Text style={styles.value}>{data.section}</Text></View>
          <View style={styles.column}><Text style={styles.label}>Statut</Text><Text style={styles.value}>{data.statut}</Text></View>
        </View>
        <View style={styles.row}>
          <View style={styles.column}><Text style={styles.label}>Titre</Text><Text style={styles.value}>{data.titre}</Text></View>
          <View style={styles.column}><Text style={styles.label}>Poste</Text><Text style={styles.value}>{data.poste}</Text></View>
        </View>
        <View style={styles.row}>
            <View style={styles.column}><Text style={styles.label}>Promotion</Text><Text style={styles.value}>{data.promotion}</Text></View>
            <View style={styles.column}><Text style={styles.label}>Actif</Text><Text style={styles.value}>{data.membre_active}</Text></View>
        </View>

        <View style={styles.row}>
            <View style={styles.column}><Text style={styles.label}>Situation</Text><Text style={styles.value}>{data.situation}</Text></View>
            <View style={styles.column}><Text style={styles.label}>Email oecfm</Text><Text style={styles.value}>{data.email_oecfm}</Text></View>
        </View>

        <View style={styles.row}>
            <View style={styles.column}><Text style={styles.label}>Email professionnel</Text><Text style={styles.value}>{data.email_professionnel}</Text></View>
            <View style={styles.column}><Text style={styles.label}>Email personnel</Text><Text style={styles.value}>{data.email_personnel}</Text></View>
        </View>

        <View style={styles.row}>
            <View style={styles.column}><Text style={styles.label}>Date d'adhésion</Text><Text style={styles.value}>{new Date(data.date_adhesion).toLocaleDateString('fr-FR')}</Text></View>
            <View style={styles.column}><Text style={styles.label}>Nombre associés</Text><Text style={styles.value}>{data.nombre_associe}</Text></View>
        </View>

        <View style={styles.row}>
            <View style={styles.column}><Text style={styles.label}>N° compte</Text><Text style={styles.value}>{data.num_compte}</Text></View>
        </View>
      </View>

      {/* BLOC 2: CONTACT */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coordonnées & Localisation</Text>
        <View style={styles.row}>
            <View style={styles.column}><Text style={styles.label}>Téléphone</Text><Text style={styles.value}>{data.telephone}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.label}>Fax</Text><Text style={styles.value}>{data.fax}</Text></View>
        </View>
        <View style={styles.row}>
            <View style={{ flex: 1 }}><Text style={styles.label}>Adresse</Text><Text style={styles.value}>{data.adresse}</Text></View>
            <View style={styles.column}><Text style={styles.label}>Ville</Text><Text style={styles.value}>{data.ville}</Text></View>
        </View>
        <View style={styles.row}>
            <View style={{ flex: 1 }}><Text style={styles.label}>CP</Text><Text style={styles.value}>{data.code_postal}</Text></View>
            <View style={styles.column}><Text style={styles.label}>BP</Text><Text style={styles.value}>{data.boite_postale}</Text></View>
        </View>
        <View style={styles.row}>
          <View style={styles.column}><Text style={styles.label}>Région</Text><Text style={styles.value}>{data.region}</Text></View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
        <View style={styles.row}>
            <View style={styles.column}><Text style={styles.label}>né(e) le</Text><Text style={styles.value}>{ new Date(data.date_naissance).toLocaleDateString('fr-FR')}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.label}>A</Text><Text style={styles.value}>{data.lieu_naissance}</Text></View>
        </View>
        <View style={styles.row}>
            <View style={{ flex: 1 }}><Text style={styles.label}>Sexe</Text><Text style={styles.value}>{data.sexe}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.label}>N° Cin</Text><Text style={styles.value}>{data.cin}</Text></View>
        </View>
        <View style={styles.row}>
            <View style={styles.column}><Text style={styles.label}>Délivrée le</Text><Text style={styles.value}>{ new Date(data.date_cin).toLocaleDateString('fr-FR')}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.label}>A</Text><Text style={styles.value}>{data.lieu_cin}</Text></View>
        </View>
        
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text>Généré par Ges OECFM - {new Date().toLocaleDateString()}</Text>
        <Text>Page 1 / 1</Text>
      </View>
    </Page>
  </Document>
);

export default FicheMembrePDF;
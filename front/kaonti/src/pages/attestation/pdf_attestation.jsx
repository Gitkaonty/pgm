import React, { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';
import useAxiosPrivate from '../../../config/axiosPrivate';
import { URL } from '../../../config/axios';

const PdfAttestationExpA = ({ rows, infoSignataire }) => {
    const data = Array.isArray(infoSignataire) ? infoSignataire[0] : infoSignataire;
    const url = URL;

    // On utilise l'accession sécurisée
    const nom_president = data?.noms_signataires?.["Président"] || "Nom inconnu";
    const nom_secretaire = data?.noms_signataires?.["Secrétaire Général"] || "Nom inconnu";

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
                    marginTop: 5,                // Espace au-dessus
                    marginBottom: 0,             // Espace en-dessous
                    marginLeft: 20,              // Pour l'aligner avec vos textes décalés
                    marginRight: 20               // Pour ne pas qu'il touche le bord droit
                }} />

                <Text style={{ textAlign: 'left', fontSize: 10, fontWeight: 'normal', marginVertical: 5, textDecoration: 'none' }}>
                    Réf : {rows.num_attestation}
                </Text>

                <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginVertical: 10, textDecoration: 'none' }}>
                    ATTESTATION
                </Text>

                <Text style={{ textAlign: 'center', fontSize: 11, fontWeight: 'normal', marginVertical: 10, textDecoration: 'none' }}>
                    Le conseil de l'Ordre des Experts Comptables et Financiers de Madagascar certifie par la présente que:
                </Text>

                {/* PARTIE POUR LE TABLEAU A - EXPERTS COMPTABLE */}
                {rows.section === 'Expert Comptable' && rows.titre === 'Tableau A' &&
                <View>
                    
                    <Text style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginTop: 15, textDecoration: 'none' }}>
                        {rows.sexe === 'M'? 'Monsieur': 'Madame'} {rows.prenom} {rows.nom}
                    </Text>

                    <Text style={{ textAlign: 'center', fontSize: 12, fontWeight: 'normal', marginBottom: 15, textDecoration: 'none' }}>
                        Matricule N° {rows.matricule}
                    </Text>

                    <Text style={{ textAlign: 'justify', fontSize: 11, fontWeight: 'normal', marginTop: 10, textDecoration: 'none' }}>
                        {`Membre de l'ordre depuis ${new Date(rows.date_adhesion).getFullYear()}, y est inscrite actuellement en tant qu'Expert-Comptable et Financier 
                        exerçant à titre libéral ("Tableau A - 1ere section" du Tableau de l'Ordre en vigueur).`}
                    </Text>

                    <Text style={{ textAlign: 'justify', fontSize: 11, fontWeight: 'normal', marginTop: 10, textDecoration: 'none' }}>
                        A ce titre conformement aux dispositions des articles 2 et 3 de l'Ordonnance 92-047 du 05.11.92 modifiée par 
                        la loi 2001-023 du 03.01.02:
                    </Text>

                    <Text style={{marginLeft:20, textAlign: 'justify', fontSize: 11, fontWeight: 'normal', marginTop: 15, textDecoration: 'none' }}>
                        {`— ${rows.sexe === 'M'? 'il': 'elle'} fait profession habituelle de concevoir, d'organiser, d'ouvrir, de tenir, d'assister, de surveiller,
                        de vérifier, de redresser, et d'apprécier les comptabilités des entreprises et organismes;`}
                    </Text>

                    <Text style={{marginLeft:20, textAlign: 'left', fontSize: 11, fontWeight: 'normal', marginTop: 15, textDecoration: 'none' }}>
                        {`— ${rows.sexe === 'M'? 'il': 'elle'} est habilitée à donner une option sur la sincérité et la régularité des états financiers dans le 
                        cadre d'un audit légal au contractuel des sociétés et tous autres organismes.`}
                    </Text>
                </View>
                }

                {/* PARTIE POUR LE TABLEAU B - EXPERTS COMPTABLE */}
                {rows.section === 'Expert Comptable' && rows.titre === 'Tableau B' &&
                <View>
                    <Text style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginTop: 15, textDecoration: 'none' }}>
                        {rows.sexe === 'M'? 'Monsieur': 'Madame'} {rows.prenom} {rows.nom}
                    </Text>

                    <Text style={{ textAlign: 'center', fontSize: 12, fontWeight: 'normal', marginBottom: 15, textDecoration: 'none' }}>
                        Matricule N° {rows.matricule}
                    </Text>

                    <Text style={{ textAlign: 'justify', fontSize: 11, fontWeight: 'normal', marginTop: 10, textDecoration: 'none' }}>
                        {`Membre de l'ordre depuis ${new Date(rows.date_adhesion).getFullYear()}, y est inscrite actuellement en tant qu'Expert-Comptable et Financier 
                        n'exerçant pas à titre libéral ("Tableau B" du Tableau de l'Ordre en vigueur).`}
                    </Text>
                </View>
                }

                {/* PARTIE POUR SOCIETE EXPERTS */}
                {rows.section === 'Société Expert' &&
                <View>
                    <Text style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginTop: 15, textDecoration: 'none' }}>
                        {rows.prenom} {rows.nom}
                    </Text>

                    <Text style={{ textAlign: 'center', fontSize: 12, fontWeight: 'normal', marginBottom: 15, textDecoration: 'none' }}>
                        {rows.adresse}
                    </Text>

                    <Text style={{ textAlign: 'justify', fontSize: 11, fontWeight: 'normal', marginTop: 10, textDecoration: 'none' }}>
                        {`est inscrit depuis ${new Date(rows.date_adhesion).getFullYear()}, au Tableau de l’Ordre (« Tableau A – 2ème section» du Tableau de l’Ordre en vigueur) au titre de « société d’expertise comptable ».`}
                    </Text>

                    <Text style={{ textAlign: 'justify', fontSize: 11, fontWeight: 'normal', marginTop: 10, textDecoration: 'none' }}>
                        Ainsi conformément aux dispositions de l’Ordonnance modifiée n°92-047 du 5-11-92 régissant la profession comptable 
                        libérale à Madagascar, ledit cabinet est habilité à exercer les fonctions de commissaires aux comptes ou des missions 
                        d’audit contractuel ainsi que toutes activités d’expertise comptable.
                    </Text>
                </View>
                }

                {/* partie commune de toutes les attestations */}
                <Text style={{ textAlign: 'left', fontSize: 11, fontWeight: 'normal', marginVertical: 15, textDecoration: 'none' }}>
                    Cette attestation lui est délivrée pour servir et valoir ce que de droit.
                </Text>

                <Text style={{ textAlign: 'center', fontSize: 11, fontWeight: 'normal', marginVertical: 5, textDecoration: 'none' }}>
                    Fait à Antananarivo, {new Date().toLocaleDateString()}
                </Text>

                <Text style={{ textAlign: 'center', fontSize: 11, fontWeight: 'bold', marginVertical: 0, textDecoration: 'none' }}>
                    Pour le conseil,
                </Text>

                {/* Signatures */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginHorizontal:50 }}>
                    <View style={{ flexDirection: 'column', justifyContent: 'space-between', marginTop: 0, alignContent:'center', alignItems:'center' }}>
                        <Text>Le Secrétaire Général</Text>
                        {rows.validation_1 && rows.validation_2 &&
                            <Image
                                style={{ width: 100, height: 100, objectFit: 'contain' }}
                                src={`${url}/uploads/signatures/${data.sig_secretaire}`}
                            />
                        }
                        <Text style={{marginTop : rows.validation_1? rows.validation_2? 0 : 50 : 50}}>{nom_secretaire}</Text>
                    </View>
                    
                    <View style={{ flexDirection: 'column', justifyContent: 'space-between', marginTop: 0, alignContent:'center', alignItems:'center' }}>
                        <Text>Le Président</Text>
                        {rows.validation_1 && rows.validation_2 &&
                            <Image
                                style={{ width: 100, height: 100, objectFit: 'contain' }}
                                src={`${url}/uploads/signatures/${data.sig_president}`}
                            />
                        }
                        <Text style={{marginTop : rows.validation_1? rows.validation_2? 0 : 50 : 50}}>{nom_president}</Text>
                    </View>
                </View>
                
                <View style={{ flex: 1 }} />

                <Text style={{ textAlign: 'left', fontSize: 10, fontWeight: 'bold', marginTop: 20, textDecoration: 'none' }}>
                    Validité : 31 12 {rows.annee}
                </Text>

                <View style={{ border: '1pt solid #000' }}>
                    <Text style={{ textAlign: 'left', fontSize: 8, fontWeight: 'normal', marginVertical: 5, marginHorizontal:5, textDecoration: 'none' }}>
                        {`— La profession d'Expert Comptable et Financier est réglementée et protégée par la loi. L'ordonnance n°92-047 du 5 novembre 1992 ainsi que les lois qui l'ont modifiées et complétées ont pour objet, comme celle qui les ont précédée sous le n°62-104 du 1er octobre 1962, d'attribuer à des professionnels reconnus légalement et administrativement comme tels la faculté de concevoir, tenir, vérifier la comptabilité des entreprises ou organismes avec lesquels ils ne sont pas liés par un contrat de travail.`}
                    </Text>

                    <Text style={{ textAlign: 'left', fontSize: 8, fontWeight: 'normal', marginVertical: 5, marginHorizontal:5, textDecoration: 'none' }}>
                        {`— Selon les articles 4 et 20 de l'Ordonnance précitée, nul ne peut porter le titre d'Expert Comptable et Financier ou exercer les professions qui leur sont propres s'il n'est pas membre de l'Ordre des Experts Comptables et Financiers de Madagascar.`}
                    </Text>

                    <Text style={{ textAlign: 'left', fontSize: 8, fontWeight: 'normal', marginVertical: 5, marginHorizontal:5, textDecoration: 'none' }}>
                        {`— Commet uen infraction pénale d'exercice illégal de la profession toute personne physique ou morale qui n'étant pas inscrit au Tableau A (1ère et 2ème section) de l'ordre, exécute des travaux de comptabilité ou de révision comptable à titre libéral.`}
                    </Text>
                
                </View>

            </Page>
        </Document>
    );
}

export default PdfAttestationExpA;
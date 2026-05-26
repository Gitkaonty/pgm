import React from 'react';
import dayjs from 'dayjs';
import { View, Text, Image } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import { gridColumnsTotalWidthSelector } from '@mui/x-data-grid';

const styles = StyleSheet.create({
    mainContent: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    
    // Header ***********************
    header: {
        height: 100,
        flexDirection: 'row',
    },
    divImage: {
        width: '15%',
        backgroundColor: '#3B7864',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#DFE67C',
        fontSize: 5,
        textTransform: 'uppercase',
        fontFamily: "RobotoCondensed",
        fontWeight: 'semibold',
        padding: '5px 15px 0 15px',
        justifyContent: 'center',
        textAlign: 'center',
        lineHeight: 1.5,
        letterSpacing: 0.5,
    },
    image: {
        backgroundColor: 'white',
        height: 55,
        width: 55,
        borderRadius: 27.5,
        // padding: '10px 0 0 5px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        height: 50,
        width: 50,
    },
    divTitle: {
        width: '85%',
        lineHeight: 2,
        flexDirection: 'column',
        backgroundColor: '#3F4656',
        padding: '15px 5px 15px 10px',
    },
    title: {
        fontSize: 18,
        color: '#D9DF82',
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontFamily: "RobotoCondensed",
        fontWeight: 'semibold',
    },
    titleL1: {
        fontSize: 8.5,
        color: 'white',
        fontFamily: "RobotoCondensed",
    },
    titleL2: {
        flexDirection: 'row',
        fontSize: 7.5,
        color: '#C4D37E',
        fontFamily: "RobotoCondensed",
    },
    anneeH: {
        width: 23,
        height: 9,
        display: 'flex',
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#DFE67C',
    },
    anneeHText: {
        fontSize: 7.5,
        color: '#447863',
        lineHeight: 1,
    },
    titleL3: {
        fontSize: 8.5,
        color: 'white',
        fontFamily: "RobotoCondensed",
    },

    // Header Conseil ***********************
    divConseil: {
        height: 65,
        flexDirection: 'row',
    },
    divConseilTitle: {
        width: '15%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#014A7D',
    },
    conseilTitle: {
        fontSize: 10,
        color: 'white',
        textTransform: 'uppercase',
        fontFamily: "RobotoCondensed",
        fontWeight: 'semibold',
    },
    conseils: {
        width: '84%',
        fontSize: 8,
        display: "flex",
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: '2px 2px 2px 2px',
    },
    membreConseil: {
        width: '100%',
        flexDirection: 'row',
        fontFamily: "RobotoCondensed",
    },
    designation: {
        fontWeight: 'semibold',
        fontSize: 9,
        letterSpacing: 0.5,
    },
    noms: {
        fontSize: 9,
        letterSpacing: 0.5,
    },
    // ----------------
    rowContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },

    // Header President ***********************
    divPresident: {
        flexDirection: 'row',
    },
    divPresidentTitle: {
        display: 'flex',
        width: '15%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00719B',
    },
    presidentTitle: {
        fontSize: 10,
        color: 'white',
        textTransform: 'uppercase',
        fontFamily: "RobotoCondensed",
        fontWeight: 'semibold',
    },
    presidentHonneur: {
        width: '85%',
        lineHeight: 0.8,
        padding: '5px 5px 5px 5px',
        flexWrap: 'wrap',
        backgroundColor: '#E2E3E5',
        flexDirection: 'row',
    },
    presidents: {
        fontSize: 9,
        fontFamily: "RobotoCondensed",
        letterSpacing: 0.5,
    },

    // Header Tableau ***********************
    divTitre: {
        height: 20,
        flexDirection: 'row',
    },
    titre: {
        width: '15%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#447863',
    },
    titreText: {
        fontSize: 10,
        color: 'white',
        textTransform: 'uppercase',
        fontFamily: "RobotoCondensed",
        fontWeight: 'semibold',
    },
    titreDesignation: {
        width: '85%',
        backgroundColor: '#BED630',
        justifyContent: 'center',
        paddingLeft: '10px'
    },
    titreDesignationText: {
        fontSize: 15,
        color: '#4B4C4B',
        textTransform: 'uppercase',
        fontFamily: "RobotoCondensed",
    },

    // Header Section ***********************
    divSection: {
        flexDirection: 'row',
        height: 15,
    },
    section: {
        width: '15%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#404657',
    },
    sectionText: {
        fontSize: 10,
        color: 'white'
    },
    sectionDesignation: {
        width: '85%',
        paddingLeft: '10px',
        backgroundColor: '#DFE67C',
        justifyContent: 'center',
    },
    sectionDesignationText: {
        fontSize: 10,
        color: '#447863'
    },

    // Membres ***********************
    divMembres: {
        width: '100%',
        backgroundColor: 'white',
        // padding: '0 10px',
        display: 'flex',
        flexDirection: 'column',
    },
    membreRow: {
        display: 'flex',
        justifyContent: 'flex-start',
        flexDirection: 'row',
    },
    membre: {
        fontFamily: "RobotoCondensed",
        fontSize: 5,
        // border: '1px solid #000000',        
        width: "14vw",
    },
    divNom: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    membreNom: {
        width: '90%',
        fontSize: 6,
        fontWeight: "semibold",
        letterSpacing: '-.3px'
    },
    membreAnnee: {
        width: '10%',
        display: 'flex',
        borderRadius: 8,
        backgroundColor: '#DFE67C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    annee: {
        fontSize: 4,
        color: '#447863',
    },
    divEmail: {
        display: "flex",
        flexDirection: 'row',
    },
    membreEmail: {
        flexDirection: 'column',
    },

    footer: {
        backgroundColor: '#EEEDE1',
        height: 50,
        padding: '5px 10px 10px 15px',
        marginTop: "auto",
        // position: 'absolute',
        // bottom: 0,
        // left: 0,
        // right: 0,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 5,
    },
    footerBullet: {
        width: 2.5,
        height: 2.5,
        marginRight: 5,
        marginTop: 2,
        backgroundColor: '#404657',
        borderRadius: 27.5,
    },
    footerText: {
        flex: 1,
        fontSize: 6,
        wordWrap: 'break-word',
        color: '#404657',
        lineHeight: 1.5,
    },

    // TABLEAU ***********************
    divTableau: {
        position: 'absolute',
        right: 0,
        backgroundColor: '#FFFBCE',
        padding: '3px 7px',
        // borderRadius: 3,        
        marginTop: 80,
        marginRight: 20,
        flexDirection: 'column',
        transform: 'rotate(-3deg)',
        borderRadius: 2, 
    },
    tableauText: {
        color: '#6A8392',
        fontSize: 13,
        textTransform: 'uppercase',
        display: 'flex',
        justifyContent: 'center',
        alignContent: 'center',
    },
    tableauAnnee: {
        fontFamily: 'RobotoCondensed',
        color: '#3CB44B',
        fontSize: 13,
        display: 'flex',
        justifyContent: 'center',
        alignContent: 'center',
    },


});

// ABRÉGER LES NOMS
const truncateName = (name, maxLength) => {
    if (!name) return '';
    if (name.length > maxLength) {
        let nameArray = name.split(' ');
        let nameLength = 0;
        let finalName = '';
        let tempSubName = '';

        for (let subname of nameArray) {
            nameLength += subname.length;
            if (nameLength > maxLength) {
                let subNameInitial = "";

                if (subname.length < 3) {
                    tempSubName = subname;
                    continue;
                }

                if (tempSubName !== "") {
                    subNameInitial = tempSubName + ' ' + subname;
                    subNameInitial = subNameInitial[0].toUpperCase() + '.';
                    tempSubName = '';
                } else {
                    subNameInitial = subname[0].toUpperCase() + '.';
                }

                finalName = finalName + ' ' + subNameInitial;
            } else {
                finalName = finalName + ' ' + subname;
            }
        }
        return finalName.trim();
    }
    return name;
};

const formatMembreNom = (item) => {
    if (!item) return '';
    let sexe = item.sexe
        ? item.sexe === 'M' ? 'M.' : 'Mme'
        : '';
    let nom = item.nom && item.prenom
        ? item.prenom === '-'
            ? item.nom
            : item.nom + ' ' + item.prenom
        : item.nom || item.prenom || '';

    return `${sexe} ${nom}`.trim();
};

const chunkArray = (array, chunkSize) => {
    const chunks = [];
    if (!array) return chunks;
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
};

const Header = ({ information, membres }) => {
    const actualYear = dayjs().get("year");
    const lastYear = actualYear - 1;

    const conseillers = membres?.conseillers? membres?.conseillers: null;
    
    const presidentRaw = membres?.president;
    const president = Array.isArray(presidentRaw) 
    ? presidentRaw[0] 
    : (presidentRaw && typeof presidentRaw === 'object' ? presidentRaw : null);

    const presidentHonneur = membres?.presidentHonneur? membres?.presidentHonneur: null;

    const secretaireG_Raw = membres?.secretaireG? membres?.secretaireG : null;
    const secretaireG = Array.isArray(secretaireG_Raw) 
    ? secretaireG_Raw[0] 
    : (secretaireG_Raw && typeof secretaireG_Raw === 'object' ? secretaireG_Raw : null);

    const secretaireGA_Raw = membres?.secretaireGA? membres?.secretaireGA: null;
    const secretaireGA = Array.isArray(secretaireGA_Raw) 
    ? secretaireGA_Raw[0] 
    : (secretaireGA_Raw && typeof secretaireGA_Raw === 'object' ? secretaireGA_Raw : null);

    const tresorierRaw = membres?.tresorier? membres?.tresorier: null;
    const tresorier = Array.isArray(tresorierRaw) 
    ? tresorierRaw[0] 
    : (tresorierRaw && typeof tresorierRaw === 'object' ? tresorierRaw : null);

    const vicePDA_Raw = membres?.vicePDA? membres?.vicePDA: null;
    const vicePDA = Array.isArray(vicePDA_Raw) 
    ? vicePDA_Raw[0] 
    : (vicePDA_Raw && typeof vicePDA_Raw === 'object' ? vicePDA_Raw : null);

    const vicePDT_Raw = membres?.vicePDT? membres?.vicePDT: null;
    const vicePDT = Array.isArray(vicePDT_Raw) 
    ? vicePDT_Raw[0] 
    : (vicePDT_Raw && typeof vicePDT_Raw === 'object' ? vicePDT_Raw : null);


    return (
        <>
            {/* Partie Header avec logo et informations */}
            <View style={styles.header}>
                <View style={styles.divImage}>
                    <View style={styles.image}>
                        <Image
                            src="/logo500.png"
                            style={styles.logo}
                        />
                    </View>
                    <Text style={styles.text}>
                        Ordre des Experts Comptables et Financiers de Madagascar
                    </Text>
                </View>
                <View style={styles.divTitle}>
                    <Text style={styles.title}>
                        Ordre des experts comptables et financiers de Madagascar
                    </Text>
                    <Text style={styles.titleL1}>
                        Régie par l'Ordonnance n°62-104 du 01 Octobre 1962 - Ordonance 92-047 du 05 Novembre 1992 - Loi 96-019 du 04 Septembre 1996 - Loi 2001-023 du 02 Janvier
                    </Text>
                    <View style={styles.titleL2}>
                        <Text style={{ paddingRight: '2px' }}>
                            Membre de l'IFAC (International Federation of Accountants)
                        </Text>
                        <View style={styles.anneeH}>
                            <Text style={styles.anneeHText}>1999</Text>
                        </View>
                        <Text style={{ padding: '0 2px' }}>
                            - Membre de la FIDEF (Fédération Internationale des Experts Comptables Francophones)
                        </Text>
                        <View style={styles.anneeH}>
                            <Text style={styles.anneeHText}>1981</Text>
                        </View>
                        <Text style={{ padding: '0 2px' }}>
                            - Membre de la PAFA (Pan African Federation of Accountants)
                        </Text>
                        <View style={styles.anneeH}>
                            <Text style={styles.anneeHText}>2015</Text>
                        </View>
                    </View>

                    <Text style={styles.titleL3}>
                        Siège : {information?.adresse} - BP : {information?.boite_postale} - Tél : {information?.telephone} - Email : {information?.email} - Site web : {information?.site_web}
                    </Text>
                </View>
            </View>

            {/* Partie Conseil de l'ordre */}
            <View style={styles.divConseil}>
                <View style={styles.divConseilTitle}>
                    <Text style={styles.conseilTitle}>Conseil de l'ordre</Text>
                </View>
                <View style={styles.conseils}>
                    {president && (
                        <View style={{ ...styles.membreConseil, marginTop: 4 }}>
                            <Text style={styles.designation}>
                                {president.sexe === "M" ? 'Président : ' : 'Présidente : '}
                            </Text>
                            <Text style={styles.noms}>{formatMembreNom(president)}</Text>
                        </View>
                    )}
                    <View style={{ ...styles.membreConseil, marginTop: 2 }}>
                        {vicePDT && (
                            <>
                                <Text style={styles.designation}>
                                    {vicePDT.sexe === "M"
                                        ? 'Vice-Président Technique : '
                                        : 'Vice-Présidente Technique : '
                                    }
                                </Text>
                                <Text style={styles.noms}>{truncateName(formatMembreNom(vicePDT), 45)} </Text>
                            </>
                        )}

                        {vicePDA && (
                            <>
                                <Text>-</Text>
                                <Text style={styles.designation}>
                                    {vicePDA.sexe === "M"
                                        ? ' - Vice-Président Administratif : '
                                        : ' - Vice-Présidente Administratif : '
                                    }
                                </Text>
                                <Text style={styles.noms}>{truncateName(formatMembreNom(vicePDA), 45)}</Text>
                            </>
                        )}
                    </View>

                    <View style={{ ...styles.membreConseil, marginTop: 2 }}>
                        {secretaireG && (
                            <>
                                <Text style={styles.designation}>Secrétaire Général : </Text>
                                <Text style={styles.noms}>
                                    {truncateName(formatMembreNom(secretaireG), 30)}
                                    
                                </Text>
                            </>
                        )}

                        {secretaireGA && (
                            <>
                                <Text style={styles.designation}> - Secrétaire Général Adjoint :</Text>
                                <Text style={styles.noms}>
                                    {truncateName(formatMembreNom(secretaireGA), 30)}
                                    
                                </Text>
                            </>
                        )}

                        {tresorier && (
                            <>
                                <Text style={styles.designation}>
                                    {tresorier.sexe === "M" ? ' - Trésorier : ' : ' - Trésorière : '}
                                </Text>
                                <Text style={styles.noms}>{truncateName(formatMembreNom(tresorier), 30)}</Text>
                            </>
                        )}
                    </View>

                    {conseillers && Object.values(conseillers).length > 0 && (
                        <View style={{ ...styles.membreConseil, marginTop: 2 }}>
                            <Text style={styles.designation}>Conseillers : </Text>
                            <Text style={{ ...styles.noms, lineHeight: 1.25, flexWrap: 'wrap' }}>
                                {Object.values(conseillers).map((item, i) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && <Text> - </Text>}
                                        <Text>{formatMembreNom(item)}</Text>
                                    </React.Fragment>
                                ))}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.divTableau}>
                <Text style={styles.tableauText}>Tableau</Text>
                <Text style={styles.tableauAnnee}>
                    {lastYear} - {actualYear}
                </Text>
            </View>

            <View style={styles.divPresident}>
                <View style={styles.divPresidentTitle}>
                    <Text style={styles.presidentTitle}>Présidents d'honneur</Text>
                </View>
                <View style={styles.presidentHonneur}>
                    {presidentHonneur && presidentHonneur.map((item, i) => (
                        <React.Fragment key={item.id || i}>
                            {/* 1. On ajoute le tiret de séparation à partir du deuxième élément */}
                            {i > 0 && (
                                <Text style={styles.presidents}> - </Text>
                            )}
                            
                            {/* 2. On affiche le nom formaté extrait directement du tableau */}
                            <Text style={styles.presidents}>
                                {formatMembreNom(item)}
                            </Text>
                        </React.Fragment>
                    ))}
                </View>
            </View>
        </>
    );
};

export default Header;
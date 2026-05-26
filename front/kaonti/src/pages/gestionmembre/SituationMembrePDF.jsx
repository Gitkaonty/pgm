import React from 'react';
import dayjs from 'dayjs';
import {
    Document,
    Page,
    Text,
    View,
    Font,
    StyleSheet
} from '@react-pdf/renderer';
import Header from './SituationMembrePDF_header';

const styles = StyleSheet.create({
    mainContent: {
        flex: 1,
        flexDirection: 'column',
    },
    header: {
        height: 100,
        flexDirection: 'row',
    },
    divImage: {
        width: '15%',
        backgroundColor: '#3B7864',
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
    divConseil: {
        height: 65,
        flexDirection: 'row',
    },
    divConseilTitle: {
        width: '15%',
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
        width: '85%',
        fontSize: 8,
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: '0 5px 0 10px',
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
        letterSpacing: 0.5
    },
    rowContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    divPresident: {
        flexDirection: 'row',
        height: 40,
        marginTop: 5,
    },
    divPresidentTitle: {
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
        lineHeight: 1.5,
        padding: '8px 10px',
        flexWrap: 'wrap',
        backgroundColor: '#E2E3E5',
        flexDirection: 'row',
    },
    presidents: {
        fontSize: 9,
        fontFamily: "RobotoCondensed",
        letterSpacing: 0.5,
    },
    divTitre: {
        height: 20,
        flexDirection: 'row',
    },
    titre: {
        width: '15%',
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
    divSection: {
        flexDirection: 'row',
        height: 15,
    },
    section: {
        width: '15%',
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
    divMembres: {
        width: '100%',
        backgroundColor: 'white',
        flexDirection: 'column',
    },
    membreRow: {
        justifyContent: 'flex-start',
        flexDirection: 'row',
    },
    membre: {
        fontFamily: "RobotoCondensed",
        fontSize: 5,
        width: "135px", // Évitez vw dans les PDF (utilisez des points ou pixels fixes)
    },
    divNom: {
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
        borderRadius: 10,
        backgroundColor: '#DFE67C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    annee: {
        fontSize: 4,
        color: '#447863',
    },
    divEmail: {
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
        color: '#404657',
        lineHeight: 1.5,
    },
    divTableau: {
        position: 'absolute',
        right: 0,
        backgroundColor: '#FFFBCE',
        padding: '3px 7px',
        marginTop: 80,
        marginRight: 20,
        flexDirection: 'column',
        borderRadius: 2, 
    },
    tableauText: {
        color: '#6A8392',
        fontSize: 13,
        textTransform: 'uppercase',
        justifyContent: 'center',
    },
    tableauAnnee: {
        fontFamily: 'RobotoCondensed',
        color: '#3CB44B',
        fontSize: 13,
        justifyContent: 'center',
    },
});

Font.register({
    family: 'RobotoCondensed',
    fonts: [
        { src: "/RobotoCondensedRegular.ttf" },
        { src: "/RobotoCondensedSemiBold.ttf", fontWeight: "semibold" }
    ],
});

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
    let sexe = item.sexe ? (item.sexe === 'M' ? 'M.' : 'Mme') : '';
    let nom = item.nom && item.prenom
        ? (item.prenom === '-' ? item.nom : item.nom + ' ' + item.prenom)
        : item.nom || item.prenom || '';
    return `${sexe} ${nom}`.trim();
};

const formatSocieteMembreNom = (item) => {
    if (!item) return '';
    let nom = item.nom + ' ' + item.prenom;
    return `${nom}`.trim();
};

const stylingEmail = (email) => {
    if (email && email.length > 45) return { fontSize: 4.5 };
    return {};
};

const membreItem = (item, key) => (
    <View key={key} style={{ ...styles.membre, padding: '5px 0 5px 5px' }}>
        <View style={styles.divNom}>
            <Text style={styles.membreNom}>
                {truncateName(formatMembreNom(item), 32)}
            </Text>
            <View style={styles.membreAnnee}>
                <Text style={styles.annee}>{item?.promotion}</Text>
            </View>
        </View>
        <Text style={styles.membreAdresse}>{item?.adresse || ''}</Text>
        <Text style={styles.membreCodeP}>
            {item?.code_postal && item?.ville ? `${item.code_postal} - ${item.ville}` : (item?.code_postal || item?.ville || '')}
        </Text>
        <Text style={styles.membreBoiteP}>
            {[
                item?.boite_postale ? `BP ${item.boite_postale}` : null,
                item?.telephone ? `Tel. ${item.telephone}` : null,
                item?.fax ? `Fax : ${item.fax}` : null,
            ].filter(Boolean).join(" - ")}
        </Text>
        <View style={styles.divEmail}>
            <Text>Email : </Text>
            <View style={styles.membreEmail}>
                {item?.email_oecfm && <Text style={stylingEmail(item.email_oecfm)}>{item.email_oecfm}</Text>}
                {item?.email_personnel && <Text style={stylingEmail(item.email_personnel)}>{item.email_personnel}</Text>}
            </View>
        </View>
    </View>
);

const membreSocieteItem = (item, key) => (
    <View key={key} style={{ ...styles.membre, padding: '5px 0 5px 5px' }}>
        <View style={styles.divNom}>
            <Text style={styles.membreNom}>
                {truncateName(formatSocieteMembreNom(item), 32)}
            </Text>
            <View style={styles.membreAnnee}>
                <Text style={styles.annee}>{item?.promotion}</Text>
            </View>
        </View>
        <Text style={styles.membreAdresse}>{item?.adresse || ''}</Text>
        <Text style={styles.membreCodeP}>
            {item?.code_postal && item?.ville ? `${item.code_postal} - ${item.ville}` : (item?.code_postal || item?.ville || '')}
        </Text>
        <Text style={styles.membreBoiteP}>
            {[
                item?.boite_postale ? `BP ${item.boite_postale}` : null,
                item?.telephone ? `Tel. ${item.telephone}` : null,
                item?.fax ? `Fax : ${item.fax}` : null,
            ].filter(Boolean).join(" - ")}
        </Text>
        <View style={styles.divEmail}>
            <Text>Email : </Text>
            <View style={styles.membreEmail}>
                {item?.email_oecfm && <Text style={stylingEmail(item.email_oecfm)}>{item.email_oecfm}</Text>}
                {item?.email_personnel && <Text style={stylingEmail(item.email_personnel)}>{item.email_personnel}</Text>}
            </View>
        </View>
    </View>
);

const Footer = () => (
    <View style={styles.footer}>
        <View style={{ ...styles.footerItem, marginBottom: 10 }}>
            <View style={styles.footerBullet}></View>
            <Text style={styles.footerText}>
                La profession d’Expert-Comptable et Financier est réglementée et protégée par la loi.
                L’Ordonnance n°92-047 du 5 novembre 1992 ainsi que les lois qui l’ont modifiées...
            </Text>
        </View>
    </View>
);

const chunkArray = (array, chunkSize) => {
    const chunks = [];
    if (!array) return chunks;
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
};

// COMPOSANT PDF UNIQUE (Exporté par défaut)
const MembrePDFOfficiel = ({ membres, pageSize, information }) => {
    const titreB = membres?.titreB ? chunkArray(Object.values(membres.titreB), 7) : [];
    const societeSection = membres?.sectionSociete ? chunkArray(Object.values(membres.sectionSociete), 7) : [];
    const expertAutreRegion = membres?.regionAutre ? chunkArray(Object.values(membres.regionAutre), 7) : [];
    const regionAnalamangaMembers = membres?.regionAnalamanga ? chunkArray(Object.values(membres.regionAnalamanga), 7) : [];

    const calculatedWidth = pageSize?.width || 1000;
    const calculatedHeight = pageSize?.height || 1400;

    return (
        <Document title='Tableau OECFM' author='OECFM' subject='Tableau OECFM'>
            <Page size={[calculatedWidth, calculatedHeight]} wrap={false}>
                <View fixed>
                    <Header membres={membres} information={information} />
                </View>

                {/* Tableau A */}
                <View style={{ ...styles.divTitre, marginTop: 10 }} fixed>
                    <View style={styles.titre}><Text style={styles.titreText}>Tableau A</Text></View>
                    <View style={styles.titreDesignation}>
                        <Text style={styles.titreDesignationText}>Membres de l'ordre en activité</Text>
                    </View>
                </View>

                {/* 1ère Section */}
                <View style={{ ...styles.divSection, marginTop: 5 }} fixed>
                    <View style={styles.section}><Text style={styles.sectionText}>1ère Section</Text></View>
                    <View style={styles.sectionDesignation}>
                        <Text style={styles.sectionDesignationText}>Experts comptables et Financiers : Région d'Analamanga</Text>
                    </View>
                </View>

                {/* Membres Analamanga */}
                <View style={styles.divMembres}>
                    {regionAnalamangaMembers.map((membreRow, i) => (
                        <View key={i} style={{ ...styles.membreRow, padding: '0 10px', backgroundColor: i % 2 === 0 ? '#F2F3F4' : 'transparent' }} wrap={false}>
                            {membreRow.map((item, j) => membreItem(item, j))}
                        </View>
                    ))}
                </View>

                {/* Autres Sections */}
                <View style={styles.divSection}>
                    <View style={styles.section}><Text style={styles.sectionText}>1ère Section </Text></View>
                    <View style={styles.sectionDesignation}>
                        <Text style={styles.sectionDesignationText}>Experts comptables : Adresses autres que Région Analamanga</Text>
                    </View>
                </View>

                <View style={styles.divMembres}>
                    {expertAutreRegion.map((membreRow, i) => (
                        <View key={i} style={{ ...styles.membreRow, padding: '0 10px', backgroundColor: i % 2 === 0 ? '#F2F3F4' : 'transparent' }} wrap={false}>
                            {membreRow.map((item, j) => membreItem(item, j))}
                        </View>
                    ))}
                </View>

                {/* Section Sociétés */}
                <View style={styles.divSection}>
                    <View style={styles.section}><Text style={styles.sectionText}>2ème Section </Text></View>
                    <View style={styles.sectionDesignation}>
                        <Text style={styles.sectionDesignationText}>Société d'Expertise Comptable</Text>
                    </View>
                </View>

                <View style={styles.divMembres}>
                    {societeSection.map((membreRow, i) => (
                        <View key={i} style={{ ...styles.membreRow, backgroundColor: i % 2 === 0 ? '#F2F3F4' : 'transparent' }} wrap={false}>
                            {membreRow.map((item, j) => membreSocieteItem(item, j))}
                        </View>
                    ))}
                </View>

                {/* Tableau B */}
                <View style={styles.divTitre}>
                    <View style={styles.titre}><Text style={styles.titreText}>Tableau B</Text></View>
                    <View style={styles.titreDesignation}>
                        <Text style={styles.titreDesignationText}>Membres n'exerçant pas à titre libéral</Text>
                    </View>
                </View>

                <View style={{ ...styles.divMembres, padding: '0 10px' }}>
                    {titreB.map((membreRow, i) => (
                        <View key={i} style={styles.membreRow} wrap={false}>
                            {membreRow.map((item, j) => (
                                <View key={j} style={{ ...styles.membre, padding: '5px 0 0 5px' }}>
                                    <View style={styles.divNom}>
                                        <Text style={styles.membreNom}>{truncateName(formatMembreNom(item), 32)}</Text>
                                        <View style={styles.membreAnnee}><Text style={styles.annee}>{item?.promotion}</Text></View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>
                <View style={{ height: 20 }}></View>
                <Footer />
            </Page>
        </Document>
    );
};

export default MembrePDFOfficiel;
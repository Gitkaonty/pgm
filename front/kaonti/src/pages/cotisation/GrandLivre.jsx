import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Stack, TextField, Autocomplete, MenuItem, 
    Select, FormControl, Button, Drawer, Divider, IconButton, 
    InputLabel,
    Breadcrumbs,
    Link,
    Dialog,
    DialogTitle,
    DialogContent,
    FormGroup,
    FormControlLabel,
    Checkbox,
    DialogActions
} from '@mui/material';
import { DataGrid, gridClasses } from '@mui/x-data-grid';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import useAxiosPrivate from '../../../config/axiosPrivate';
import { HomeOutlined, NavigateNext } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet,Image } from '@react-pdf/renderer';
import FileDownloadIcon from '@mui/icons-material/FileDownload'; // Pour l'icône du bouton
import SaveIcon from '@mui/icons-material/SaveOutlined';
import { jwtDecode } from 'jwt-decode';
import useAuth from '../../hooks/useAuth';

const MyBreadcrumbs = ({ currentPath }) => (
  <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
    <Link underline="hover" color="inherit" href="/dashboard" sx={{ display: 'flex', alignItems: 'center' }}>
      <HomeOutlined sx={{ mr: 0.5, fontSize: 20 }} /> Dashboard
    </Link>
    <Typography color="text.primary" sx={{ fontWeight: 600 }}>{currentPath}</Typography>
  </Breadcrumbs>
);

const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica' },
  
  // --- Nouveaux Styles Entête ---
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1b4332',
    paddingBottom: 10,
    marginBottom: 20,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  headerText: {
    flexDirection: 'column',
  },
  oecfmTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1b4332',
  },
  oecfmSubtitle: {
    fontSize: 7,
    color: '#64748b',
    width: 200,
  },
  docInfo: {
    textAlign: 'right',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  exercice: {
    fontSize: 9,
    color: '#475569',
    marginTop: 2,
  },

  // --- Styles Tableaux ---
  table: { display: 'table', width: 'auto', borderStyle: 'solid', borderLeftWidth: 0.2, borderTopWidth: 0.2 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.2, borderRightWidth: 0.2, alignItems: 'center' },
  header: { backgroundColor: '#f1f5f9', fontWeight: 'bold' },
  cell: { flex: 1, padding: 4, borderRightWidth: 0.2 },
  cellRight: { flex: 1, padding: 4, textAlign: 'right', borderRightWidth: 0.2 },

  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9', // Un léger gris pour détacher la ligne
    borderBottomWidth: 0.2,
    borderRightWidth: 0.2,
    alignItems: 'center',
    },
    totalCellGreen: {
        flex: 1,
        padding: 4,
        textAlign: 'right',
        borderRightWidth: 0.2,
        color: '#16a34a', // Le vert "pro"
        fontWeight: 'bold',
    }
});

const fNum = (val) => {
if (val === undefined || val === null) return "0";

// 1. On convertit en entier pour enlever les virgules si besoin
// 2. On utilise une regex pour ajouter un espace tous les 3 chiffres
return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const ExportPDFDocument = ({ data, options, exerciceLabel }) => (
  <Document>
    {/* PAGE BALANCE */}
    {options.balance && (
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        {/* Ton Entête personnalisée */}
        <View style={pdfStyles.headerContainer}>
          <View style={pdfStyles.logoSection}>
            <Image style={pdfStyles.logoImage} src="/logo500.png" />
            <View style={pdfStyles.headerText}>
              <Text style={pdfStyles.oecfmTitle}>OECFM</Text>
              <Text style={pdfStyles.oecfmSubtitle}>Ordre des Experts Comptables et Financiers de Madagascar</Text>
            </View>
          </View>
          <View style={pdfStyles.docInfo}>
            <Text style={pdfStyles.title}>Balance Générale</Text>
            <Text style={pdfStyles.exercice}>Période : {exerciceLabel}</Text>
            <Text style={pdfStyles.exercice}>Date d'édition : {new Date().toLocaleDateString('fr-FR')}</Text>
          </View>
        </View>

        {/* Tableau Balance */}
        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tableRow, pdfStyles.header]}>
            <Text style={[pdfStyles.cell, { flex: 0.5 }]}>Matricule</Text>
            <Text style={[pdfStyles.cell, { flex: 2 }]}>Membre</Text>
            <Text style={pdfStyles.cellRight}>Report (AN)</Text>
            <Text style={pdfStyles.cellRight}>Débit</Text>
            <Text style={pdfStyles.cellRight}>Crédit</Text>
            <Text style={pdfStyles.cellRight}>Solde</Text>
          </View>
          {data.map((r, i) => (
            <View key={i} style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.cell, { flex: 0.5 }]}>{r.matricule}</Text>
              <Text style={[pdfStyles.cell, { flex: 2 }]}>{`${r.nom} ${r.prenom}`}</Text>
              <Text style={pdfStyles.cellRight}>{fNum(r.soldeInitial)}</Text>
              <Text style={pdfStyles.cellRight}>{fNum(r.totalDebit)}</Text>
              <Text style={pdfStyles.cellRight}>{fNum(r.totalCredit)}</Text>
              <Text style={[pdfStyles.cellRight, { fontWeight: 'bold' }]}>{fNum(r.solde)}</Text>
            </View>
          ))}

          {/* LIGNE DE TOTAL GÉNÉRAL */}
        <View style={pdfStyles.totalRow}>
            <Text style={[pdfStyles.cell, { flex: 2.57, fontWeight: 'bold' }]}>TOTAL GÉNÉRAL</Text>
            <Text style={pdfStyles.totalCellGreen}>
                {fNum(data.reduce((sum, r) => sum + (Number(r.soldeInitial) || 0), 0))}
            </Text>
            <Text style={pdfStyles.totalCellGreen}>
                {fNum(data.reduce((sum, r) => sum + (Number(r.totalDebit) || 0), 0))}
            </Text>
            <Text style={pdfStyles.totalCellGreen}>
                {fNum(data.reduce((sum, r) => sum + (Number(r.totalCredit) || 0), 0))}
            </Text>
            <Text style={[pdfStyles.totalCellGreen, { backgroundColor: '#dcfce7' }]}> {/* Fond vert très clair pour le solde final */}
                {fNum(data.reduce((sum, r) => sum + (Number(r.solde) || 0), 0))}
            </Text>
            </View>
        </View>
      </Page>
    )}

    {/* PAGE GRAND LIVRE (Sur une nouvelle page si sélectionné) */}
    {options.grandLivre && (
        <Page size="A4" orientation="landscape" style={pdfStyles.page}>
            {/* Entête OECFM (à répéter ici) */}
            <View style={pdfStyles.headerContainer}>
            <View style={pdfStyles.logoSection}>
                <Image style={pdfStyles.logoImage} src="/logo500.png" />
                <View style={pdfStyles.headerText}>
                <Text style={pdfStyles.oecfmTitle}>OECFM</Text>
                <Text style={pdfStyles.oecfmSubtitle}>Ordre des Experts Comptables et Financiers de Madagascar</Text>
                </View>
            </View>
            <View style={pdfStyles.docInfo}>
                <Text style={pdfStyles.title}>Grand Livre Détail</Text>
                <Text style={pdfStyles.exercice}>Période : {exerciceLabel}</Text>
                <Text style={pdfStyles.exercice}>Date d'édition : {new Date().toLocaleDateString('fr-FR')}</Text>
            </View>
            </View>

            {/* BOUCLE PRINCIPALE : LES MEMBRES */}
            {data.map((membre, idx) => (
            <View key={idx} style={{ marginBottom: 15, break: 'inside-avoid' }}>
                {/* Bandeau d'identification du membre */}
                <View style={{ backgroundColor: '#f8fafc', padding: 5, borderLeftWidth: 3, borderLeftColor: '#1b4332', marginBottom: 5 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                    {membre.matricule} - {membre.nom} {membre.prenom}
                </Text>
                </View>

                <View style={pdfStyles.table}>
                {/* Entête du tableau pour ce membre */}
                <View style={[pdfStyles.tableRow, pdfStyles.header]}>
                    <Text style={[pdfStyles.cell, { flex: 0.8 }]}>Date</Text>
                    <Text style={[pdfStyles.cell, { flex: 2.5 }]}>Libellé</Text>
                    <Text style={pdfStyles.cell}>Référence</Text>
                    <Text style={pdfStyles.cellRight}>Débit</Text>
                    <Text style={pdfStyles.cellRight}>Crédit</Text>
                </View>

                {/* 1. LIGNE REPORT À NOUVEAU (Si non nul) */}
                {Number(membre.soldeInitial) !== 0 && (
                    <View style={[pdfStyles.tableRow, { backgroundColor: '#fdfdfd' }]}>
                    <Text style={[pdfStyles.cell, { flex: 0.8 }]}>-</Text>
                    <Text style={[pdfStyles.cell, { flex: 2.5, fontWeight: 'bold' }]}>REPORT À NOUVEAU</Text>
                    <Text style={pdfStyles.cell}>AN</Text>
                    <Text style={pdfStyles.cellRight}>
                        {membre.soldeInitial > 0 ? fNum(membre.soldeInitial) : '0'}
                    </Text>
                    <Text style={pdfStyles.cellRight}>
                        {membre.soldeInitial < 0 ? fNum(Math.abs(Number(membre.soldeInitial))) : '0'}
                    </Text>
                    </View>
                )}

                {/* 2. BOUCLE SECONDAIRE : LES DÉTAILS DU MEMBRE */}
                {membre.details && membre.details.length > 0 ? (
                    membre.details.map((d, i) => (
                    <View key={i} style={pdfStyles.tableRow}>
                        <Text style={[pdfStyles.cell, { flex: 0.8 }]}>
                        {new Date(d.date_op).toLocaleDateString('fr-FR')}
                        </Text>
                        <Text style={[pdfStyles.cell, { flex: 2.5 }]}>{d.libelle}</Text>
                        <Text style={pdfStyles.cell}>{d.reference || '-'}</Text>
                        <Text style={pdfStyles.cellRight}>{fNum(d.debit || 0)}</Text>
                        <Text style={pdfStyles.cellRight}>{fNum(d.credit || 0)}</Text>
                    </View>
                    ))
                ) : (
                    <View style={pdfStyles.tableRow}>
                    <Text style={[pdfStyles.cell, { flex: 4.3, textAlign: 'center', color: '#94a3b8' }]}>
                        Aucun mouvement sur cette période
                    </Text>
                    </View>
                )}

                {/* 3. LIGNE SOUS-TOTAL DU MEMBRE */}
                <View style={[pdfStyles.tableRow, { backgroundColor: '#f1f5f9' }]}>
                    <Text style={[pdfStyles.cell, { flex: 4.43, fontWeight: 'bold', textAlign: 'right' }]}>
                        TOTAL {membre.nom} (Mouvements + AN) :
                    </Text>
                    <Text style={[pdfStyles.cellRight, { fontWeight: 'bold' }]}>
                        {/* Somme Débit + Report si positif */}
                        {fNum(Number(membre.totalDebit) + (membre.soldeInitial > 0 ? Number(membre.soldeInitial) : 0))}
                    </Text>
                    <Text style={[pdfStyles.cellRight, { fontWeight: 'bold' }]}>
                        {/* Somme Crédit + Report si négatif */}
                        {(fNum(membre.totalCredit) + (membre.soldeInitial < 0 ? Math.abs(Number(membre.soldeInitial)) : 0))}
                    </Text>
                </View>

                {/* 4. LIGNE DU SOLDE DU MEMBRE (En Vert) */}
                <View style={pdfStyles.tableRow}>
                    <Text style={[pdfStyles.cell, { flex: 4.3, fontWeight: 'bold', textAlign: 'right' }]}>
                    SOLDE :
                    </Text>
                    <Text style={[pdfStyles.cellRight, { flex: 2, fontWeight: 'black', color: '#16a34a', backgroundColor: '#f0fdf4' }]}>
                    {fNum(membre.solde)} Ar
                    </Text>
                </View>
                </View>
            </View>
            ))}

            {/* TOTAL GLOBAL À LA FIN DU GRAND LIVRE */}
            <View style={{ marginTop: 20, padding: 10, borderTopWidth: 2, borderTopColor: '#16a34a', backgroundColor: '#f0fdf4' }}>
            <Text style={{ textAlign: 'right', fontSize: 12, fontWeight: 'bold', color: '#16a34a' }}>
                SOLDE GLOBAL GÉNÉRAL : {fNum(data.reduce((sum, m) => sum + (Number(m.solde) || 0), 0))} Ar
            </Text>
            </View>
    </Page>
    )}
  </Document>
);

const GrandLivrePage = () => {
    const axiosPrivate = useAxiosPrivate();
    const [exercices, setExercices] = useState([]);
    const [membres, setMembres] = useState([]);
    const [selectedEx, setSelectedEx] = useState('');
    const [selectedMembre, setSelectedMembre] = useState(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentExerciceLabel, setCurrentExerciceLabel] = useState('');

    // État pour le volet des détails
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    const [openExport, setOpenExport] = useState(false);
    const [exportOptions, setExportOptions] = useState({ balance: true, grandLivre: false });
    const [showComponent, setShowComponent] = useState(false);

    const { auth } = useAuth();
    
    const decoded = auth?.accessToken
        ? jwtDecode(auth.accessToken)
        : undefined

    const roles = decoded.UserInfo.roles;
    const userId = decoded.UserInfo.userId || null;

    useEffect(() =>{
        if([3355, 5150].includes(roles)){
            setShowComponent(true);
        }
    },[roles]);

    const fNum = (v) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(v || 0);

    useEffect(() => {
        const init = async () => {
            try {
                const [re, rm] = await Promise.all([
                    axiosPrivate.get('/api/exercices'),
                    axiosPrivate.get('/api/membres')
                ]);
                setExercices(re.data);
                setMembres(rm.data);
                if (re.data.length > 0) setSelectedEx(re.data[0].id);
                getFullExerciceLabel();
            } catch (e) { console.error(e); }
        };
        init();
    }, [axiosPrivate]);

    useEffect(() => {
        if (selectedEx) {
            setLoading(true);
            const params = { exerciceId: selectedEx };
            if (selectedMembre) params.membreId = selectedMembre.id;
            axiosPrivate.get(`/api/compta/grand-livre`, { params })
                .then(res => setRows(res.data))
                .finally(() => setLoading(false));
        }
    }, [selectedEx, selectedMembre, axiosPrivate]);

    const handleOpenDetail = (row) => {
        setSelectedRow(row);
        setDetailOpen(true);
    };

    const columns = [
        { field: 'matricule', headerName: 'Matricule', width: 90 },
        { 
            field: 'nom', 
            headerName: 'MEMBRE', 
            flex: 1, 
            renderCell: (p) => <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{`${p.row.nom} ${p.row.prenom}`}</Typography>
        },
        { 
            field: 'soldeInitial', 
            headerName: 'REPORT (AN)', 
            width: 130, 
            align: 'right', 
            headerAlign: 'right',
            renderCell: (p) => (
                <Typography sx={{ fontSize: '0.8rem', color: '#64748B', fontStyle: 'normal' }}>
                    {fNum(p.value)}
                </Typography>
            )
        },
        { field: 'totalDebit', headerName: 'DÉBIT', width: 130, align: 'right', headerAlign: 'right', renderCell: (p) => fNum(p.value) },
        { field: 'totalCredit', headerName: 'CRÉDIT', width: 130, align: 'right', headerAlign: 'right', renderCell: (p) => fNum(p.value) },
        { 
            field: 'solde', 
            headerName: 'SOLDE', 
            width: 150, 
            align: 'right', 
            headerAlign: 'right',
            renderCell: (p) => (
                <Typography sx={{ fontWeight: 800, color: p.value < 0 ? '#e11d48' : '#059669', fontSize: '0.85rem' }}>
                    {fNum(p.value)}
                </Typography>
            )
        },
        {
            field: 'actions',
            headerName: 'DÉTAILS',
            width: 100,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (p) => (
                <Button 
                    size="small" 
                    startIcon={<VisibilityIcon />} 
                    onClick={() => handleOpenDetail(p.row)}
                    sx={{ textTransform: 'none', fontSize: '0.7rem', fontWeight: 700 }}
                >
                    Voir
                </Button>
            )
        }
    ];

    //calcul total par colonne du tableau
    const calculateTotal_report = () => {
        const currentRows = rows;
        return currentRows.reduce((sum, row) => {
       
        const val = row.soldeInitial;
        return sum + (Number(val) || 0);
        }, 0);
    };

    const calculateTotal_totalDebit = () => {
        const currentRows = rows;
        return currentRows.reduce((sum, row) => {
       
        const val = row.totalDebit;
        return sum + (Number(val) || 0);
        }, 0);
    };

    const calculateTotal_totalCredit = () => {
        const currentRows = rows;
        return currentRows.reduce((sum, row) => {
       
        const val = row.totalCredit;
        return sum + (Number(val) || 0);
        }, 0);
    };

    const calculateTotal_solde = () => {
        const currentRows = rows;
        return currentRows.reduce((sum, row) => {
       
        const val = row.solde;
        return sum + (Number(val) || 0);
        }, 0);
    };

    //Export Excel
    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();

        if (exportOptions.balance) {
            // 1. Préparation des données de base
            const dataBalance = rows.map(r => ({
                'Matricule': r.matricule,
                'Membre': `${r.nom} ${r.prenom}`,
                'Report (AN)': Number(r.soldeInitial) || 0,
                'Débit': Number(r.totalDebit) || 0,
                'Crédit': Number(r.totalCredit) || 0,
                'Solde': Number(r.solde) || 0
            }));

            // 2. Calcul des totaux généraux (en utilisant tes fonctions de calcul existantes ou reduce)
            const totalReport = dataBalance.reduce((sum, item) => sum + item['Report (AN)'], 0);
            const totalDebit = dataBalance.reduce((sum, item) => sum + item['Débit'], 0);
            const totalCredit = dataBalance.reduce((sum, item) => sum + item['Crédit'], 0);
            const totalSolde = dataBalance.reduce((sum, item) => sum + item['Solde'], 0);

            // 3. Ajout de la ligne de total à la fin du tableau
            dataBalance.push({
                'Matricule': '',
                'Membre': 'TOTAL GÉNÉRAL',
                'Report (AN)': totalReport,
                'Débit': totalDebit,
                'Crédit': totalCredit,
                'Solde': totalSolde
            });

            const wsBalance = XLSX.utils.json_to_sheet(dataBalance);

            // 4. Mise en forme des colonnes pour un rendu "Pro"
            wsBalance['!cols'] = [
                { wch: 12 }, // Matricule
                { wch: 30 }, // Membre
                { wch: 15 }, // Report
                { wch: 15 }, // Débit
                { wch: 15 }, // Crédit
                { wch: 15 }  // Solde
            ];

            XLSX.utils.book_append_sheet(wb, wsBalance, "Balance");
        }

        if (exportOptions.grandLivre) {
            const dataGL = [];
            let totalGlobal = 0;

            rows.forEach(membre => {
                const reportVal = Number(membre.soldeInitial) || 0;

                // 1. Insertion du Report à Nouveau si != 0
                if (reportVal !== 0) {
                    dataGL.push({
                        'Membre': `${membre.nom} ${membre.prenom}`,
                        'Date': "", 
                        'Libellé': "REPORT À NOUVEAU",
                        'Référence': "AN",
                        'Débit': reportVal > 0 ? reportVal : 0,
                        'Crédit': reportVal < 0 ? Math.abs(reportVal) : 0,
                        'Solde': ""
                    });
                }

                // 2. Détails des opérations
                membre.details?.forEach(d => {
                    dataGL.push({
                        'Membre': `${membre.nom} ${membre.prenom}`,
                        'Date': d.date_op ? new Date(d.date_op).toLocaleDateString() : "",
                        'Libellé': d.libelle,
                        'Référence': d.reference || "",
                        'Débit': Number(d.debit) || 0,
                        'Crédit': Number(d.credit) || 0,
                        'Solde': ""
                    });
                });

                // 3. Ligne de Sous-Total Membre (Style Pro)
                dataGL.push({
                    'Membre': `TOTAL ${membre.nom}`,
                    'Date': "",
                    'Libellé': "--- SOUS-TOTAL ---",
                    'Référence': "",
                    'Débit': Number(membre.totalDebit) || 0,
                    'Crédit': Number(membre.totalCredit) || 0,
                    'Solde': Number(membre.solde) || 0
                });

                // 4. Ligne vide pour l'espacement
                dataGL.push({ 'Membre': "", 'Date': "", 'Libellé': "", 'Référence': "", 'Débit': null, 'Crédit': null, 'Solde': null });
                
                totalGlobal += (Number(membre.solde) || 0);
            });

            // 5. Ligne de clôture finale
            dataGL.push({
                'Membre': "SOLDE GLOBAL GÉNÉRAL",
                'Date': "",
                'Libellé': "",
                'Référence': "",
                'Débit': null,
                'Crédit': null,
                'Solde': totalGlobal
            });

            const wsGL = XLSX.utils.json_to_sheet(dataGL);

            // Ajustement de la largeur des colonnes pour un rendu "Pro"
            const wscols = [
                {wch: 30}, // Membre
                {wch: 12}, // Date
                {wch: 35}, // Libellé
                {wch: 15}, // Référence
                {wch: 15}, // Débit
                {wch: 15}, // Crédit
                {wch: 15}, // Solde
            ];
            wsGL['!cols'] = wscols;

            XLSX.utils.book_append_sheet(wb, wsGL, "Grand Livre");
        }

        // Génération du fichier sans formatage complexe pour éviter les erreurs "Fichier corrompu"
        XLSX.writeFile(wb, `Compta_Export_${new Date().getTime()}.xlsx`);
        setOpenExport(false);
    };

    //formatage date exercice
    const getFullExerciceLabel = () => {
        const ex = exercices.find(e => e.id === selectedEx);
        if (!ex) return "";

        const start = new Date(ex.date_debut).toLocaleDateString('fr-FR');
        const end = new Date(ex.date_fin).toLocaleDateString('fr-FR');
        setCurrentExerciceLabel(`${start} au ${end}`);

        return `${start} au ${end}`;
        
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
            <MyBreadcrumbs currentPath="Balance et Grand Livre" />

            <Stack direction={'row'}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#1b4332' }}>Balance et Grand Livre</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Gestion des soldes globaux ou par membre</Typography>
                </Box>

                <Box sx={{flex:1}}>

                </Box>

                <Box>
                    <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<SaveIcon />}
                        onClick={() => setOpenExport(true)}
                        sx={{ color: '#1d6f42', borderColor: '#1d6f42', fontWeight: 700, borderRadius: '10px', textTransform: 'none' }}
                    >
                        Télécharger
                    </Button>
                </Box>
            </Stack>
            

            {/* FILTRES AVEC LABELS AU-DESSUS */}
            <Stack direction="row" spacing={3} sx={{ mb: 4 }}>
                <Box sx={{ maxWidth: 400 }}>
                    <InputLabel sx={{ mb: 1, fontWeight: 700, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Exercice de référence</InputLabel>
                    <TextField select fullWidth size="small" value={selectedEx} onChange={(e) => setSelectedEx(e.target.value)} sx={{ bgcolor: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } }}>
                    {exercices.map(ex => (
                        <MenuItem key={ex.id} value={ex.id}>
                        {ex.libelle} : {new Date(ex.date_debut).toLocaleDateString('fr-FR')} - {new Date(ex.date_fin).toLocaleDateString('fr-FR')}
                        </MenuItem>
                    ))}
                    </TextField>
                </Box>

                <Box>
                    <InputLabel sx={{ mb: 1, fontWeight: 700, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CHOISIR UN MEMBRE</InputLabel>
                    <Autocomplete
                        options={[
                            ...(showComponent ? [{ id: 'all', nom: 'TOUS', prenom: 'LES MEMBRES' }] : []),
                            ...membres
                        ]}
                        getOptionLabel={(o) => `${o.nom} ${o.prenom}`}
                        value={selectedMembre}
                        onChange={(e, v) => setSelectedMembre(v)}
                        sx={{ mt: 0, width: 450, bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        renderInput={(params) => <TextField {...params} size="small" placeholder="Filtrer..." />}
                    />
                </Box>

                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-end', 
                    ml: 5, 
                    p: 1,
                    bgcolor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
                }}>
                    {/* DROITE : Les 4 Totaux */}
                    <Stack direction="row" spacing={4} sx={{ mb: 0 }}>
                        {[
                            { label: 'Total report (AN)', val: calculateTotal_report(), color: '#64748b' },
                            { label: 'Total Débit', val: calculateTotal_totalDebit(), color: '#64748b' },
                            { label: 'Total Crédit', val: calculateTotal_totalCredit(), color: '#64748b' },
                            { label: 'Total solde', val: calculateTotal_solde(), color: '#2563EB' }
                        ].map((item, index) => (
                            <Box key={index} sx={{ textAlign: 'right', minWidth: '120px' }}>
                                <Typography 
                                    variant="caption" 
                                    sx={{ 
                                        fontWeight: 800, 
                                        color: '#94a3b8', 
                                        display: 'block', 
                                        letterSpacing: '0.5px',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    {item.label}
                                </Typography>
                                <Typography 
                                    variant="body1" 
                                    sx={{ 
                                        fontWeight: 900, 
                                        fontSize: '1.15rem', 
                                        color: item.color,
                                        lineHeight: 1.2
                                    }}
                                >
                                    {fNum(item.val)}
                                    <span style={{ fontSize: '0.7rem', marginLeft: '4px', fontWeight: 600 }}>Ar</span>
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            </Stack>

            <DataGrid
                rows={rows}
                columns={columns}
                loading={loading}
                getRowId={(row) => row.membreId}
                density="compact"
                autoHeight
                sx={{
                    bgcolor: 'white',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    [`& .${gridClasses.columnHeader}`]: {
                        bgcolor: '#F1F5F9',
                        color: '#475569',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        textTransform: 'uppercase'
                    },
                    [`& .${gridClasses.cell}`]: { borderBottom: '1px solid #F1F5F9', fontSize: '0.8rem' },
                }}
            />

            {/* DRAWER LATÉRAL POUR LES DÉTAILS (LOOK SAAS) */}
            <Drawer
                anchor="right"
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                PaperProps={{ sx: { width: { xs: '100%', sm: 1000 }, p: 0 } }}
            >
                {selectedRow && (
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#0F172A', color: 'white' }}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>Détails des opérations</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8, fontSize:'0.9rem' }}>{selectedRow.nom} {selectedRow.prenom}</Typography>
                            </Box>
                            <IconButton onClick={() => setDetailOpen(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                        </Box>

                        <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
                            {selectedRow.details?.length > 0 ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ 
                                            textAlign: 'left', 
                                            color: '#64748B', 
                                            fontSize: '0.75rem', 
                                            borderBottom: '2px solid #E2E8F0',
                                            bgcolor: '#F8FAFC'
                                        }}>
                                            {/* RÉDUIRE LE PADDING ICI (de 12px à 5px) */}
                                            <th style={{ padding: '5px 8px' }}>DATE</th>
                                            <th style={{ padding: '5px 8px' }}>LIBELLÉ</th>
                                            <th style={{ padding: '5px 8px' }}>RÉFÉRENCE</th>
                                            <th style={{ textAlign: 'right', padding: '5px 8px' }}>DÉBIT</th>
                                            <th style={{ textAlign: 'right', padding: '5px 8px' }}>CRÉDIT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* --- LIGNE DE REPORT À NOUVEAU --- */}
                                        {selectedRow.soldeInitial !== 0 && (
                                            <tr style={{ backgroundColor: '#F1F5F9', fontSize: '0.85rem', fontWeight: 700 }}>
                                                <td style={{ padding: '3px 8px' }}>-</td>
                                                <td style={{ padding: '3px 8px' }}>REPORT À NOUVEAU</td>
                                                <td style={{ padding: '3px 8px' }}>
                                                    <Box sx={{ 
                                                        display: 'inline-block', 
                                                        bgcolor: '#475569', 
                                                        color: 'white', 
                                                        px: 1, 
                                                        py: 0.1, 
                                                        borderRadius: '3px', 
                                                        fontSize: '0.7rem' 
                                                    }}>
                                                        AN
                                                    </Box>
                                                </td>
                                                {/* Si positif -> Débit, si négatif -> Crédit (en valeur absolue) */}
                                                <td style={{ textAlign: 'right', padding: '3px 8px' }}>
                                                    {selectedRow.soldeInitial > 0 ? fNum(selectedRow.soldeInitial) : '-'}
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '3px 8px' }}>
                                                    {selectedRow.soldeInitial < 0 ? fNum(Math.abs(selectedRow.soldeInitial)) : '-'}
                                                </td>
                                            </tr>
                                        )}

                                        {selectedRow.details.map((m, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', fontSize: '0.85rem' }}>
                                                {/* RÉDUIRE LE PADDING ICI AUSSI (de 12px à 3px) */}
                                                <td style={{ padding: '3px 8px' }}>{new Date(m.date_op).toLocaleDateString()}</td>
                                                <td style={{ padding: '3px 8px' }}>{m.libelle}</td>
                                                <td style={{ padding: '3px 8px' }}>
                                                    {m.reference ? (
                                                        <Box sx={{ 
                                                            display: 'inline-block', 
                                                            bgcolor: '#E2E8F0', // Ton vert #abd8aa était peut-être trop flash, à toi de voir
                                                            color: '#0F172A', 
                                                            px: 1, 
                                                            py: 0.1, 
                                                            borderRadius: '3px', // Presque carré
                                                            fontSize: '0.7rem',
                                                            fontWeight: 700,
                                                            border: '1px solid #CBD5E1',
                                                            lineHeight: 1.2
                                                        }}>
                                                            {m.reference}
                                                        </Box>
                                                    ) : '-'}
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '3px 8px' }}>{m.debit > 0 ? fNum(m.debit) : '-'}</td>
                                                <td style={{ textAlign: 'right', padding: '3px 8px' }}>{m.credit > 0 ? fNum(m.credit) : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ backgroundColor: '#8bbaa3', borderTop: '2px solid #E2E8F0' }}>
                                            <td colSpan={3} style={{ padding: '8px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>
                                                SOLDE FINAL (REPORT INCLUS)
                                            </td>
                                            {/* Calcul cumulé : Mouvements + Report */}
                                            <td style={{ textAlign: 'right', padding: '8px', fontSize: '0.85rem', fontWeight: 900 }}>
                                                {fNum(selectedRow.totalDebit + (selectedRow.soldeInitial > 0 ? selectedRow.soldeInitial : 0))}
                                            </td>
                                            <td style={{ textAlign: 'right', padding: '8px', fontSize: '0.85rem', fontWeight: 900 }}>
                                                {fNum(selectedRow.totalCredit + (selectedRow.soldeInitial < 0 ? Math.abs(selectedRow.soldeInitial) : 0))}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            ) : (
                                <Typography sx={{ textAlign: 'center', mt: 10, color: '#94A3B8' }}>Aucun mouvement enregistré</Typography>
                            )}
                        </Box>
                        
                        <Divider />
                        <Box sx={{ p: 3, bgcolor: '#F8FAFC' }}>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography sx={{ fontWeight: 700 }}>SOLDE FINAL</Typography>
                                <Typography sx={{ fontWeight: 900, color: selectedRow.solde < 0 ? '#e11d48' : '#059669' }}>{fNum(selectedRow.solde)} Ar</Typography>
                            </Stack>
                        </Box>
                    </Box>
                )}
            </Drawer>

            {/* DIALOG CHOIX D'EXPORT */}
            <Dialog open={openExport} onClose={() => setOpenExport(false)}>
                <DialogTitle sx={{ fontWeight: 800 }}>Options d'exportation Excel</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        Sélectionnez les feuilles à inclure dans votre fichier Excel :
                    </Typography>
                    <FormGroup>
                        <FormControlLabel 
                            control={<Checkbox checked={exportOptions.balance} onChange={(e) => setExportOptions({...exportOptions, balance: e.target.checked})} />} 
                            label="Feuille 'Balance' (Résumé par membre)" 
                        />
                        <FormControlLabel 
                            control={<Checkbox checked={exportOptions.grandLivre} onChange={(e) => setExportOptions({...exportOptions, grandLivre: e.target.checked})} />} 
                            label="Feuille 'Grand Livre' (Détails de toutes les opérations)" 
                        />
                    </FormGroup>
                </DialogContent>
                <DialogActions sx={{ p: 3, justifyContent: 'space-between', borderTop: '1px solid #e2e8f0' }}>
                    <Button 
                        onClick={() => setOpenExport(false)} 
                        sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}
                    >
                        Annuler
                    </Button>
                    
                    <Stack direction="row" spacing={2}>
                        {/* BOUTON EXCEL */}
                        <Button 
                            variant="contained" 
                            onClick={handleExportExcel} 
                            sx={{ 
                                bgcolor: '#1b4332', 
                                '&:hover': { bgcolor: '#143326' },
                                textTransform: 'none',
                                fontWeight: 700
                            }}
                        >
                            Générer Excel
                        </Button>

                        {/* BOUTON PDF (Lien de téléchargement) */}
                        <PDFDownloadLink
                            document={
                                <ExportPDFDocument 
                                    data={rows} 
                                    options={exportOptions} 
                                    exerciceLabel={currentExerciceLabel} 
                                />
                            }
                            fileName={`Export_Compta_${currentExerciceLabel}.pdf`}
                            style={{ textDecoration: 'none' }}
                        >
                            {({ loading }) => (
                                <Button 
                                    variant="contained" 
                                    sx={{ 
                                        bgcolor: '#e11d48', 
                                        '&:hover': { bgcolor: '#be123c' },
                                        textTransform: 'none',
                                        fontWeight: 700
                                    }} 
                                    disabled={loading || (!exportOptions.balance && !exportOptions.grandLivre)}
                                    // On ferme la popup après un court délai pour laisser le téléchargement se lancer
                                    onClick={() => setTimeout(() => setOpenExport(false), 1000)}
                                >
                                    {loading ? 'Traitement...' : 'Générer PDF'}
                                </Button>
                            )}
                        </PDFDownloadLink>
                    </Stack>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default GrandLivrePage;
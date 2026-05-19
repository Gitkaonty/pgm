import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Stack, TextField, MenuItem,
  Button, Chip, CircularProgress, InputLabel, IconButton,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Tabs, Tab, Grid, Divider,
  Breadcrumbs,
  Link,
  Autocomplete,
  Badge
} from '@mui/material';
import { DataGrid, GridFooterContainer, GridPagination, useGridApiContext, GridToolbar, GridFooter } from '@mui/x-data-grid';
import toast, { Toaster } from 'react-hot-toast';
import useAxiosPrivate from '../../../config/axiosPrivate';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';
import TicketNotePDF from './TicketNotePDF';
import { pdf } from '@react-pdf/renderer';
import ExportAppelPDF from './AppelTableauPDF';

// Imports Icons
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggestOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/SaveOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HistoryIcon from '@mui/icons-material/History';
import { HomeOutlined, LocalPrintshopOutlined, NavigateNext } from '@mui/icons-material';
import XLSX from 'xlsx-js-style';
import EmailIcon from '@mui/icons-material/Email';
import SendEmailModal from './PaiementSendMail';
import ConfirmSingleModal from '../../components/ConfirmSingleEmailModal';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import { URL } from '../../../config/axios';

// const styles = StyleSheet.create({
//   page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#334155' },
//   // EN-TETE
//   headerContainer: { flexDirection: 'row', justifyContent: 'spaceBetween', marginBottom: 30, borderBottomWidth: 2, borderBottomColor: '#1b4332', pb: 10 },
//   logoSection: { flexDirection: 'row', alignItems: 'center' },
//   logoPlaceholder: { width: 50, height: 50, backgroundColor: '#f1f5f9', marginRight: 10 }, // À remplacer par src={logoOECFM}
//   headerText: { flexDirection: 'column' },
//   oecfmTitle: { fontSize: 18, fontWeight: 'bold', color: '#1b4332', letterSpacing: 1 },
//   oecfmSubtitle: { fontSize: 9, color: '#64748b', marginTop: 2 },
//   logoImage: {
//     width: 50,
//     height: 50,
//     marginRight: 10,
//     // On peut ajouter objectFit pour éviter les déformations
//     objectFit: 'contain'
//   },

//   // INFOS DOCUMENT
//   docInfo: { marginBottom: 20, marginLeft: 150, textAlign: 'right' },
//   title: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', color: '#1e293b' },
//   exercice: { fontSize: 10, color: '#475569', marginTop: 4 },

//   // TABLEAU
//   table: { display: "table", width: "100%", borderStyle: "solid", marginTop: 10 },
//   tableRow: { flexDirection: "row", borderBottomColor: '#e2e8f0', borderBottomWidth: 0.5, minHeight: 22, alignItems: 'center' },
//   tableColHeader: { backgroundColor: '#1b4332', color: '#ffffff', fontWeight: 'bold', borderBottomWidth: 0 },
//   tableCell: { padding: 4, fontSize: 7 },

//   // Alignements et Largeurs
//   col1: { width: '8%' }, // Matr
//   col2: { width: '32%' }, // Nom/Prenom
//   col3: { width: '15%' }, // Section
//   col4: { width: '15%', textAlign: 'right' }, // Montant
//   col5: { width: '15%', textAlign: 'right' }, // Ajust
//   col6: { width: '15%', textAlign: 'right', fontWeight: 'bold' }, // Net

//   colMatricule: { width: '6%' },
//   colNom: { width: '22%' },
//   colSection: { width: '10%' },
//   colStatut: { width: '10%' },
//   colTitre: { width: '8%' },
//   colAssocies: { width: '8%' },
//   colRegime: { width: '8%' },
//   colMontant: { width: '9%', textAlign: 'right' },
//   colAjust: { width: '9%', textAlign: 'right' },
//   colNet: { width: '10%', textAlign: 'right', fontWeight: 'bold' },

//   // Footer spécifique : on cumule les largeurs des 7 premières colonnes (6+22+10+10+8+8+8 = 72%)
//   footerLabel: { width: '72%', fontWeight: 'bold', textAlign: 'right', color: '#1b4332', paddingRight: 10 }
// });

const MyBreadcrumbs = ({ currentPath }) => (
  <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
    <Link underline="hover" color="inherit" href="/dashboard" sx={{ display: 'flex', alignItems: 'center' }}>
      <HomeOutlined sx={{ mr: 0.5, fontSize: 20 }} /> Dashboard
    </Link>
    <Typography color="text.primary" sx={{ fontWeight: 600 }}>{currentPath}</Typography>
  </Breadcrumbs>
);

const renderBadge = (params, colorMap) => {
  if (!params.value) return '';
  const color = colorMap[params.value] || '#757575';
  return (
    <Chip
      label={params.value}
      size="small"
      sx={{
        bgcolor: `${color}15`,
        color: color,
        fontWeight: 700,
        fontSize: '0.7rem',
        borderRadius: '6px',
        border: `1px solid ${color}30`,
        height: 20
      }}
    />
  );
};

const AppelCotisation = () => {
  const axiosPrivate = useAxiosPrivate();
  const [tabValue, setTabValue] = useState(0);
  const [exercices, setExercices] = useState([]);
  const [selectedEx, setSelectedEx] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [rows, setRows] = useState([]);
  const [rowsAjustement, setRowsAjustement] = useState([]);

  const [openAjustConfirm, setOpenAjustConfirm] = useState(false);
  const [membres, setMembres] = useState([]);
  const [formAjust, setFormAjust] = useState({
    motif: '',
    montant: 0,
    section: 'Toutes',
    titre: 'Toutes',
    statut: 'Toutes',
    membre: 'Tous'
  });

  const [openConfirm, setOpenConfirm] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [openGenConfirm, setOpenGenConfirm] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [historyTarget, setHistoryTarget] = useState('');

  const [singleModalOpen, setSingleModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    color: 'primary'
  });

  const [orderInfo, setOrderInfo] = useState({});
  const [loading, setLoading] = useState(false);

  const formatNumber = (val) => {
    if (!val) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  useEffect(() => {
    const fetchDataInit = async () => {
      try {
        const resEx = await axiosPrivate.get('/api/exercices');
        setExercices(resEx.data);
        //setMembres(resMem.data);
        if (resEx.data.length > 0) setSelectedEx(resEx.data[0].id);

        const response = await axiosPrivate.get(`/api/membres/${resEx.data[0].date_fin}/active`);
        setMembres(response.data);
      } catch (err) { toast.error("Erreur chargement données"); }
    };
    fetchDataInit();
    fetchSettings();
  }, [axiosPrivate]);

  useEffect(() => {
    const fetchDataInit = async () => {
      try {
        const ex = exercices.find(e => e.id === selectedEx);
        if (!ex) return "";

        const response = await axiosPrivate.get(`/api/membres/${ex.date_fin}/active`);
        setMembres(response.data);
      } catch (err) { toast.error("Erreur chargement données"); }
    };
    fetchDataInit();
    fetchSettings();
  }, [selectedEx]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedEx) return;
      setLoadingData(true);
      try {
        const endpoint = tabValue === 0 ? `/api/cotisations/exercice/${selectedEx}` : `/api/cotisations/ajustements/${selectedEx}`;
        const res = await axiosPrivate.get(endpoint);
        if (tabValue === 0) setRows(res.data);
        else setRowsAjustement(res.data);
      } catch (err) { } finally { setLoadingData(false); }
    };
    fetchData();
    fetchSettings();
  }, [selectedEx, tabValue, axiosPrivate]);

  //récupération infos signataire
  const fetchSettings = async () => {
    try {
      const res = await axiosPrivate.get('/api/settings-ordre');
      if (res.data) setOrderInfo(res.data);

    } catch (err) {
    }
  };

  const handleGenerateClick = () => {
    if (!selectedEx) return toast.error("Sélectionnez un exercice");
    if (tabValue === 0) setOpenGenConfirm(true);
    else setOpenAjustConfirm(true);
  };

  const confirmGenerate = async () => {
    setOpenGenConfirm(false);
    setGenerating(true);
    try {
      await axiosPrivate.post('/api/cotisations/generate-appels', { exerciceId: selectedEx });
      const res = await axiosPrivate.get(`/api/cotisations/exercice/${selectedEx}`);
      setRows(res.data);
      toast.success("Génération réussie !");
    } catch (err) { toast.error("Erreur lors du calcul"); } finally { setGenerating(false); }
  };

  // Nouvelle fonction pour l'appel manuel basé sur les filtres
  const confirmAppelManuel = async () => {
    setOpenAjustConfirm(false);
    setGenerating(true);
    try {
      // 1. On stocke la réponse du serveur dans une variable 'resAppel'
      const resAppel = await axiosPrivate.post('/api/cotisations/generate-appels-manuels', {
        exerciceId: selectedEx,
        ...formAjust
      });

      // 2. On rafraîchit les données du tableau
      const res = await axiosPrivate.get(`/api/cotisations/exercice/${selectedEx}`);
      setRows(res.data);

      // 3. MODIFICATION : On utilise le message du backend
      // Si le backend renvoie "3 créés (2 ignorés)", c'est ce qui s'affichera.
      toast.success(resAppel.data.message || "Appels manuels générés !");

    } catch (err) {
      // 4. On affiche aussi le vrai message d'erreur si le back en renvoie un spécifique
      toast.error(err.response?.data?.message || "Erreur génération");
    } finally {
      setGenerating(false);
    }
  };

  const confirmGenerateAjustement = async () => {
    setOpenAjustConfirm(false);
    setGenerating(true);
    try {
      await axiosPrivate.post('/api/cotisations/generate-ajustements', { exerciceId: selectedEx, ...formAjust });
      const res = await axiosPrivate.get(`/api/cotisations/ajustements/${selectedEx}`);
      setRowsAjustement(res.data);
      toast.success("Ajustements générés !");
    } catch (err) { toast.error("Erreur génération"); } finally { setGenerating(false); }
  };

  const toggleRowStatus = async (row) => {
    try {
      // 1. On informe le serveur du changement de statut (valide / brouillon)
      await axiosPrivate.patch(`/api/cotisations/status/${row.id}`, {
        valide: !row.valide,
        // On envoie le type au backend pour qu'il sache quelle table viser
        type: tabValue === 0 ? 'appels' : 'ajustements'
      });

      // 2. On détermine quelle URL appeler pour rafraîchir le tableau actuel
      const refreshUrl = tabValue === 0
        ? `/api/cotisations/exercice/${selectedEx}`
        : `/api/cotisations/ajustements/${selectedEx}`;

      const res = await axiosPrivate.get(refreshUrl);

      // 3. On met à jour le bon state selon l'onglet actif
      if (tabValue === 0) {
        setRows(res.data);
      } else {
        setRowsAjustement(res.data);
      }

      toast.success("Statut mis à jour");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la modification du statut");
    }
  };

  const handleSaveFinal = async () => {
    // 1. On identifie les données de l'onglet actif
    const currentRows = tabValue === 0 ? rows : rowsAjustement;

    // 2. On récupère uniquement les IDs des lignes non validées (brouillons)
    const ids = currentRows.filter(r => !r.valide).map(r => r.id);

    if (ids.length === 0) {
      return toast.error("Aucun brouillon à valider dans cet onglet");
    }

    try {
      // 3. On définit l'URL de validation globale selon l'onglet
      // Note : Assure-toi que '/api/cotisations/valider-ajustements' existe côté Backend
      const endpoint = tabValue === 0
        ? '/api/cotisations/valider-appels'
        : '/api/cotisations/valider-ajustements';

      await axiosPrivate.post(endpoint, { ids });

      toast.success("Toutes les lignes ont été validées !");

      // 4. On rafraîchit les données pour voir les changements (badges success)
      const refreshUrl = tabValue === 0
        ? `/api/cotisations/exercice/${selectedEx}`
        : `/api/cotisations/ajustements/${selectedEx}`;

      const res = await axiosPrivate.get(refreshUrl);

      if (tabValue === 0) {
        setRows(res.data);
      } else {
        setRowsAjustement(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la validation globale");
    }
  };

  const columns = [
    { field: 'matricule', headerName: 'Matricule', width: 90 },
    { field: 'nom', headerName: 'Nom', width: 250 },
    { field: 'prenom', headerName: 'Prénoms', width: 200 },
    { field: 'section', headerName: 'Section', width: 120, renderCell: (p) => renderBadge(p, { 'Expert Comptable': '#9c27b0', 'Société Expert': '#00838f' }) },
    { field: 'statut', headerName: 'Niveau', width: 120, renderCell: (p) => renderBadge(p, { 'Expert Comptable': '#0288d1', 'Expert Stagiaire': '#455a64' }) },
    { field: 'titre', headerName: 'Titre', width: 100, renderCell: (p) => renderBadge(p, { 'Tableau A': '#2e7d32', 'Tableau B': '#689f38' }) },
    {
      field: 'associe',
      headerName: 'Associés',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: (p) => (
        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#475569' }}>
          {p.value || 0}
        </Typography>
      )
    },
    {
      field: 'regime',
      headerName: 'Régime',
      width: 100,
      renderCell: (p) => (
        <Chip
          label={p.value === "1" ? "Réduit" : "Normal"}
          size="small"
          color={p.value === "1" ? "secondary" : "default"}
          sx={{ fontWeight: 700 }}
        />
      )
    },
    { field: 'num_note', headerName: 'Note référence', width: 210 },
    {
      field: tabValue === 0 ? 'montant' : 'montant_ajustement',
      headerName: 'Montant dû',
      width: 150,
      align: 'right',
      headerAlign: 'right',
      renderCell: (p) => (<Typography sx={{ fontWeight: 800, color: '#2d6a4f', fontSize: '0.85rem' }}> {new Intl.NumberFormat('fr-MG').format(p.value || 0)} Ar </Typography>)
    },
    {
      field: 'total_ajustement',
      headerName: 'total ajustements',
      width: 150,
      align: 'right',
      headerAlign: 'right',
      renderCell: (p) => (<Typography sx={{ fontWeight: 800, color: '#2d6a4f', fontSize: '0.85rem' }}> {new Intl.NumberFormat('fr-MG').format(p.value || 0)} Ar </Typography>)
    },
    {
      field: 'appelnet',
      headerName: 'total appel',
      width: 150,
      align: 'right',
      headerAlign: 'right',
      renderCell: (p) => (<Typography sx={{ fontWeight: 800, color: '#2d6a4f', fontSize: '0.85rem' }}> {new Intl.NumberFormat('fr-MG').format(p.value || 0)} Ar </Typography>)
    },
    {
      field: 'nb_envois',
      headerName: 'SUIVI MAIL',
      width: 110,
      headerAlign: 'center', // Aligne le titre au centre
      align: 'center',       // Aligne le contenu de la cellule au centre
      renderCell: (params) => (
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%'
        }}>
          <IconButton
            size="small"
            onClick={() => handleShowEmailHistory(params.row)}
            sx={{ padding: '4px' }} // Réduit le padding pour que le badge reste bien centré
          >
            <Badge
              badgeContent={params.value}
              color="primary"
              slotProps={{ badge: { style: { fontSize: '0.65rem', height: '16px', minWidth: '16px' } } }}
            >
              <EmailIcon
                fontSize="small"
                sx={{ color: params.value > 0 ? '#2563EB' : '#94a3b8' }}
              />
            </Badge>
          </IconButton>
        </Box>
      )
    },
    { field: 'valide', headerName: 'État', width: 100, renderCell: (p) => (<Chip label={p.value ? "Validé" : "Brouillon"} size="small" color={p.value ? "success" : "warning"} variant="outlined" sx={{ fontWeight: 700 }} />) },
    {
      field: 'actions', headerName: 'Actions', width: 175, sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => toggleRowStatus(params.row)} color={params.row.valide ? "warning" : "success"}>
            {params.row.valide ? <HistoryIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
          </IconButton>

          {tabValue === 0 ? <IconButton
            disabled={!params.row.valide}
            onClick={() => {
              setSelectedRow(params.row); // On capture la ligne (id, nom, prenom)
              setSingleModalOpen(true);   // On ouvre le popup
            }}
          >
            <ForwardToInboxIcon sx={{ color: '#2563EB', fontSize: '20px' }} />
          </IconButton>
            : null}

          {/* Bouton Impression Ticket */}
          {tabValue === 0 ?
            <IconButton
              size="small"
              sx={{ color: '#1b4332' }}
              title="Imprimer le ticket"
              onClick={() => handlePrintNote(params.row)}
            >
              {loading ? <CircularProgress size={16} /> : <LocalPrintshopOutlined fontSize="small" />}
            </IconButton>
            : null}

          <IconButton size="small" color="error" onClick={() => { setRowToDelete(params.row); setOpenConfirm(true); }}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>
      )
    }
  ].filter(col =>
    tabValue === 0 ||
    (col.field !== 'regime' && col.field !== 'total_ajustement' && col.field !== 'appelnet' && col.field !== 'nb_envois')
  );

  const calculateTotal = () => {
    const currentRows = tabValue === 0 ? rows : rowsAjustement;
    return currentRows.reduce((sum, row) => {
      // Vérifie le nom exact du champ renvoyé par ton backend
      const val = tabValue === 0 ? row.montant : row.montant_ajustement;
      return sum + (Number(val) || 0);
    }, 0);
  };

  const calculateTotalAjustement = () => {
    const currentRows = tabValue === 0 ? rows : rowsAjustement;
    return currentRows.reduce((sum, row) => {
      // Vérifie le nom exact du champ renvoyé par ton backend
      const val = row.total_ajustement;
      return sum + (Number(val) || 0);
    }, 0);
  };

  const calculateTotalAppelNet = () => {
    const currentRows = tabValue === 0 ? rows : rowsAjustement;
    return currentRows.reduce((sum, row) => {
      // Vérifie le nom exact du champ renvoyé par ton backend
      const val = row.appelnet;
      return sum + (Number(val) || 0);
    }, 0);
  };

  //export Excel
  const handleExportExcel = () => {
    const currentRows = tabValue === 0 ? rows : rowsAjustement;
    const periode = getFullExerciceLabel();

    // --- CONFIGURATION DES STYLES ---
    const styleHeader = {
      fill: { fgColor: { rgb: "1B4332" } }, // Vert foncé OECFM
      font: { color: { rgb: "FFFFFF" }, bold: true, sz: 10 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } }
      }
    };

    const styleFooter = {
      fill: { fgColor: { rgb: "DCFCE7" } }, // Vert clair
      font: { bold: true, color: { rgb: "1B4332" } },
      alignment: { horizontal: "right" }
    };

    // Style numérique avec séparateur de milliers (Espace pour la localisation FR/MG)
    const styleCellNum = {
      numFmt: "#,##0",
      alignment: { horizontal: "right" },
      font: { sz: 10 }
    };

    const styleText = { font: { sz: 10 } };

    // --- CONSTRUCTION DES DONNÉES ---
    const wsData = [
      [{ v: "OECFM", s: { font: { bold: true, sz: 14, color: { rgb: "1B4332" } } } }],
      [{ v: "Ordre des Experts Comptables et Financiers de Madagascar", s: { font: { italic: true, sz: 10 } } }],
      [""],
      [{ v: tabValue === 0 ? "TABLEAU DES APPELS DE COTISATIONS" : "LISTE DES AJUSTEMENTS", s: { font: { bold: true, sz: 12 } } }],
      [`Période : ${periode}`],
      [""],
    ];

    // Entête du tableau avec TOUTES les colonnes
    const headerCols = [
      { v: "Matricule", s: styleHeader },
      { v: "Nom & Prénoms", s: styleHeader },
      { v: "Section", s: styleHeader },
      { v: "Statut", s: styleHeader },
      { v: "Titre", s: styleHeader },
      { v: "Associés", s: styleHeader },
      { v: "Régime", s: styleHeader },
      { v: tabValue === 0 ? "Cotisation" : "Montant", s: styleHeader },
      ...(tabValue === 0 ? [
        { v: "Ajustements", s: styleHeader },
        { v: "Appel Net", s: styleHeader }
      ] : [])
    ];
    wsData.push(headerCols);

    // Lignes de données
    currentRows.forEach(row => {
      const rowLine = [
        { v: row.matricule, s: styleText },
        { v: `${row.nom} ${row.prenom}`, s: styleText },
        { v: row.section, s: styleText },
        { v: row.statut, s: styleText },
        { v: row.titre || "-", s: styleText },
        { v: row.associe || "-", s: styleText },
        { v: row.regime === "1" ? "Réduit" : row.regime === "0" ? "Normal" : "-", s: styleText },
        // Valeurs numériques converties en Float pour calculs
        { v: parseFloat(tabValue === 0 ? row.montant : row.montant_ajustement) || 0, s: styleCellNum }
      ];

      if (tabValue === 0) {
        rowLine.push({ v: parseFloat(row.total_ajustement) || 0, s: styleCellNum });
        rowLine.push({ v: parseFloat(row.appelnet) || 0, s: styleCellNum });
      }
      wsData.push(rowLine);
    });

    // --- LIGNE DE TOTAL (FOOTER) ---
    const totalCot = currentRows.reduce((sum, r) => sum + parseFloat(tabValue === 0 ? r.montant : r.montant_ajustement || 0), 0);
    const totalAjust = currentRows.reduce((sum, r) => sum + parseFloat(r.total_ajustement || 0), 0);
    const totalNet = currentRows.reduce((sum, r) => sum + parseFloat(r.appelnet || 0), 0);

    // On aligne le "TOTAL GÉNÉRAL" sous la colonne Statut
    const footerRow = [
      { v: "", s: styleFooter }, { v: "", s: styleFooter }, { v: "", s: styleFooter },
      { v: "", s: styleFooter }, { v: "", s: styleFooter }, { v: "", s: styleFooter },
      { v: "TOTAL GÉNÉRAL", s: styleFooter },
      { v: totalCot, s: { ...styleFooter, ...styleCellNum } }
    ];

    if (tabValue === 0) {
      footerRow.push({ v: totalAjust, s: { ...styleFooter, ...styleCellNum } });
      footerRow.push({ v: totalNet, s: { ...styleFooter, ...styleCellNum } });
    }
    wsData.push(footerRow);

    // --- GÉNÉRATION DU FICHIER ---
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Largeur des colonnes adaptée
    ws['!cols'] = [
      { wch: 10 }, { wch: 35 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 18 },
      { wch: 18 }, { wch: 18 }
    ];

    // Fusions pour l'en-tête institutionnel
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Appel Cotisation");
    XLSX.writeFile(wb, `OECFM_Export_appel_cotisation.xlsx`);
  };

  //formatage date exercice
  const getFullExerciceLabel = () => {
    const ex = exercices.find(e => e.id === selectedEx);
    if (!ex) return "";

    const start = new Date(ex.date_debut).toLocaleDateString('fr-FR');
    const end = new Date(ex.date_fin).toLocaleDateString('fr-FR');

    return `${start} au ${end}`;
  };

  //export PDF du ticket de caisse
  // const TicketNotePDF = ({ row, exercice }) => {
  //   // Fonction pour extraire "AAAA - AAAA"
  //   const [anouveau, setAnouveau] = useState(0);
  //   const [recuAnnee, setRecuAnnee] = useState(0);
  //   const [totalAPayer, setTotalAPayer] = useState(0);

  //   const data = Array.isArray(orderInfo) ? orderInfo[0] : orderInfo;
  //   const url = URL;

  //   // On utilise l'accession sécurisée
  //   const nom_tresorier = data?.noms_signataires?.["Trésorier"] || "Nom inconnu";
  //   const nom_vice_president_admin = data?.noms_signataires?.["Vice-Président Administratif"] || "Nom inconnu";

  //   const formatExercice = () => {
  //     const ex = exercice.find(e => e.id === selectedEx);
  //     if (!ex) return "";
  //     const start = new Date(ex.date_debut).getFullYear();
  //     const end = new Date(ex.date_fin).getFullYear();
  //     return `${start} - ${end}`;
  //   }

  //   const formatExerciceLong = (liaison) => {
  //     const ex = exercice.find(e => e.id === selectedEx);
  //     if (!ex) return "";
  //     const start = new Date(ex.date_debut).getFullYear();
  //     const end = new Date(ex.date_fin).getFullYear();
  //     return `${new Date(ex.date_debut).toLocaleDateString('fr-FR')} ${liaison} ${new Date(ex.date_fin).toLocaleDateString('fr-FR')}`;
  //   }

  //   const fetchSynthese = async () => {
  //     // Condition : exercice et membre doivent être sélectionnés

  //     if (selectedEx && row.membre_id) {
  //       const ex = exercices.find(e => e.id === selectedEx);
  //       if (!ex) return "";

  //       try {
  //         const response = await axiosPrivate.get('/api/cotisations/synthese-appel', {
  //           params: {
  //             membreId: row.membre_id,
  //             exerciceId: selectedEx,
  //             // On récupère la date_debut depuis l'objet exercice sélectionné
  //             dateDebut: ex.date_debut
  //           }
  //         });

  //         const { soldeAnouveau, paiementRecuAnnee } = response.data;

  //         setTotalAPayer(soldeAnouveau - paiementRecuAnnee + row.appelnet);
  //         setAnouveau(soldeAnouveau);
  //         setRecuAnnee(paiementRecuAnnee);
  //       } catch (error) {
  //         toast.error("Erreur lors de la récupération du solde");
  //       }
  //     }
  //   };

  //   fetchSynthese();

  //   const nombreEnLettres = (valeurEntrante) => {
  //     const nb = Math.abs(parseInt(valeurEntrante, 10));

  //     const unites = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  //     const dizaines = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];

  //     if (isNaN(nb)) return "";
  //     if (nb === 0) return "zéro";

  //     const conv = (n) => {
  //       if (n < 10) return unites[n];

  //       if (n < 20) {
  //         const exceptions = { 10: "dix", 11: "onze", 12: "douze", 13: "treize", 14: "quatorze", 15: "quinze", 16: "seize" };
  //         return exceptions[n] || "dix-" + unites[n - 10];
  //       }

  //       if (n < 100) {
  //         const d = Math.floor(n / 10);
  //         const r = n % 10;
  //         if (d === 7) return "soixante-" + (r === 1 ? "et-onze" : conv(10 + r));
  //         if (d === 9) return "quatre-vingt-" + conv(10 + r);
  //         const liaison = (r === 1 && d < 8) ? " et " : "-";
  //         return dizaines[d] + (r === 0 ? "" : liaison + unites[r]);
  //       }

  //       if (n < 1000) {
  //         const c = Math.floor(n / 100);
  //         const r = n % 100;
  //         const centStr = c === 1 ? "cent" : unites[c] + " cent";
  //         return (centStr + " " + conv(r)).trim();
  //       }

  //       if (n < 1000000) {
  //         const m = Math.floor(n / 1000);
  //         const r = n % 1000;
  //         const milleStr = m === 1 ? "mille" : conv(m) + " mille";
  //         return (milleStr + " " + conv(r)).trim();
  //       }

  //       // NOUVEAU : Gestion des Millions
  //       if (n < 1000000000) {
  //         const mil = Math.floor(n / 1000000);
  //         const r = n % 1000000;
  //         const millionStr = mil === 1 ? "un million" : conv(mil) + " millions";
  //         return (millionStr + " " + conv(r)).trim();
  //       }

  //       // NOUVEAU : Gestion des Milliards
  //       if (n < 1000000000000) {
  //         const mrd = Math.floor(n / 1000000000);
  //         const r = n % 1000000000;
  //         const milliardStr = mrd === 1 ? "un milliard" : conv(mrd) + " milliards";
  //         return (milliardStr + " " + conv(r)).trim();
  //       }

  //       return n.toString();
  //     };

  //     return conv(nb).trim().toLowerCase().replace(/\s+/g, ' ');
  //   };

  //   const fNum = (val) => {
  //     if (val === undefined || val === null) return "0";

  //     // 1. On convertit en entier pour enlever les virgules si besoin
  //     // 2. On utilise une regex pour ajouter un espace tous les 3 chiffres
  //     return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  //   };

  //   return (
  //     <Document>
  //       <Page size="A4" style={{ padding: 40, fontSize: 10, fontFamily: 'Helvetica' }}>
  //         {/* Header avec Logo (Placeholder) */}
  //         <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
  //           {/* LOGO à gauche */}
  //           <View style={{ width: 100, height: 100, backgroundColor: 'transparent', borderRadius: 30 }} >
  //             <Image
  //               style={{ width: 100, height: 100, marginRight: 10, objectFit: 'contain' }}
  //               src="/logo500.png" // Assure-toi que le nom du fichier est exact
  //             />
  //           </View>

  //           {/* BLOC TEXTE à droite */}
  //           <View style={{ marginLeft: 0, marginBottom: 0 }}>
  //             <View style={{
  //               flex: 1,               // Prend tout l'espace restant pour permettre l'alignement
  //               alignItems: 'flex-end' // Aligne le conteneur lui-même vers la droite
  //             }}>
  //               <Text style={{ fontSize: 8, textAlign: 'right' }}>
  //                 Régie par l'Ordonnance modifiée n°92-047 du 05/11/1992
  //               </Text>
  //               <Text style={{ fontSize: 8, textAlign: 'right' }}>
  //                 {data.adresse}
  //               </Text>
  //               <Text style={{ fontSize: 8, textAlign: 'right' }}>
  //                 8737 - ({data.boite_postale}) ANTANANARIVO - Tel : {data.telephone} - E-mail :{" "}
  //                 <Text style={{ color: "blue", textDecorationLine: "underline" }}>
  //                   {data.email}
  //                 </Text>
  //               </Text>
  //             </View>

  //             <View style={{ marginLeft: 0, marginBottom: 0 }}>
  //               {/* Première ligne */}
  //               <Text style={{ fontSize: 8 }}>
  //                 <Text style={{ textDecoration: 'underline' }}>Membre de :</Text>
  //                 {" "} - L'international Federation of Accountants (IFAC)
  //               </Text>

  //               <View style={{ marginLeft: 50, marginBottom: 10 }}>
  //                 {/* Deuxième ligne décalée vers le bas avec un petit marginTop */}
  //                 <Text style={{ fontSize: 8, marginTop: 4 }}>
  //                   - Pan African Federation of Accountants (PAFA)
  //                 </Text>
  //                 <Text style={{ fontSize: 8, marginTop: 4 }}>
  //                   - La Fédération Internationale Des Experts comptables Francophones (FIDEF)
  //                 </Text>
  //               </View>
  //             </View>
  //           </View>
  //         </View>

  //         <View style={{
  //           borderBottomColor: '#e2e8f0', // Couleur grise légère (style Pennylane)
  //           borderBottomWidth: 1,         // Épaisseur du trait
  //           marginTop: 10,                // Espace au-dessus
  //           marginBottom: 0,             // Espace en-dessous
  //           marginLeft: 20,              // Pour l'aligner avec vos textes décalés
  //           marginRight: 20               // Pour ne pas qu'il touche le bord droit
  //         }} />

  //         <Text style={{ textAlign: 'left', fontSize: 10, marginVertical: 5, textDecoration: 'none' }}>
  //           Antananarivo, le {new Date(row.date_appel).toLocaleDateString('fr-FR')}
  //         </Text>

  //         <Text style={{ textAlign: 'center', fontSize: 14, fontWeight: 'bold', marginVertical: 5, textDecoration: 'none' }}>
  //           NOTE {row.num_note} {row.valide ? "" : "(Non validée)"}
  //         </Text>

  //         <View style={{ marginBottom: 10, lineHeight: 0.85 }}>
  //           <Text>Adressé à: </Text>
  //           <Text>{row.nom} {row.prenom}</Text>
  //           <Text>{row.section}</Text>
  //           <Text>{row.titre} - Promotion : {row.promotion}</Text>
  //           <Text>Téléphone : {row.telephone}</Text>
  //         </View>

  //         {/* Tableau des règlements */}
  //         <View style={{ border: '1pt solid #000' }}>
  //           <View style={{ flexDirection: 'row', backgroundColor: '#f0fdf4', fontWeight: 'bold', borderBottom: '1pt solid #000', padding: 5 }}>
  //             <Text style={{ flex: 2 }}>Intitulé</Text>
  //             <Text style={{ flex: 1, textAlign: 'right' }}>Montant</Text>
  //           </View>
  //           {[
  //             { label: `Cotisation pour l'exercice ${formatExercice(exercice)}`, val: row.appelnet ? row.appelnet : 0 },
  //             { label: `Période de facturation du ${formatExerciceLong('au')}`, val: null },
  //           ].map((item, i) => (
  //             <View key={i} style={{ flexDirection: 'row', borderBottom: '0.5pt solid #eee', padding: 5 }}>
  //               <Text style={{ flex: 2 }}>{item.label}</Text>
  //               <Text style={{ flex: 1, textAlign: 'right' }}>{item.val === null ? "" : fNum(item.val)} Ar</Text>
  //             </View>
  //           ))}
  //           <View style={{ flexDirection: 'row', padding: 5, fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
  //             <Text style={{ flex: 2 }}>Montant total de la Note</Text>
  //             <Text style={{ flex: 1, textAlign: 'right' }}>{fNum(row.appelnet ? row.appelnet : 0)} Ar</Text>
  //           </View>
  //         </View>

  //         <Text style={{ marginTop: 5, fontStyle: 'italic' }}>
  //           Le montant total de la note est arrêté à {nombreEnLettres(row.appelnet ? row.appelnet : 0)} Ariary
  //         </Text>

  //         <Text style={{ marginTop: 20, textDecoration: 'underline' }}>
  //           Etat du compte:
  //         </Text>

  //         {/* Tableau des règlements II */}
  //         <View style={{ border: '1pt solid #000' }}>
  //           <View style={{ flexDirection: 'row', backgroundColor: '#f0fdf4', fontWeight: 'bold', borderBottom: '1pt solid #000', padding: 5 }}>
  //             <Text style={{ flex: 2 }}>Intitulé</Text>
  //             <Text style={{ flex: 1, textAlign: 'right' }}>Montant</Text>
  //           </View>
  //           {[
  //             { label: `Cotisation restant due sur les exercices précédents: `, val: anouveau },
  //             { label: `Paiement reçu entre le du ${formatExerciceLong('et le')}`, val: recuAnnee },
  //             { label: `Cotisation pour l'exercice ${formatExercice(exercice)}`, val: row.appelnet ? row.appelnet : 0 }
  //           ].map((item, i) => (
  //             <View key={i} style={{ flexDirection: 'row', borderBottom: '0.5pt solid #eee', padding: 5 }}>
  //               <Text style={{ flex: 2 }}>{item.label}</Text>
  //               <Text style={{ flex: 1, textAlign: 'right' }}>{fNum(item.val)} Ar</Text>
  //             </View>
  //           ))}
  //           <View style={{ flexDirection: 'row', padding: 5, fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
  //             <Text style={{ flex: 2 }}>Total à payer</Text>
  //             <Text style={{ flex: 1, textAlign: 'right' }}>{fNum(totalAPayer)} Ar</Text>
  //           </View>
  //         </View>

  //         <Text style={{ marginTop: 5, fontStyle: 'italic' }}>
  //           Arrêté à la somme de : {nombreEnLettres(totalAPayer ? totalAPayer : 0)} Ariary
  //         </Text>

  //         <View style={{ marginTop: 20, lineHeight: 1 }}>
  //           <Text style={{ textDecoration: 'underline' }}>Informations bancaires:</Text>
  //           <Text style={{ fontSize: 9, marginLeft: 20 }}>- 33- OECFM - n°00005 00002 209618 50200 72 - CABNI - Antsahavola - 101 - Antananarivo</Text>
  //           <Text style={{ fontSize: 9, marginLeft: 20 }}>- 34- OECFM - n°00012 01200 61005213011 13 - BGFI MADAGASCAR - Antsahavola - 101 - Antananarivo</Text>
  //         </View>

  //         {/* Signatures */}
  //         <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
  //           <View style={{ flexDirection: 'column', justifyContent: 'space-between', marginTop: 0, alignContent: 'center', alignItems: 'center' }}>
  //             <Text style={{ textAlign: 'center' }}>Le Trésorier</Text>
  //             {row.valide &&
  //               <Image
  //                 style={{ width: 100, height: 100, objectFit: 'contain' }}
  //                 src={`${url}/uploads/signatures/${data.sig_tresorier}`}
  //               />
  //             }
  //             <Text style={{ marginTop: row.valide ? 0 : 50, textAlign: 'center' }}>{nom_tresorier}</Text>
  //           </View>

  //           <View style={{ flexDirection: 'column', justifyContent: 'space-between', marginTop: 0, alignContent: 'center', alignItems: 'center' }}>
  //             <Text style={{ textAlign: 'center' }}>Le Vice-Président Administratif</Text>
  //             {row.valide &&
  //               <Image
  //                 style={{ width: 100, height: 100, objectFit: 'contain' }}
  //                 src={`${url}/uploads/signatures/${data.sig_vice_president_admin}`}
  //               />
  //             }
  //             <Text style={{ marginTop: row.valide ? 0 : 50, textAlign: 'center' }}>{nom_vice_president_admin}</Text>
  //           </View>
  //         </View>
  //       </Page>
  //     </Document>
  //   );
  // }

  const handlePrintNote = async (row) => {
    try {
      setLoading(true);
      // 1. On récupère les données de synthèse via l'API (une seule fois, au clic)
      const ex = exercices.find(e => e.id === selectedEx);
      const response = await axiosPrivate.get('/api/cotisations/synthese-appel', {
        params: {
          membreId: row.membre_id,
          exerciceId: selectedEx,
          dateDebut: ex.date_debut
        }
      });

      const { soldeAnouveau, paiementRecuAnnee } = response.data;
      const syntheseData = {
        anouveau: soldeAnouveau,
        recuAnnee: paiementRecuAnnee,
        totalAPayer: soldeAnouveau - paiementRecuAnnee + row.appelnet
      };

      // 2. On génère le PDF en mémoire
      const doc = (
        <TicketNotePDF
          row={row}
          exercice={exercices}
          selectedEx={selectedEx}
          orderInfo={orderInfo}
          synthese={syntheseData}
        />
      );

      // 3. On crée un Blob et on l'ouvre dans un nouvel onglet
      const blob = await pdf(doc).toBlob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setLoading(false);
    } catch (error) {
      console.error("Erreur impression:", error);
      toast.error("Impossible de générer le PDF");
    }
  };

  //export tableau Appel vers pdf
  const handlePrintAppelTable = async (rows, rowsAjustement, exerciceLabel, tabValue) => {
    try {
      setLoading(true);
      const doc = (
        <ExportAppelPDF
          data={tabValue === 0 ? rows : rowsAjustement}
          tabValue={tabValue}
          exerciceLabel={exerciceLabel}
        />
      );

      // 3. On crée un Blob et on l'ouvre dans un nouvel onglet
      const blob = await pdf(doc).toBlob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setLoading(false);
    } catch (error) {
      console.error("Erreur impression:", error);
      toast.error("Impossible de générer le PDF");
    }
  };

  //GESTION ENVOI MAIL==========================================================================================
  //ENVOI MAIL================================================================================================
  // --- COMPOSANT DE DIALOGUE GÉNÉRIQUE ---
  const ConfirmationDialog = () => (
    <Dialog
      open={confirmDialog.open}
      onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      PaperProps={{ sx: { borderRadius: '10px', p: 1 } }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>{confirmDialog.title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {confirmDialog.message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ pb: 2, px: 3 }}>
        <Button
          onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
          sx={{ color: '#64748b', textTransform: 'none' }}
        >
          Annuler
        </Button>
        <Button
          variant="contained"
          color={confirmDialog.color}
          onClick={() => {
            confirmDialog.onConfirm();
            setConfirmDialog({ ...confirmDialog, open: false });
          }}
          sx={{ textTransform: 'none', borderRadius: '6px', px: 3 }}
        >
          Confirmer
        </Button>
      </DialogActions>
    </Dialog>
  );


  const handleOpenEmail = (member = null) => {
    setCurrentMember(member); // Si null, ce sera "Tous les membres" par défaut
    setEmailModalOpen(true);
  };

  const handleSendBulk = async () => {
    // Appel à la nouvelle route bulk
    await handleSendMail('all');
  };

  const handleConfirmSingle = async () => {
    setIsSending(true); // 1. On active le chargement
    try {
      const ex = exercices.find(e => e.id === selectedEx);
      if (!ex) return "";

      // On utilise l'ID stocké quand on a cliqué sur l'icône
      await axiosPrivate.post(`/api/cotisations/${selectedRow.id}/send-email`, {
        dateFin: ex.date_fin
      });

      toast.success("Email envoyé avec succès !");
      setSingleModalOpen(false); // On ferme le popup

      // On rafraîchit le tableau
      if (!selectedEx) return;
      setLoadingData(true);
      try {
        const endpoint = tabValue === 0 ? `/api/cotisations/exercice/${selectedEx}` : `/api/cotisations/ajustements/${selectedEx}`;
        const res = await axiosPrivate.get(endpoint);
        if (tabValue === 0) setRows(res.data);
        else setRowsAjustement(res.data);
      } catch (err) { } finally { setLoadingData(false); }

    } catch (err) {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setIsSending(false); // 2. On désactive le chargement (qu'il y ait succès ou erreur)
    }
  };

  const handleSendMail = async (target) => {
    try {
      const ex = exercices.find(e => e.id === selectedEx);
      if (!ex) return "";

      // Définition de l'URL selon la cible
      const url = target === 'all'
        ? '/api/cotisations/send-email-bulk'
        : `/api/cotisations/${target}/send-email`;

      await axiosPrivate.post(url, {
        dateFin: ex.date_fin,
        appelsIds: target === 'all' ? rows.map(row => row.id) : null
      });

      toast.success(target === 'all' ? "Envois groupés terminés !" : "Email envoyé !");

      // On rafraîchit les données pour mettre à jour les badges (email_logs)
      if (!selectedEx) return;
      setLoadingData(true);
      try {
        const endpoint = tabValue === 0 ? `/api/cotisations/exercice/${selectedEx}` : `/api/cotisations/ajustements/${selectedEx}`;
        const res = await axiosPrivate.get(endpoint);
        if (tabValue === 0) setRows(res.data);
        else setRowsAjustement(res.data);
      } catch (err) { } finally { setLoadingData(false); }

    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'envoi");
    }
  };

  //affichage mail historique
  const handleShowEmailHistory = async (row) => {
    try {
      // Optionnel : afficher un loader si tu veux être très propre
      const response = await axiosPrivate.get(`/api/cotisations/${row.id}/email-logs`);

      // On stocke les logs récupérés
      setSelectedHistory(response.data);
      setHistoryTarget(`${row.nom} ${row.prenom}`);
      setHistoryModalOpen(true);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique :", error);
      toast.error("Impossible de charger l'historique des emails.");
    }
  };

  const fNum = (val) => {
    if (val === undefined || val === null) return "0";

    // 1. On convertit en entier pour enlever les virgules si besoin
    // 2. On utilise une regex pour ajouter un espace tous les 3 chiffres
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // 1. Le composant Footer personnalisé
  const CustomFooter = () => {
    const apiRef = useGridApiContext();

    // 1. On récupère l'état du filtrage directement
    const filterLookup = apiRef.current.state.filter.filteredRowsLookup;

    // 2. On récupère tous les IDs
    const allIds = apiRef.current.getAllRowIds();

    // 3. On ne garde que ceux qui sont à 'true' dans le lookup (ceux qui passent le filtre)
    // Si le lookup n'existe pas encore, on prend tout par défaut
    const visibleIds = filterLookup
      ? allIds.filter((id) => filterLookup[id] !== false)
      : allIds;

    // 4. On récupère les lignes pour le calcul
    const visibleRows = visibleIds.map((id) => apiRef.current.getRow(id));

    // Calculs
    const totalMontant = visibleRows.reduce((sum, row) => sum + (Number(row?.montant) || 0), 0);
    const totalAjust = visibleRows.reduce((sum, row) => sum + (Number(row?.total_ajustement) || 0), 0);
    const totalAppelNet = visibleRows.reduce((sum, row) => sum + (Number(row?.appelnet) || 0), 0);

    const totalAjustement = visibleRows.reduce((sum, row) => sum + (Number(row?.appelnet) || 0), 0);

    const fNum = (val) => new Intl.NumberFormat('fr-FR').format(val);

    return (
      <GridFooterContainer sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafb' }}>
        <Box sx={{ display: 'flex', gap: 3, ml: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1b4332' }}>
            TOTAL FILTRÉ :
          </Typography>
          <Typography variant="caption">
            Montant: <strong>{fNum(totalMontant)} Ar</strong>
          </Typography>
          <Typography variant="caption">
            Ajustement: <strong>{fNum(totalAjust)} Ar</strong>
          </Typography>
          <Typography variant="caption">
            Appel net: <strong>{fNum(totalAppelNet)} Ar</strong>
          </Typography>
        </Box>
        <GridFooter />
      </GridFooterContainer>
    );
  };

  const CustomFooterAjustement = () => {
    const apiRef = useGridApiContext();

    // 1. On récupère l'état du filtrage directement
    const filterLookup = apiRef.current.state.filter.filteredRowsLookup;

    // 2. On récupère tous les IDs
    const allIds = apiRef.current.getAllRowIds();

    // 3. On ne garde que ceux qui sont à 'true' dans le lookup (ceux qui passent le filtre)
    // Si le lookup n'existe pas encore, on prend tout par défaut
    const visibleIds = filterLookup
      ? allIds.filter((id) => filterLookup[id] !== false)
      : allIds;

    // 4. On récupère les lignes pour le calcul
    const visibleRows = visibleIds.map((id) => apiRef.current.getRow(id));

    // Calculs
    const totalMontant = visibleRows.reduce((sum, row) => sum + (Number(row?.montant_ajustement) || 0), 0);

    const fNum = (val) => new Intl.NumberFormat('fr-FR').format(val);

    return (
      <GridFooterContainer sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafb' }}>
        <Box sx={{ display: 'flex', gap: 3, ml: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1b4332' }}>
            TOTAL FILTRÉ :
          </Typography>
          <Typography variant="caption">
            Total ajustement: <strong>{fNum(totalMontant)} Ar</strong>
          </Typography>
        </Box>
        <GridFooter />
      </GridFooterContainer>
    );
  };


  return (
    <Box sx={{ p: 0, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Toaster position="top-right" />
      <MyBreadcrumbs currentPath="Appel cotisation" />
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1b4332' }}>Appel de Cotisations</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Gestion des appels et ajustements par exercice</Typography>

        <Stack direction={'row'} spacing={2}>
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

          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            mb: 3,
            p: 1,
            bgcolor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
          }}>
            {/* DROITE : Les 4 Totaux */}
            <Stack direction="row" spacing={4} sx={{ mb: 0.5 }}>
              {[
                { label: 'MONTANT DU', val: calculateTotal(), color: '#64748b' },

                // On utilise un tableau vide [] comme fallback pour que le spread ne plante pas
                ...(tabValue === 0 ? [{ label: 'AJUSTEMENTS', val: calculateTotalAjustement(), color: '#64748b' }] : []),

                ...(tabValue === 0 ? [{ label: 'APPEL NET', val: calculateTotalAppelNet(), color: '#2563EB' }] : []),
              ].map((item, index) => (
                <Box key={index} sx={{ textAlign: 'right', minWidth: '120px' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: '#94a3b8',
                      display: 'block',
                      letterSpacing: '0.5px',
                      fontSize: '0.7rem'
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

      </Box>

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} textColor="primary" indicatorColor="primary">
            <Tab label="Calcul Appel" sx={{ fontWeight: 700, textTransform: 'none' }} />
            <Tab label="Ajustements" sx={{ fontWeight: 700, textTransform: 'none' }} />
          </Tabs>
        </Box>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <SettingsSuggestIcon />}
            onClick={handleGenerateClick}
            disabled={generating}
            sx={{ bgcolor: '#2d6a4f', '&:hover': { bgcolor: '#1b4332' }, textTransform: 'none', fontWeight: 700, px: 3, borderRadius: '10px', boxShadow: 'none' }}
          >
            {tabValue === 0 ? "Génération automatique" : "Générer"}
          </Button>

          {tabValue === 0 && (
            <Button
              variant="outlined"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => setOpenAjustConfirm(true)}
              sx={{ color: '#2d6a4f', borderColor: '#2d6a4f', textTransform: 'none', fontWeight: 700, px: 3, borderRadius: '10px' }}
            >
              Appel manuel
            </Button>
          )}

          {tabValue === 0 && (
            <Button
              startIcon={<EmailIcon />}
              onClick={() => handleOpenEmail()}
              variant="outlined"
              sx={{ ml: 1 }}
            >
              Email groupé
            </Button>
          )}

          <Button
            size="small"
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={handleExportExcel}
            sx={{ color: '#1d6f42', borderColor: '#1d6f42', fontWeight: 700, borderRadius: '10px', textTransform: 'none' }}
          >
            Télécharger Excel
          </Button>
          <Button
            onClick={() => handlePrintAppelTable(rows, rowsAjustement, getFullExerciceLabel(), tabValue)}
            size="small"
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <LocalPrintshopOutlined />}
            sx={{ height: 35, color: '#b91c1c', borderColor: '#b91c1c', fontWeight: 700, borderRadius: '10px', textTransform: 'none' }}
          >
            Télécharger PDF
          </Button>

        </Stack>

        <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569' }}>{(tabValue === 0 ? rows.length : rowsAjustement.length)} Membres calculés</Typography>
            {(tabValue === 0 ? rows.length : rowsAjustement.length) > 0 && (
              <Button size="small" startIcon={<SaveIcon />} variant="contained" color="success" onClick={handleSaveFinal} sx={{ fontWeight: 700, borderRadius: '8px', px: 3, boxShadow: 'none' }}>Tout Valider (Définitif)</Button>
            )}
          </Box>
          <Box sx={{ height: '40vh', width: '100%' }}>
            <DataGrid
              rows={tabValue === 0 ? rows : rowsAjustement}
              columns={columns}
              loading={loadingData}
              // Ajoute ces options pour la pagination
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 5 },
                },
              }}
              pageSizeOptions={[5, 10, 25, 50, 100]}
              disableRowSelectionOnClick
              rowHeight={38}
              slots={{ toolbar: GridToolbar, footer: tabValue ===0? CustomFooter: CustomFooterAjustement }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true, // Affiche le champ de recherche
                  quickFilterProps: { debounceMs: 500 }, // Optionnel : attend 500ms avant de filtrer
                },
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafb', fontWeight: 800 },
                // Assure que la grille prend toute la hauteur pour afficher la pagination en bas
                height: '100%'
              }}
            />
          </Box>

          {/* FOOTER PERSONNALISÉ (Hors DataGrid) */}
          {/* <Box sx={{ 
            p: 2, 
            px: 3, 
            pr:tabValue === 0 ? 20 : 70,
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            bgcolor: '#f1f5f9', // Couleur légèrement bleutée/grise
            borderTop: '2px solid #e2e8f0' 
          }}>
            <Stack direction="row" spacing={0} alignItems="center">
              <Typography sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                Total
              </Typography>
              <Typography sx={{textAlign: 'right' , width:150, fontWeight: 900, color: '#1b4332', fontSize: '0.85rem', bgcolor: '#dcfce7', px: 2, py: 0.5, borderRadius: '8px' }}>
                {new Intl.NumberFormat('fr-MG').format(calculateTotal())} Ar
              </Typography>

              {tabValue === 0 ?
                <Stack direction="row" spacing={0} alignItems="center">
                  <Typography sx={{textAlign: 'right', width:150, fontWeight: 900, color: '#1b4332', fontSize: '0.85rem', bgcolor: '#dcfce7', px: 2, py: 0.5, borderRadius: '8px' }}>
                    {new Intl.NumberFormat('fr-MG').format(calculateTotalAjustement())} Ar
                  </Typography>
                  <Typography sx={{ textAlign: 'right', width:150, fontWeight: 900, color: '#1b4332', fontSize: '0.85rem', bgcolor: '#dcfce7', px: 2, py: 0.5, borderRadius: '8px' }}>
                    {new Intl.NumberFormat('fr-MG').format(calculateTotalAppelNet())} Ar
                  </Typography>
                </Stack>
                : null
              }
            </Stack>
          </Box> */}

        </Paper>
      </Box>

      {/* MODAL COMMUNE (AJUSTEMENT & APPEL MANUEL) */}
      <Dialog
        open={openAjustConfirm}
        onClose={() => setOpenAjustConfirm(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.2rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FilterListIcon sx={{ color: '#2d6a4f' }} />
          {tabValue === 0 ? "Génération Appel Manuel" : "Génération des ajustements"}
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ mb: 3, fontSize: '0.85rem' }}>
            Configurez les filtres pour cibler les membres concernés.
          </DialogContentText>

          <Grid container spacing={3}>
            {/* Champ Motif affiché seulement pour l'onglet Ajustement */}
            {tabValue === 1 && (
              <Grid item xs={12}>
                <InputLabel sx={{ mb: 0.5, fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Motif</InputLabel>
                <TextField
                  fullWidth type="text" size="small"
                  variant="outlined"
                  placeholder="Ex: Frais de dossier"
                  value={formAjust.motif}
                  onChange={(e) => setFormAjust({ ...formAjust, motif: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f1f5f9', border: 'none' } }}
                />
              </Grid>
            )}

            {tabValue === 1 && (
              <Grid item xs={12}>
                <InputLabel sx={{ mb: 0.5, fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Montant (Ar)</InputLabel>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  placeholder="Ex: -50 000"
                  // On affiche la valeur formatée
                  value={formatNumber(formAjust.montant)}
                  onChange={(e) => {
                    // 1. On récupère la valeur brute
                    const input = e.target.value;

                    // 2. On retire les espaces pour le stockage
                    const rawValue = input.replace(/\s/g, '');

                    // 3. Condition : On autorise si c'est un nombre valide OU si c'est juste un signe "-"
                    // (pour permettre à l'utilisateur de commencer à taper le signe négatif)
                    if (!isNaN(rawValue) || rawValue === '-' || rawValue === '') {
                      setFormAjust({ ...formAjust, montant: rawValue });
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', ml: 1 }}>
                        AR
                      </Typography>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#f1f5f9',
                      border: 'none',
                      fontWeight: 700,
                      // Optionnel : Changer la couleur si c'est négatif
                      color: formAjust.montant.toString().startsWith('-') ? '#e11d48' : 'inherit'
                    }
                  }}
                />
              </Grid>
            )}

            <Grid item xs={12}><Divider sx={{ opacity: 0.6 }}><Chip label="Filtres cibles" size="small" sx={{ fontSize: '0.65rem', fontWeight: 800 }} /></Divider></Grid>

            <Grid item xs={6}>
              <InputLabel sx={{ mb: 0.5, fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Section</InputLabel>
              <TextField select fullWidth size="small" value={formAjust.section} onChange={(e) => setFormAjust({ ...formAjust, section: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f1f5f9' } }}>
                <MenuItem value="Toutes">Toutes les sections</MenuItem>
                <MenuItem value="Expert Comptable">Expert Comptable</MenuItem>
                <MenuItem value="Société Expert">Société Expert</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={6}>
              <InputLabel sx={{ mb: 0.5, fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Titre</InputLabel>
              <TextField select fullWidth size="small" value={formAjust.titre} onChange={(e) => setFormAjust({ ...formAjust, titre: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f1f5f9' } }}>
                <MenuItem value="Toutes">Tous les titres</MenuItem>
                <MenuItem value="Tableau A">Tableau A</MenuItem>
                <MenuItem value="Tableau B">Tableau B</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={6}>
              <InputLabel sx={{ mb: 0.5, fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Niveau</InputLabel>
              <TextField select fullWidth size="small" value={formAjust.statut} onChange={(e) => setFormAjust({ ...formAjust, statut: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f1f5f9' } }}>
                <MenuItem value="Toutes">Tous les niveaux</MenuItem>
                <MenuItem value="Expert Comptable">Expert Comptable</MenuItem>
                <MenuItem value="Expert Stagiaire">Expert Stagiaire</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={6}>
              <InputLabel sx={{ mb: 0.5, fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Membre spécifique</InputLabel>
              <Autocomplete
                size="small"
                fullWidth
                options={[{ id: 'Tous', nom: 'Tous les membres', prenom: '' }, ...membres]}
                // Définit comment afficher le texte dans la liste et dans le champ
                getOptionLabel={(option) =>
                  option.id === 'Tous' ? option.nom : `${option.nom} ${option.prenom}`
                }
                // Compare la valeur sélectionnée avec la liste
                isOptionEqualToValue={(option, value) => option.id === value.id}
                // La valeur actuelle (doit être l'objet complet provenant de membres ou l'objet "Tous")
                value={
                  formAjust.membre === 'Tous'
                    ? { id: 'Tous', nom: 'Tous les membres', prenom: '' }
                    : membres.find((m) => m.id === formAjust.membre) || null
                }
                // Mise à jour de ton état (on stocke l'id)
                onChange={(event, newValue) => {
                  // On ne met à jour l'état QUE si une option est réellement cliquée
                  // Si l'utilisateur vide le champ, on peut laisser null ou une valeur vide
                  setFormAjust({
                    ...formAjust,
                    membre: newValue ? newValue.id : '' // On met vide au lieu de 'Tous'
                  });
                }}

                slotProps={{
                  popper: { sx: { width: 'fit-content', minWidth: '500px' } }
                }}

                renderInput={(params) => (
                  <TextField
                    {...params}
                    label=""
                    placeholder="Saisir un nom..."
                    sx={{
                      '& .MuiOutlinedInput-root': { bgcolor: '#f1f5f9' },
                      '& .MuiInputLabel-root': { fontSize: '0.85rem' }
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setOpenAjustConfirm(false)} sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 700 }}>Annuler</Button>
          <Button
            onClick={tabValue === 0 ? confirmAppelManuel : confirmGenerateAjustement}
            variant="contained"
            sx={{ bgcolor: '#2d6a4f', '&:hover': { bgcolor: '#1b4332' }, fontWeight: 700, textTransform: 'none', px: 4, borderRadius: '10px' }}
          >
            {tabValue === 0 ? "Lancer l'appel" : "Ajouter l'ajustement"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONFIRMATION CALCUL AUTO */}
      <Dialog open={openGenConfirm} onClose={() => setOpenGenConfirm(false)} PaperProps={{ sx: { borderRadius: '15px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirmer le calcul ?</DialogTitle>
        <DialogContent><DialogContentText>Le calcul automatique remplacera les données existantes de cet exercice.</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenGenConfirm(false)} sx={{ color: '#64748b' }}>Annuler</Button>
          <Button onClick={confirmGenerate} variant="contained" sx={{ bgcolor: '#2d6a4f' }}>Lancer</Button>
        </DialogActions>
      </Dialog>

      {/* SUPPRESSION */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} PaperProps={{ sx: { borderRadius: '15px', width: "500px" } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Supprimer ?</DialogTitle>
        <DialogContent><DialogContentText>Retirer {rowToDelete?.nom} de la liste ?</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenConfirm(false)} sx={{ color: '#64748b' }}>Annuler</Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              try {
                // 1. Appel au backend (choix de l'url selon l'onglet)
                const url = tabValue === 0
                  ? `/api/cotisations/${rowToDelete.id}`
                  : `/api/cotisations/ajustements/${rowToDelete.id}`;

                await axiosPrivate.delete(url);

                // 2. Mise à jour de l'interface locale
                if (tabValue === 0) {
                  setRows(rows.filter(r => r.id !== rowToDelete.id));
                } else {
                  setRowsAjustement(rowsAjustement.filter(r => r.id !== rowToDelete.id));
                }

                setOpenConfirm(false);
                toast.success("Supprimé avec succès");
              } catch (err) {
                toast.error(err.response?.data?.message || "Erreur lors de la suppression");
              }
            }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>


      {/* POPUP D'ENVOI DE MAIL */}
      <SendEmailModal
        open={emailModalOpen}
        handleClose={() => setEmailModalOpen(false)}
        membres={rows}
        initialMember={currentMember}
        onSend={() => handleSendMail('all')}
      />

      {/* --- Fenêtre de confirmation individuelle --- */}
      <ConfirmSingleModal
        open={singleModalOpen}
        handleClose={() => setSingleModalOpen(false)}
        onConfirm={handleConfirmSingle}
        loading={isSending} // Si tu as un état de chargement, sinon mets false
        name={selectedRow ? `${selectedRow.nom} ${selectedRow.prenom}` : ""}
      />

      {/* POPUP HISTORIQUE D'ENVOI EMAIL */}
      <Dialog
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '8px' } }}
      >
        <DialogTitle sx={{ bgcolor: '#0F172A', color: 'white', py: 1.5 }}>
          <Typography variant="subtitle1" fontWeight="600">
            Historique des envois : {historyTarget}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedHistory.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px' }}>Date & Heure</th>
                  <th style={{ padding: '12px' }}>Destinataire</th>
                  <th style={{ padding: '12px' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {selectedHistory.map((log, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 12px' }}>
                      {new Date(log.date_envoi).toLocaleString('fr-FR')}
                    </td>
                    <td style={{ padding: '10px 12px' }}>{log.email_dest}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <Chip
                        label={log.statut}
                        size="small"
                        sx={{
                          height: '20px', fontSize: '0.7rem',
                          bgcolor: log.statut === 'Succès' ? '#DCFCE7' : '#FEE2E2',
                          color: log.statut === 'Succès' ? '#166534' : '#991B1B'
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">Aucun mail envoyé pour ce règlement.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryModalOpen(false)} sx={{ textTransform: 'none', color: '#64748B' }}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog />


    </Box>
  );
};

export default AppelCotisation;
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box, Typography, Paper, Stack, TextField, MenuItem,
  Button, CircularProgress, Breadcrumbs, Link, Chip,
  InputLabel, Avatar, Drawer, IconButton, Divider, Grid,
  Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  SearchOutlined, NavigateNext, HomeOutlined,
  VisibilityOutlined, CloseOutlined, ContactPhoneOutlined,
  BusinessCenterOutlined, PersonOutline, LocationOnOutlined,
  CalendarMonthOutlined, LocalPrintshopOutlined, DownloadOutlined
} from '@mui/icons-material';
import toast, { Toaster } from 'react-hot-toast';
import useAxiosPrivate from '../../../config/axiosPrivate';

// Bibliothèques pour l'export
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { PDFDownloadLink } from '@react-pdf/renderer';
import FicheMembrePDF from './FicheMembrePDF';
import { URL } from '../../../config/axios';

// --- Helper pour les Badges (Style Bouton SaaS) ---
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

// --- Composant de Section "Pro" pour le Drawer ---
const InfoBlock = ({ title, icon, children }) => (
  <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, border: '1px solid #e9ecef', borderRadius: '12px', bgcolor: '#ffffff' }}>
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
      <Box sx={{ p: 1, bgcolor: '#ecf3f0', borderRadius: '10px', color: '#2d6a4f', display: 'flex' }}>
        {icon}
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1b4332', fontSize: '0.75rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {title}
      </Typography>
    </Stack>
    <Grid container spacing={2.5}>
      {children}
    </Grid>
  </Paper>
);

// --- Composant pour une donnée individuelle ---
const DataField = ({ label, value, xs = 6 }) => (
  <Grid item xs={xs}>
    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, display: 'block', mb: 0.5, textTransform: 'uppercase', fontSize: '0.65rem' }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2d3436', fontSize: '0.85rem' }}>
      {value || '---'}
    </Typography>
  </Grid>
);

const MyBreadcrumbs = ({ currentPath }) => (
  <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
    <Link underline="hover" color="inherit" href="/dashboard" sx={{ display: 'flex', alignItems: 'center' }}>
      <HomeOutlined sx={{ mr: 0.5, fontSize: 20 }} /> Dashboard
    </Link>
    <Typography color="text.primary" sx={{ fontWeight: 600 }}>{currentPath}</Typography>
  </Breadcrumbs>
);

const SituationMembre = () => {
  const axiosPrivate = useAxiosPrivate();
  const drawerContentRef = useRef(null); // Référence pour l'export PDF
  const [exercices, setExercices] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMembre, setSelectedMembre] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({ exerciceId: '', dateDebut: '', dateFin: '' });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const resEx = await axiosPrivate.get('/api/exercices');
        setExercices(resEx.data);
        if (resEx.data.length > 0) {
          const lastEx = resEx.data[0];
          setFilters({
            exerciceId: lastEx.id,
            dateDebut: lastEx.date_debut.split('T')[0],
            dateFin: lastEx.date_fin.split('T')[0]
          });
        }
      } catch (err) { toast.error("Erreur de chargement"); }
    };
    fetchInitialData();
  }, [axiosPrivate]);

  const handleSearch = async () => {
    if (!filters.exerciceId) return toast.error("Sélectionnez un exercice");
    setLoading(true);
    try {
      const response = await axiosPrivate.get('/api/membres-situation', { params: filters });
      setRows(response.data);
      toast.success(`${response.data.length} membres trouvés`);
    } catch (error) { toast.error("Erreur de recherche"); }
    finally { setLoading(false); }
  };

  // --- LOGIQUE EXPORT EXCEL (Tableau) ---
  const handleExportExcel = () => {
    if (rows.length === 0) return toast.error("Aucune donnée à exporter");

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Membres");

    // Génération du fichier
    XLSX.writeFile(workbook, `Situation_Membres_${filters.exerciceId}.xlsx`);
    toast.success("Fichier Excel généré");
  };

  // --- LOGIQUE EXPORT PDF (Fiche Individuelle) ---
  const handleExportPDF = async () => {
    if (!drawerContentRef.current) return;

    const toastId = toast.loading("Génération du PDF en cours...");
    try {
      const canvas = await html2canvas(drawerContentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#f8fafc"
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Fiche_${selectedMembre.matricule}_${selectedMembre.nom}.pdf`);

      toast.success("PDF exporté avec succès", { id: toastId });
    } catch (error) {
      toast.error("Erreur lors de l'export PDF", { id: toastId });
    }
  };

  const handleOpenDetails = (membre) => {
    setSelectedMembre(membre);
    setIsDrawerOpen(true);
  };

  const columns = useMemo(() => [
    {
      field: 'actions', headerName: '', width: 55, pinned: 'left', sortable: false,
      renderCell: (params) => (
        <Tooltip title="Ouvrir la fiche">
          <IconButton size="small" sx={{ color: '#2d6a4f', bgcolor: '#f1f8f5', '&:hover': { bgcolor: '#2d6a4f', color: 'white' } }} onClick={() => handleOpenDetails(params.row)}>
            <VisibilityOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    },
    {
      field: 'photo_url', headerName: '', width: 60, pinned: 'left', sortable: false,
      renderCell: (params) => (
        <Avatar src={params.value ? `${URL}/uploads/profiles/${params.value}` : ''} sx={{ width: 34, height: 34, border: '1px solid #eef2f6' }}>
          {params.row?.nom?.charAt(0)}
        </Avatar>
      )
    },
    { field: 'matricule', headerName: 'Matricule', width: 100, pinned: 'left' },
    { field: 'nom', headerName: 'Nom', width: 250, pinned: 'left', renderCell: (p) => <Typography variant="body2" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>{p.value}</Typography> },
    { field: 'prenom', headerName: 'Prénoms', width: 180, pinned: 'left' },
    { field: 'membre_active', headerName: 'Actif', width: 80, renderCell: (p) => <Chip label={p.value || '-'} size="small" variant="outlined" color={p.value === 'Oui' ? 'success' : 'error'} sx={{ fontWeight: 700, fontSize: '0.7rem' }} /> },
    // { field: 'situation', headerName: 'Situation', width: 130, renderCell: (p) => {
    //     const colors = { 'En activité': 'success', 'Inactive': 'warning', 'Suspendu': 'error' };
    //     return <Chip label={p.value || '-'} size="small" color={colors[p.value] || 'default'} sx={{ fontWeight: 600 }} />;
    // }},
    { field: 'situation', headerName: 'Situation', width: 130, renderCell: (p) => renderBadge(p, { 'En activité': '#1976d2', 'Inactive': '#ed6c02', 'Suspendu': '#d32f2f' }) },
    { field: 'section', headerName: 'Section', width: 150, renderCell: (p) => renderBadge(p, { 'Expert Comptable': '#9c27b0', 'Société Expert': '#00838f' }) },
    { field: 'statut', headerName: 'Statut', width: 150, renderCell: (p) => renderBadge(p, { 'Expert Comptable': '#0288d1', 'Expert Stagiaire': '#455a64' }) },
    { field: 'titre', headerName: 'Titre', width: 120, renderCell: (p) => renderBadge(p, { 'Tableau A': '#2e7d32', 'Tableau B': '#689f38' }) },


    // { field: 'section', headerName: 'Section', width: 150 },
    // { field: 'statut', headerName: 'Statut', width: 150 },
    // { field: 'titre', headerName: 'Titre', width: 120 },
    { field: 'promotion', headerName: 'Promotion', width: 100 },
    { field: 'date_adhesion', headerName: 'Date adhésion', width: 110, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('fr-FR') : '' },
    { field: 'sexe', headerName: 'Sexe', width: 80 },
    { field: 'poste', headerName: 'Poste', width: 180 },
    { field: 'email_oecfm', headerName: 'Email OECFM', width: 180 },
    { field: 'email_professionnel', headerName: 'Email professionnel', width: 180 },
    { field: 'email_personnel', headerName: 'Email personnel', width: 180 },

    { field: 'telephone', headerName: 'Téléphone', width: 130 },
    { field: 'fax', headerName: 'Fax', width: 130 },
    { field: 'adresse', headerName: 'Adresse', width: 200 },
    { field: 'ville', headerName: 'Ville', width: 120 },
    { field: 'code_postal', headerName: 'CP', width: 50 },
    { field: 'boite_postale', headerName: 'BP', width: 50 },
    { field: 'region', headerName: 'Region', width: 150 },

    { field: 'date_naissance', headerName: 'Né(e) le', width: 110, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('fr-FR') : '' },
    { field: 'lieu_naissance', headerName: 'Lieu naissance', width: 150 },
    { field: 'cin', headerName: 'Cin', width: 130 },
    { field: 'date_cin', headerName: 'Délivrée le', width: 110, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('fr-FR') : '' },
    { field: 'lieu_cin', headerName: 'Lieu Cin', width: 150 },

    { field: 'num_compte', headerName: 'N° compte', width: 100 },
    { field: 'nombre_associe', headerName: 'Nb associé', width: 75 },

    { field: 'date_modification', headerName: 'Dernière MAJ', width: 110, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('fr-FR') : '' },
    { field: 'date_edition', headerName: 'Date édition', width: 110, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('fr-FR') : '' },
  ], []);

  return (
    <Box sx={{ p: 0, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Toaster position="top-right" />
      <MyBreadcrumbs currentPath="Situation Membre" />

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1b4332', letterSpacing: -0.5 }}>
          Situation des Membres
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadOutlined />}
          onClick={handleExportExcel}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            color: '#2d6a4f',
            borderColor: '#2d6a4f',
            '&:hover': { borderColor: '#1b4332', bgcolor: '#f1f8f5' }
          }}
        >
          Exporter Excel
        </Button>
      </Stack>

      {/* SECTION FILTRES */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <Stack spacing={3}>
          <Box>
            <InputLabel sx={{ mb: 1, fontWeight: 700, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Exercice de référence</InputLabel>
            <TextField
              select fullWidth size="small"
              value={filters.exerciceId}
              onChange={(e) => {
                const selectedId = e.target.value;
                // 1. On cherche l'exercice correspondant dans la liste
                const selectedEx = exercices.find(ex => ex.id === selectedId);

                // 2. On met à jour tout le state d'un coup
                setFilters({
                  ...filters,
                  exerciceId: selectedId,
                  // On injecte les dates si l'exercice existe, sinon on laisse vide
                  dateDebut: selectedEx ? selectedEx.date_debut : '',
                  dateFin: selectedEx ? selectedEx.date_fin : ''
                });
              }}
              sx={{ maxWidth: 400 }}
            >
              {exercices.map((ex) => <MenuItem key={ex.id} value={ex.id}>
                {ex.libelle} : {new Date(ex.date_debut).toLocaleDateString('fr-FR')} - {new Date(ex.date_fin).toLocaleDateString('fr-FR')}
              </MenuItem>
              )}
            </TextField>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-end">
            <Box sx={{ flex: 0 }}>
              <InputLabel sx={{ mb: 1, fontWeight: 700, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Date début</InputLabel>
              <TextField type="date" fullWidth size="small" value={filters.dateDebut} onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })} />
            </Box>
            <Box sx={{ flex: 0 }}>
              <InputLabel sx={{ mb: 1, fontWeight: 700, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Date fin</InputLabel>
              <TextField type="date" fullWidth size="small" value={filters.dateFin} onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })} />
            </Box>
            <Box sx={{ flex: 1 }}></Box>
            <Button variant="contained" startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchOutlined />} onClick={handleSearch} disabled={loading} sx={{ height: 40, px: 4, borderRadius: '10px', bgcolor: '#2d6a4f', '&:hover': { bgcolor: '#1b4332' }, textTransform: 'none', fontWeight: 700 }}>Actualiser</Button>
          </Stack>
        </Stack>
      </Paper>

      {/* SECTION TABLEAU */}
      <Paper elevation={0} sx={{ height: 650, borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <DataGrid
          rows={rows} columns={columns} loading={loading} rowHeight={52} disableRowSelectionOnClick
          initialState={{ pinnedColumns: { left: ['actions', 'photo_url', 'matricule', 'nom', 'prenom'] } }}
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafb', color: '#475569', fontWeight: 800, fontSize: '0.75rem' } }}
        />
      </Paper>

      {/* DRAWER ÉPURÉ ET PRO */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 500 }, border: 'none', bgcolor: '#f8fafc' } }}
      >
        {selectedMembre && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* Conteneur pour le PDF */}
            <Box ref={drawerContentRef} sx={{ bgcolor: '#f8fafc', flex: 1 }}>
              <Box sx={{ p: 4, background: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)', color: 'white', position: 'relative' }}>
                <IconButton onClick={() => setIsDrawerOpen(false)} sx={{ position: 'absolute', right: 12, top: 12, color: 'rgba(255,255,255,0.7)', display: 'print-none' }}>
                  <CloseOutlined />
                </IconButton>
                <Stack direction="row" spacing={0} alignItems="center">
                  <Avatar
                    src={selectedMembre.photo_url ? `http://localhost:5100/uploads/profiles/${selectedMembre.photo_url}` : ''}
                    sx={{ width: 80, height: 80, border: '4px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}
                  />
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0 }}>{selectedMembre.nom}</Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>{selectedMembre.prenom}</Typography>
                    <Chip label={`MATRICULE: ${selectedMembre.matricule}`} size="small" sx={{ mt: 0, bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 700, fontSize: '0.75rem' }} />
                  </Box>
                </Stack>
              </Box>

              <Box sx={{ p: 3 }}>
                <InfoBlock title="Situation Administrative" icon={<BusinessCenterOutlined fontSize="small" />}>
                  <DataField label="Section" value={selectedMembre.section} />
                  <DataField label="Statut" value={selectedMembre.statut} />
                  <DataField label="Titre" value={selectedMembre.titre} />
                  <DataField label="Poste" value={selectedMembre.poste} />
                  <DataField label="Promotion" value={selectedMembre.promotion} />
                  <DataField label="Actif" value={selectedMembre.membre_active} />
                  <DataField label="Situation" value={selectedMembre.situation} />

                  <DataField label="Email oecfm" value={selectedMembre.email_oecfm} />
                  <DataField label="Email professionnel" value={selectedMembre.email_professionnel} />
                  <DataField label="Email personnel" value={selectedMembre.email_personnel} />
                  <DataField label="Date d'adhésion" value={new Date(selectedMembre.date_adhesion).toLocaleDateString('fr-FR')} />

                  <DataField label="Nombre associés" value={selectedMembre.nombre_associe} />
                  <DataField label="N° compte" value={selectedMembre.num_compte} />
                </InfoBlock>

                <InfoBlock title="Contact & Localisation" icon={<LocationOnOutlined fontSize="small" />}>
                  <DataField label="Téléphone" value={selectedMembre.telephone} />
                  <DataField label="Fax" value={selectedMembre.fax} />
                  <DataField label="Adresse" value={selectedMembre.adresse} />
                  <DataField label="Ville" value={selectedMembre.ville} />
                  <DataField label="CP" value={selectedMembre.code_postal} />
                  <DataField label="BP" value={selectedMembre.boite_postale} />
                  <DataField label="Région" value={selectedMembre.region} />
                </InfoBlock>

                <InfoBlock title="Informations Personnelles" icon={<PersonOutline fontSize="small" />}>
                  <DataField label="Né(e) le" value={selectedMembre.date_naissance ? new Date(selectedMembre.date_naissance).toLocaleDateString() : ''} xs={12} />
                  <DataField label="A" value={selectedMembre.lieu_naissance} />
                  <DataField label="Sexe" value={selectedMembre.sexe} />
                  <DataField label="N° CIN" value={selectedMembre.cin} />
                  <DataField label="délivrée le" value={selectedMembre.date_cin ? new Date(selectedMembre.date_cin).toLocaleDateString() : ''} xs={12} />
                  <DataField label="A" value={selectedMembre.lieu_cin} />
                </InfoBlock>
              </Box>
            </Box>

            {/* Pied de page Action */}
            <Box sx={{ p: 2.5, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setIsDrawerOpen(false)}
                sx={{ borderRadius: '10px', fontWeight: 700 }}
              >
                Fermer
              </Button>

              <PDFDownloadLink
                document={<FicheMembrePDF data={selectedMembre} />}
                fileName={`Fiche_${selectedMembre.matricule}.pdf`}
                style={{ textDecoration: 'none', width: '100%' }}
              >
                {({ loading }) => (
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <LocalPrintshopOutlined />}
                    sx={{
                      borderRadius: '10px',
                      fontWeight: 700,
                      bgcolor: '#2d6a4f',
                      '&:hover': { bgcolor: '#1b4332' }
                    }}
                  >
                    {loading ? 'Génération...' : 'Télécharger PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default SituationMembre;
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'; // Ajout de useRef
import { 
  Box, Button, Typography, Paper, Stack, Chip, Breadcrumbs, Link,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions 
} from '@mui/material';
import { DataGrid, GridActionsCellItem, GridRowModes, GridToolbar } from '@mui/x-data-grid';
import { 
  AddOutlined, EditOutlined, DeleteOutlined, SaveOutlined, 
  CloseOutlined, NavigateNext, HomeOutlined, FileUploadOutlined, // Ajout FileUploadOutlined
  FileDownloadOutlined
} from '@mui/icons-material';
import toast, { Toaster } from 'react-hot-toast';
import useAxiosPrivate from '../../../config/axiosPrivate';
import { URL } from '../../../config/axios';

const MyBreadcrumbs = ({ currentPath }) => (
  <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
    <Link underline="hover" color="inherit" href="/dashboard" sx={{ display: 'flex', alignItems: 'center' }}>
      <HomeOutlined sx={{ mr: 0.5, fontSize: 20 }} /> Dashboard
    </Link>
    <Typography color="text.primary" sx={{ fontWeight: 600 }}>{currentPath}</Typography>
  </Breadcrumbs>
);

const MembreMiseAJour = () => {
  const axiosPrivate = useAxiosPrivate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowModesModel, setRowModesModel] = useState({});
  const [listeMembres, setListeMembres] = useState([]);

  // États pour la suppression
  const [openConfirm, setOpenConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // --- ÉTATS POUR L'IMPORT EXCEL ---
  const [openImport, setOpenImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const excelInputRef = useRef(null);

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

  useEffect(() => {
    const getMembres = async () => {
      try {
        const res = await axiosPrivate.get('/api/membres');
        setListeMembres(res.data.map(m => ({ value: Number(m.id), label: `${m.nom || ''} ${m.prenom || ''}`.trim() })));
      } catch (err) { 
        console.error(err);
      }
    };
    getMembres();
  }, [axiosPrivate]);

  const fetchUpdates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosPrivate.get('/api/membres-updates');
      setRows(response.data);
    } catch (error) { 
      console.error(error);
      toast.error("Erreur de chargement des mises à jour");
    }
    finally { setLoading(false); }
  }, [axiosPrivate]);

  useEffect(() => { fetchUpdates(); }, [fetchUpdates]);

  const handleAddNew = () => {
    const id = Math.floor(Math.random() * 1000000);
    const today = new Date().toISOString().split('T')[0];
    const newRow = { id, date_edition: today, date_modification: today, membre_active: 'Oui', situation: 'En activité', isNew: true };
    setRows((old) => [newRow, ...old]);
    setRowModesModel((old) => ({ ...old, [id]: { mode: GridRowModes.Edit, fieldToFocus: 'membre_id' } }));
  };

  // --- LOGIQUE IMPORT EXCEL ---
  const handleImportExcel = async () => {
    if (!importFile) return toast.error("Veuillez sélectionner un fichier");

    const formData = new FormData();
    formData.append('file', importFile);
    const loadId = toast.loading("Importation des données en cours...");

    try {
      await axiosPrivate.post('/api/membres-updates/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Importation réussie !", { id: loadId });
      setOpenImport(false);
      fetchUpdates(); // Rafraîchir la liste après import
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "Erreur lors de l'importation.";
      toast.error(errorMsg, { id: loadId });
    } finally {
      setImportFile(null);
      if (excelInputRef.current) excelInputRef.current.value = "";
    }
  };

  const handleEditClick = (id) => () => setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  const handleSaveClick = (id) => () => setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  const handleCancelClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View, ignoreModifications: true } });
    const editedRow = rows.find((r) => r.id === id);
    if (editedRow?.isNew) setRows(rows.filter((r) => r.id !== id));
  };

  // --- Logique Suppression ---
  const handleDeleteClick = (id) => () => {
    setDeleteId(id);
    setOpenConfirm(true);
  };

  const confirmDelete = async () => {
    const loadId = toast.loading("Suppression...");
    try {
      await axiosPrivate.delete(`/api/membres-updates/${deleteId}`);
      setRows(rows.filter((r) => r.id !== deleteId));
      toast.success("Mise à jour supprimée", { id: loadId });
    } catch (e) { 
      console.error(e); 
      toast.error("Erreur lors de la suppression", { id: loadId });
    } finally {
      setOpenConfirm(false);
      setDeleteId(null);
    }
  };

  const processRowUpdate = async (newRow) => {
    const loadId = toast.loading("Enregistrement...");
    try {
      const dataToSend = { ...newRow };
      delete dataToSend.isNew;
      delete dataToSend.membre_nom_complet;
      if (dataToSend.date_modification) {
        const d = new Date(dataToSend.date_modification);
        if (!isNaN(d.getTime())) dataToSend.date_modification = d.toISOString().split('T')[0];
      }
      const method = newRow.isNew ? 'post' : 'put';
      const url = newRow.isNew ? '/api/membres-updates' : `/api/membres-updates/${newRow.id}`;
      const response = await axiosPrivate[method](url, dataToSend);
      
      toast.success(newRow.isNew ? "Création réussie" : "Modification enregistrée", { id: loadId });
      return { ...response.data, isNew: false };
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde", { id: loadId });
      throw err;
    }
  };

  const columns = useMemo(() => [
    // --- COLONNES FIXÉES À GAUCHE ---
    { field: 'date_edition', headerName: "Édition", width: 100, pinned: 'left', valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('fr-FR') : '' },
    { field: 'date_modification', headerName: "Modif.", width: 110, editable: true, type: 'date', pinned: 'left', valueGetter: (p) => p.value ? new Date(p.value) : null, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('fr-FR') : '' },
    { field: 'membre_id', headerName: 'Membre', width: 200, editable: true, type: 'singleSelect', valueOptions: listeMembres, pinned: 'left' },
    
    // --- COLONNES BADGES ---
    { field: 'membre_active', headerName: 'Actif', width: 85, editable: true, type: 'singleSelect', valueOptions: ['Oui', 'Non'], renderCell: (p) => renderBadge(p, { 'Oui': '#2e7d32', 'Non': '#d32f2f' }) },
    { field: 'situation', headerName: 'Situation', width: 120, editable: true, type: 'singleSelect', valueOptions: ['En activité', 'Inactive', 'Suspendu'], renderCell: (p) => renderBadge(p, { 'En activité': '#1976d2', 'Inactive': '#ed6c02', 'Suspendu': '#d32f2f' }) },
    { field: 'section', headerName: 'Section', width: 150, editable: true, type: 'singleSelect', valueOptions: ['Expert Comptable', 'Société Expert'], renderCell: (p) => renderBadge(p, { 'Expert Comptable': '#9c27b0', 'Société Expert': '#00838f' }) },
    { field: 'statut', headerName: 'Niveau', width: 150, editable: true, type: 'singleSelect', valueOptions: ['Expert Comptable', 'Expert Stagiaire'], renderCell: (p) => renderBadge(p, { 'Expert Comptable': '#0288d1', 'Expert Stagiaire': '#455a64' }) },
    { field: 'titre', headerName: 'Titre', width: 110, editable: true, type: 'singleSelect', valueOptions: ['Tableau A', 'Tableau B','Stagiaire'], renderCell: (p) => renderBadge(p, { 'Tableau A': '#2e7d32', 'Tableau B': '#689f38', 'Stagiaire': '#b8e392' }) },

    // --- COORDONNÉES ET INFOS ---
    { field: 'email_oecfm', headerName: 'Email OECFM', width: 170, editable: true },
    { field: 'adresse', headerName: 'Adresse', width: 180, editable: true },
    { field: 'ville', headerName: 'Ville', width: 120, editable: true },
    { field: 'code_postal', headerName: 'CP', width: 80, editable: true },
    { field: 'boite_postale', headerName: 'BP', width: 80, editable: true },
    { field: 'telephone', headerName: 'Téléphone', width: 130, editable: true },
    { field: 'fax', headerName: 'Fax', width: 130, editable: true },
    { field: 'email_personnel', headerName: 'Email Personnel', width: 170, editable: true },
    { field: 'email_professionnel', headerName: 'Email Pro', width: 170, editable: true },
    { field: 'poste', headerName: 'Poste', width: 180, editable: true, type: 'singleSelect', valueOptions: ['Caissier','Conseiller', 'Membre', 'Président','Président d honneur', 'Vice-Président Administratif', 'Vice-Président Technique','Secrétaire Exécutif','Secrétaire Général','Secrétaire Général Adjoint','Trésorier'] },
    { field: 'region', headerName: 'Région', width: 130, editable: true },
    { field: 'num_compte', headerName: 'N° Compte', width: 130, editable: true },
    { field: 'nombre_associe', headerName: 'Assoc.', width: 90, editable: true, type: 'number' },

    // --- ACTIONS FIXÉES À DROITE ---
    {
      field: 'actions', type: 'actions', headerName: 'Actions', width: 80, pinned: 'right',
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
        return isInEditMode ? [
          <GridActionsCellItem key="s" icon={<SaveOutlined fontSize="small" color="primary" />} label="Save" onClick={handleSaveClick(id)} />,
          <GridActionsCellItem key="c" icon={<CloseOutlined fontSize="small" color="error" />} label="Cancel" onClick={handleCancelClick(id)} />,
        ] : [
          <GridActionsCellItem key="e" icon={<EditOutlined fontSize="small" />} label="Edit" onClick={handleEditClick(id)} />,
          <GridActionsCellItem key="d" icon={<DeleteOutlined fontSize="small" color="error" />} label="Delete" onClick={handleDeleteClick(id)} />,
        ];
      },
    },
  ], [listeMembres, rowModesModel]);

  return (
    <Box sx={{ p: 0, bgcolor: '#f4f7f9', minHeight: '100vh' }}>
      <Toaster position="top-right" />
      <MyBreadcrumbs currentPath="Mise à jour infos membres" />
      
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
          Mise à jour des membres
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" startIcon={<FileUploadOutlined />} onClick={() => setOpenImport(true)} sx={{ borderRadius: '8px', textTransform: 'none', px: 2 }}>
            Importer Excel
          </Button>
          <Button size="small" variant="contained" startIcon={<AddOutlined />} onClick={handleAddNew} sx={{ borderRadius: '8px', bgcolor: '#1a237e', textTransform: 'none', px: 2 }}>
            Nouvelle mise à jour
          </Button>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ height: 700, borderRadius: '12px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          editMode="row"
          loading={loading}
          rowModesModel={rowModesModel}
          onRowModesModelChange={setRowModesModel}
          processRowUpdate={processRowUpdate}
          rowHeight={38}
          columnHeaderHeight={42}
          disableRowSelectionOnClick
          //pinnedColumns= {{ left: ['date_edition', 'date_modification', 'membre_id'], right: ['actions'] }}
          //initialState={{ pinnedColumns: { left: ['date_edition', 'date_modification', 'membre_id'], right: ['actions'] } }}
          slots={{ toolbar: GridToolbar }} 
          slotProps={{
              toolbar: {
                  showQuickFilter: true, // Affiche le champ de recherche
                  quickFilterProps: { debounceMs: 500 }, // Optionnel : attend 500ms avant de filtrer
              },
          }}
          sx={{ 
            border: 'none',
            fontSize: '0.82rem',
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafb', borderBottom: '1px solid #e0e0e0' },
            '& .MuiDataGrid-cell': { borderBottom: '1px solid #f5f5f5' },
            '& .MuiInputBase-root': { fontSize: '0.8rem', height: '28px' },
            '& .MuiSelect-select': { py: '4px !important' },
            //'& .MuiDataGrid-pinnedColumns': { bgcolor: '#fff', zIndex: 1 },
            // Le secret du sticky en version Free est ici :
            //'& .MuiDataGrid-main': { overflow: 'auto' },
            // 1. On cible spécifiquement l'en-tête de la colonne actions
            // '& .MuiDataGrid-columnHeader[data-field="actions"]': {
            //   position: 'sticky',
            //   right: 0,
            //   bgcolor: '#f8fafb', // Doit être identique à la couleur de ton header
            //   zIndex: 5, // Plus haut pour passer au dessus des autres headers
            //   borderLeft: '1px solid #e0e0e0', // Optionnel : petite ligne pour séparer
            // },

            // // 2. On cible les cellules de la colonne actions
            // '& .MuiDataGrid-cell[data-field="actions"]': {
            //   position: 'sticky',
            //   right: 0,
            //   bgcolor: '#fff', // Indispensable pour ne pas voir les données défiler derrière
            //   zIndex: 4,
            //   borderLeft: '1px solid #f5f5f5',
            //   boxShadow: '-4px 0px 6px -4px rgba(0,0,0,0.2)', // Effet d'ombre pour montrer le "dessus"
            // },
            // Désactive les styles de pinning par défaut qui pourraient entrer en conflit
            //'& .MuiDataGrid-pinnedColumns': { display: 'none' },
          }}
        />
      </Paper>

      {/* DIALOGUE D'IMPORT EXCEL */}
      {/* <Dialog open={openImport} onClose={() => setOpenImport(false)} PaperProps={{ sx: { borderRadius: '12px', width: '400px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Importer des mises à jour</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Sélectionnez votre fichier Excel (.xlsx) contenant les données de mise à jour.
          </DialogContentText>
          <Button variant="outlined" component="label" fullWidth sx={{ py: 2, borderStyle: 'dashed' }}>
            {importFile ? importFile.name : "Choisir un fichier"}
            <input type="file" hidden accept=".xlsx, .xls" ref={excelInputRef} onChange={(e) => setImportFile(e.target.files[0])} />
          </Button>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenImport(false)} color="inherit">Annuler</Button>
          <Button onClick={handleImportExcel} variant="contained" disabled={!importFile} sx={{ borderRadius: '8px', bgcolor: '#1a237e' }}>
            Lancer l'importation
          </Button>
        </DialogActions>
      </Dialog> */}

      {/* POPUP IMPORT FICHIER EXCEL */}
      <Dialog open={openImport} onClose={() => setOpenImport(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Importation Excel</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Veuillez utiliser le modèle standard pour assurer la compatibilité des données.
          </Typography>
          
          <Button 
            fullWidth 
            variant="soft" // Ou "outlined" selon votre thème
            startIcon={<FileDownloadOutlined />}
            href={`${URL}/public/templates/modeleImportMembreUpdate.xlsx`} // Lien vers le fichier sur votre serveur
            download="modeleImportMembreUpdate.xlsx"
            sx={{ mb: 3, bgcolor: '#f0f7ff', color: '#0072ea', py: 1.5 }}
          >
            Télécharger le modèle (.xlsx)
          </Button>

          <Box 
            onClick={() => excelInputRef.current.click()}
            sx={{ 
              border: '2px dashed #e0e0e0', borderRadius: 3, p: 3, textAlign: 'center', 
              cursor: 'pointer', '&:hover': { bgcolor: '#fafafa', borderColor: 'primary.main' }
            }}
          >
            <input 
              type="file" hidden ref={excelInputRef} accept=".xlsx, .xls" 
              onChange={(e) => setImportFile(e.target.files[0])} 
            />
            <FileUploadOutlined sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {importFile ? importFile.name : "Cliquez pour choisir le fichier source"}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenImport(false)} color="inherit">Annuler</Button>
          <Button 
            variant="contained" 
            disabled={!importFile} 
            onClick={handleImportExcel}
            sx={{ borderRadius: 2, px: 4 }}
          >
            Lancer l'importation
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOGUE DE CONFIRMATION DE SUPPRESSION */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Voulez-vous vraiment supprimer cet enregistrement de mise à jour ?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenConfirm(false)} color="inherit" sx={{ textTransform: 'none' }}>Annuler</Button>
          <Button onClick={confirmDelete} variant="contained" color="error" sx={{ borderRadius: '8px', textTransform: 'none' }}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MembreMiseAJour;
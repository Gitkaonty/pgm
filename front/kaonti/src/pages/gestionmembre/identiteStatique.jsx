import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, Button, Typography, Paper, Dialog, DialogContent, 
  DialogTitle, IconButton, Stack, Breadcrumbs, Link, 
  Avatar, Chip, Badge, Tooltip, CircularProgress, DialogActions
} from '@mui/material';
import { DataGrid, GridActionsCellItem, GridRowModes } from '@mui/x-data-grid';
import { 
  AddOutlined, EditOutlined, DeleteOutlined, 
  SaveOutlined, CloseOutlined, NavigateNext, HomeOutlined,
  PhotoCameraOutlined 
} from '@mui/icons-material';
import { FileDownloadOutlined, FileUploadOutlined } from '@mui/icons-material';
import toast, { Toaster } from 'react-hot-toast'; // Import du toast
import FormulaireStatique from './FormulaireStatique';
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

const MembresListe = () => {
  // --- 1. HOOKS DE BASE ---
  const axiosPrivate = useAxiosPrivate();
  const fileInputRef = useRef(null);

  // --- 2. TOUT LES STATES (ORDRE STABLE) ---
  const [openPopup, setOpenPopup] = useState(false);
  const [rowModesModel, setRowModesModel] = useState({});
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [selectedIdForPhoto, setSelectedIdForPhoto] = useState(null);

  // States pour la suppression
  const [openConfirm, setOpenConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  //pour l'import Excel
  const [openImport, setOpenImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const excelInputRef = useRef(null); // Pour le déclencheur de fichier Excel

  // --- 3. FONCTIONS & CALLBACKS ---
  const fetchMembres = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosPrivate.get('/api/membres');
      setRows(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération:", error);
      toast.error("Erreur de chargement des données");
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate]);

  useEffect(() => {
    fetchMembres();
  }, [fetchMembres]);

  const handlePhotoClick = (id) => {
    setSelectedIdForPhoto(id);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedIdForPhoto) return;

    const formData = new FormData();
    formData.append('photo', file);
    const loadId = toast.loading("Téléchargement de la photo...");

    try {
      setUploadingId(selectedIdForPhoto);
      const response = await axiosPrivate.post(`/api/membres/${selectedIdForPhoto}/upload-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200) {
        setRows((prevRows) => prevRows.map(row => 
          row.id === selectedIdForPhoto ? { ...row, photo_url: response.data.photo_url } : row
        ));
        toast.success("Photo mise à jour", { id: loadId });
      }
    } catch (error) {
      console.error("Erreur upload photo:", error);
      toast.error("Erreur lors du changement de photo", { id: loadId });
    } finally {
      setUploadingId(null);
      setSelectedIdForPhoto(null);
      e.target.value = null; 
    }
  };

  const processRowUpdate = async (newRow) => {
    const loadId = toast.loading("Mise à jour...");
    try {
      await axiosPrivate.put(`/api/membres/${newRow.id}`, newRow);
      const updatedRow = { ...newRow, isNew: false };
      setRows((prev) => prev.map((row) => (row.id === newRow.id ? updatedRow : row)));
      toast.success("Membre mis à jour", { id: loadId });
      return updatedRow;
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur de mise à jour", { id: loadId });
      throw error;
    }
  };

  // Logique de suppression améliorée
  const handleDeleteClick = (id) => () => {
    setDeleteId(id);
    setOpenConfirm(true);
  };

  const confirmDelete = async () => {
    const loadId = toast.loading("Suppression en cours...");
    try {
      await axiosPrivate.delete(`/api/membres/${deleteId}`);
      setRows((prev) => prev.filter((row) => row.id !== deleteId));
      toast.success("Membre supprimé avec succès", { id: loadId });
    } catch (error) {
      console.error("Erreur de suppression:", error);
      toast.error("Erreur lors de la suppression", { id: loadId });
    } finally {
      setOpenConfirm(false);
      setDeleteId(null);
    }
  };

  const handleEditClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleCancelClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View, ignoreModifications: true } });
  };

  // --- 4. COLONNES ---
  const columns = [
    { 
      field: 'photo_url', 
      headerName: '', 
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const isInEditMode = rowModesModel[params.id]?.mode === GridRowModes.Edit;
        const isUploading = uploadingId === params.id;

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                isInEditMode && !isUploading && (
                  <Tooltip title="Changer la photo">
                    <IconButton 
                      onClick={() => handlePhotoClick(params.id)}
                      sx={{ 
                        width: 28, height: 28, bgcolor: 'primary.main', color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' }, border: '2px solid white',
                        boxShadow: 2
                      }}
                    >
                      <PhotoCameraOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )
              }
            >
              {isUploading ? (
                <CircularProgress size={28} />
              ) : (
                <Avatar
                  src={params.value ? `${URL}/uploads/profiles/${params.value}` : ''} 
                  sx={{ 
                    width: 42, height: 42, 
                    border: isInEditMode ? '2.5px solid #1976d2' : '1.5px solid #eef2f6',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {params.row?.nom?.charAt(0)}
                </Avatar>
              )}
            </Badge>
          </Box>
        );
      }
    },
    { field: 'matricule', headerName: 'Matricule', width: 120, editable: true },
    { 
      field: 'nom', 
      headerName: 'Nom', 
      width: 300, 
      editable: true,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
          {params.value || ''}
        </Typography>
      )
    },
    { field: 'prenom', headerName: 'Prénoms', width: 250, editable: true },
    { 
      field: 'sexe', 
      headerName: 'Sexe', 
      width: 80, 
      editable: true,
      type: 'singleSelect',
      valueOptions: ['M', 'F'],
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          color={params.value === 'M' ? 'primary' : 'secondary'} 
          sx={{ fontWeight: 700, borderRadius: '6px', width: 40 }}
        />
      )
    },
    { field: 'promotion', headerName: 'Promotion', width: 120, editable: true },
    { 
      field: 'date_adhesion', 
      headerName: 'Adhésion', 
      width: 120, 
      editable: true,
      renderCell: (params) => {
        if (!params.value) return '';
        const d = new Date(params.value);
        return isNaN(d.getTime()) ? params.value : d.toLocaleDateString('fr-FR');
      }
    },
    { 
      field: 'date_naissance', 
      headerName: 'date de naiss.', 
      width: 120, 
      editable: true,
      renderCell: (params) => {
        if (!params.value) return '';
        const d = new Date(params.value);
        return isNaN(d.getTime()) ? params.value : d.toLocaleDateString('fr-FR');
      }
    },
    { field: 'lieu_naissance', headerName: 'Lieu Naissance', width: 150, editable: true },
    { field: 'cin', headerName: 'N° CIN', width: 140, editable: true },
    { 
      field: 'date_cin', 
      headerName: 'Délivré le', 
      width: 120, 
      editable: true,
      renderCell: (params) => {
        if (!params.value) return '';
        const d = new Date(params.value);
        return isNaN(d.getTime()) ? params.value : d.toLocaleDateString('fr-FR');
      }
    },
    { field: 'lieu_cin', headerName: 'Lieu CIN', width: 150, editable: true },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
        if (isInEditMode) {
          return [
            <GridActionsCellItem key="save" icon={<SaveOutlined color="primary" />} label="Save" onClick={handleSaveClick(id)} />,
            <GridActionsCellItem key="cancel" icon={<CloseOutlined color="error" />} label="Cancel" onClick={handleCancelClick(id)} />,
          ];
        }
        return [
          <GridActionsCellItem key="edit" icon={<EditOutlined />} label="Edit" onClick={handleEditClick(id)} />,
          <GridActionsCellItem key="delete" icon={<DeleteOutlined color="error" />} label="Delete" onClick={handleDeleteClick(id)} />,
        ];
      },
    },
  ];

  //fonction pour renvoyer en back le fichier Excel à importer
  const handleImportExcel = async () => {
    if (!importFile) return toast.error("Veuillez sélectionner un fichier");

    const formData = new FormData();
    formData.append('file', importFile);
    const loadId = toast.loading("Importation des données en cours...");

    try {
      await axiosPrivate.post('/api/membres/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Importation réussie !", { id: loadId });
      setOpenImport(false);
      fetchMembres(); // Rafraîchir la liste
    } catch (error) {
      //toast.error("Erreur lors de l'importation. Vérifiez le format.", { id: loadId });
      // Affiche l'objet erreur complet dans la console F12
      console.error("Détail erreur import:", error.response || error);
      
      // Affiche le message du serveur s'il existe, sinon un message générique
      const msg = error.response?.data?.message || "Erreur de connexion au serveur";
      toast.error(msg, { id: loadId });
      } finally {
        setImportFile(null);
        // Force la remise à zéro du champ de fichier pour permettre de re-sélectionner le même
        if (excelInputRef.current) {
            excelInputRef.current.value = "";
        }
      }
    };

  return (
    <Box sx={{ p: 0 }}>
      <Toaster position="top-right" />
      <MyBreadcrumbs currentPath="Effectif Total" />

      <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
          Effectif de l'Ordre
        </Typography>

        {/* On groupe les boutons dans un sous-Stack pour qu'ils restent collés à droite */}
        <Stack direction="row" spacing={2}>
          <Button 
            variant="outlined" 
            startIcon={<FileUploadOutlined />} 
            onClick={() => setOpenImport(true)}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
          >
            Importer Excel
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddOutlined />} 
            onClick={() => setOpenPopup(true)}
            sx={{ borderRadius: 2, fontWeight: 700, px: 3, textTransform: 'none' }}
          >
            Nouveau Membre
          </Button>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ height: 650, width: '100%', borderRadius: 4, border: '1px solid #eef2f6', overflow: 'hidden' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={(newModel) => setRowModesModel(newModel)}
          processRowUpdate={processRowUpdate}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          sx={{ 
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafb', borderBottom: '1px solid #eef2f6' },
            '& .MuiDataGrid-cell': { borderBottom: '1px solid #f8fafb', display: 'flex', alignItems: 'center' },
            '& .MuiDataGrid-cell:focus': { outline: 'none' }
          }}
        />
      </Paper>

      {/* DIALOGUE D'INSCRIPTION */}
      <Dialog open={openPopup} onClose={() => setOpenPopup(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Inscription Nouveau Membre
          <IconButton onClick={() => setOpenPopup(false)}><CloseOutlined /></IconButton>
        </DialogTitle>
        <DialogContent>
          <FormulaireStatique onSuccess={() => { 
            toast.success("Membre inscrit avec succès !");
            setOpenPopup(false); 
            fetchMembres(); 
          }} />
        </DialogContent>
      </Dialog>

      {/* POPUP DE CONFIRMATION DE SUPPRESSION */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} PaperProps={{ sx: { borderRadius: '16px', minWidth: '350px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Voulez-vous vraiment supprimer ce membre ? Cette action effacera toutes ses données définitivement.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenConfirm(false)} sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'none' }}>
            Annuler
          </Button>
          <Button 
            onClick={confirmDelete} 
            variant="contained" 
            color="error" 
            sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}
          >
            Supprimer définitivement
          </Button>
        </DialogActions>
      </Dialog>

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
            href={`${URL}/public/templates/modeleImportMembreIdentite.xlsx`} // Lien vers le fichier sur votre serveur
            download="Modele_Import_Membres.xlsx"
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
    </Box>
  );
};

export default MembresListe;
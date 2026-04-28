import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Button, Typography, Paper, Stack, Chip, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Tooltip, FormControlLabel, Switch, 
  Breadcrumbs,
  Link
} from '@mui/material';
import { 
  AddOutlined, DeleteOutlined, CalendarMonthOutlined, 
  CheckCircleOutline, LockOutlined, EditOutlined, 
  NavigateNext,
  HomeOutlined
} from '@mui/icons-material';
import toast, { Toaster } from 'react-hot-toast';
import useAxiosPrivate from '../../../config/axiosPrivate';

const MyBreadcrumbs = ({ currentPath }) => (
  <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
    <Link underline="hover" color="inherit" href="/dashboard" sx={{ display: 'flex', alignItems: 'center' }}>
      <HomeOutlined sx={{ mr: 0.5, fontSize: 20 }} /> Dashboard
    </Link>
    <Typography color="text.primary" sx={{ fontWeight: 600 }}>{currentPath}</Typography>
  </Breadcrumbs>
);

const Exercices = () => {
  const axiosPrivate = useAxiosPrivate();
  const [exercices, setExercices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // États pour le dialogue Formulaire (Add/Edit)
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ libelle: '', date_debut: '', date_fin: '', cloture: false });

  // États pour le dialogue de Confirmation de suppression
  const [openConfirm, setOpenConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // --- RÉCUPÉRATION ---
  const fetchExercices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosPrivate.get('/api/exercices');
      setExercices(res.data);
    } catch (err) {
      console.error("Erreur chargement:", err);
      toast.error("Erreur lors du chargement des exercices");
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate]);

  useEffect(() => { fetchExercices(); }, [fetchExercices]);

  // --- OUVERTURE DIALOGUE (Création ou Modif) ---
  const handleOpenDialog = (ex = null) => {
    if (ex) {
      setIsEdit(true);
      setCurrentId(ex.id);
      setFormData({ 
        libelle: ex.libelle, 
        date_debut: ex.date_debut, 
        date_fin: ex.date_fin, 
        cloture: ex.cloture 
      });
    } else {
      setIsEdit(false);
      setFormData({ libelle: '', date_debut: '', date_fin: '', cloture: false });
    }
    setOpen(true);
  };

  // --- SAUVEGARDE (Create ou Update) ---
  const handleSave = async () => {
    if (!formData.date_debut || !formData.date_fin) {
        return toast.error("Les dates sont requises");
    }

    const loadId = toast.loading("Enregistrement...");
    try {
      if (isEdit) {
        const res = await axiosPrivate.put(`/api/exercices/${currentId}`, formData);
        setExercices(exercices.map(ex => ex.id === currentId ? res.data : ex));
        toast.success("Exercice mis à jour", { id: loadId });
      } else {
        const res = await axiosPrivate.post('/api/exercices', formData);
        setExercices([res.data, ...exercices]);
        toast.success("Nouvel exercice ouvert", { id: loadId });
      }
      setOpen(false);
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement", { id: loadId });
    }
  };

  // --- SUPPRESSION (Logique Popup) ---
  const handleOpenConfirm = (id) => {
    setDeleteId(id);
    setOpenConfirm(true);
  };

  const confirmDelete = async () => {
    const loadId = toast.loading("Suppression...");
    try {
      await axiosPrivate.delete(`/api/exercices/${deleteId}`);
      setExercices(exercices.filter(ex => ex.id !== deleteId));
      toast.success("Exercice supprimé", { id: loadId });
    } catch (err) { 
      toast.error("Erreur lors de la suppression", { id: loadId }); 
    } finally {
      setOpenConfirm(false);
      setDeleteId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <Box sx={{ maxWidth: 12000, mx: 'auto', p: 0 }}>
        <Toaster position="top-right" />
        <MyBreadcrumbs currentPath="Exercices" />
      
      {/* HEADER */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 4 }}>
        <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <CalendarMonthOutlined sx={{ color: '#435844' }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1A1D1F' }}>
                Exercices Comptables
            </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 500 }}>
            Définissez les dates des exercices de l'Ordre.
            </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddOutlined />}
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: '#435844', '&:hover': { bgcolor: '#354736' }, borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
        >
          Ouvrir un exercice
        </Button>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: 'none' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: '#F8FAF9', fontWeight: 700 }}>LIBELLÉ</TableCell>
              <TableCell sx={{ bgcolor: '#F8FAF9', fontWeight: 700 }}>DÉBUT</TableCell>
              <TableCell sx={{ bgcolor: '#F8FAF9', fontWeight: 700 }}>FIN</TableCell>
              <TableCell sx={{ bgcolor: '#F8FAF9', fontWeight: 700 }}>STATUT</TableCell>
              <TableCell sx={{ bgcolor: '#F8FAF9', fontWeight: 700 }} align="right">ACTIONS</TableCell>
            </TableRow>
          </TableHead>
            <TableBody>
                {loading ? (
                    <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                        <CircularProgress size={30} sx={{ color: '#435844' }} />
                    </TableCell>
                    </TableRow>
                ) : (
                    exercices.map((ex) => (
                    <TableRow key={ex.id} hover>
                        <TableCell sx={{ py: 1.5, fontWeight: 600 }}>{ex.libelle}</TableCell>
                        <TableCell sx={{ py: 1.5 }}>{formatDate(ex.date_debut)}</TableCell>
                        <TableCell sx={{ py: 1.5 }}>{formatDate(ex.date_fin)}</TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                        {ex.cloture ? (
                            <Chip label="Clôturé" size="small" icon={<LockOutlined />} sx={{ height: 24, fontSize: '0.75rem' }} />
                        ) : (
                            <Chip label="Ouvert" size="small" icon={<CheckCircleOutline />} sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', height: 24, fontSize: '0.75rem' }} />
                        )}
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1.5 }}>
                        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                            <Tooltip title="Modifier">
                            <IconButton onClick={() => handleOpenDialog(ex)} size="small" sx={{ color: '#435844' }}>
                                <EditOutlined fontSize="small" />
                            </IconButton>
                            </Tooltip>
                            <Tooltip title="Supprimer">
                            <IconButton onClick={() => handleOpenConfirm(ex.id)} size="small" sx={{ color: '#d32f2f' }}>
                                <DeleteOutlined fontSize="small" />
                            </IconButton>
                            </Tooltip>
                        </Stack>
                        </TableCell>
                    </TableRow>
                    ))
                )}
                </TableBody>
        </Table>
      </TableContainer>

      {/* DIALOGUE FORMULAIRE (ADD & EDIT) */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{isEdit ? "Modifier l'exercice" : "Nouvel exercice"}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField 
              label="Libellé" 
              fullWidth 
              value={formData.libelle}
              onChange={(e) => setFormData({...formData, libelle: e.target.value})} 
            />
            <TextField 
              label="Début" type="date" fullWidth InputLabelProps={{ shrink: true }}
              value={formData.date_debut}
              onChange={(e) => setFormData({...formData, date_debut: e.target.value})} 
            />
            <TextField 
              label="Fin" type="date" fullWidth InputLabelProps={{ shrink: true }}
              value={formData.date_fin}
              onChange={(e) => setFormData({...formData, date_fin: e.target.value})} 
            />
            {isEdit && (
              <FormControlLabel
                control={<Switch checked={formData.cloture} onChange={(e) => setFormData({...formData, cloture: e.target.checked})} />}
                label={formData.cloture ? "Exercice Clôturé" : "Exercice Ouvert"}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>Annuler</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#435844', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#354736' } }}>
            {isEdit ? "Mettre à jour" : "Confirmer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOGUE DE CONFIRMATION DE SUPPRESSION */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} PaperProps={{ sx: { borderRadius: '12px', minWidth: '320px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Supprimer l'exercice ?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Cette action supprimera définitivement cet exercice comptable.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenConfirm(false)} sx={{ color: 'text.secondary', textTransform: 'none' }}>Annuler</Button>
          <Button onClick={confirmDelete} variant="contained" color="error" sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Exercices;
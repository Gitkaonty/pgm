import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Button, Typography, Paper, Stack, Chip, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, IconButton, 
  TextField, MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Breadcrumbs,
  Link
} from '@mui/material';
import { 
  AddOutlined, DeleteOutlined, SaveOutlined, 
  PaymentsOutlined, EditOutlined, CloseOutlined, 
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

const GrilleTarifaire = () => {
  const axiosPrivate = useAxiosPrivate();
  const [exercices, setExercices] = useState([]);
  const [selectedEx, setSelectedEx] = useState('');
  const [tarifs, setTarifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null); 

  // États pour la suppression propre
  const [openConfirm, setOpenConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // --- Helpers de style pour les badges ---
  const getSectionStyle = (section) => {
    if (section === 'Société Expert') return { bgcolor: '#E3F2FD', color: '#1976D2', fontWeight: 700 };
    return { bgcolor: '#F3E5F5', color: '#7B1FA2', fontWeight: 700 };
  };

  const getStatutStyle = (statut) => {
    switch (statut) {
      case 'Expert Comptable': return { border: '1px solid #435844', color: '#435844', bgcolor: 'transparent' };
      case 'Expert Stagiaire': return { border: '1px solid #FFA000', color: '#FFA000', bgcolor: 'transparent' };
      default: return { border: '1px solid #9E9E9E', color: '#9E9E9E' };
    }
  };

  const getTitreStyle = (titre) => {
    return { bgcolor: '#ECEFF1', color: '#455A64', fontSize: '0.75rem' };
  };

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const resEx = await axiosPrivate.get('/api/exercices');
      setExercices(resEx.data);
      if (resEx.data.length > 0) {
        const firstExId = resEx.data[0].id;
        setSelectedEx(firstExId);
        const resTarif = await axiosPrivate.get(`/api/grille-tarifaire?exercice_id=${firstExId}`);
        setTarifs(resTarif.data);
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, [axiosPrivate]);

  const fetchTarifs = useCallback(async () => {
    if (!selectedEx) return;
    try {
      const res = await axiosPrivate.get(`/api/grille-tarifaire?exercice_id=${selectedEx}`);
      setTarifs(res.data);
    } catch (err) { console.error(err); }
  }, [axiosPrivate, selectedEx]);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);
  useEffect(() => { fetchTarifs(); }, [fetchTarifs]);

  const handleAddRow = () => {
    const newId = 'temp-' + Date.now();
    const newRow = {
      id: newId,
      exercice_id: selectedEx,
      section: 'Expert Comptable',
      statut: 'Expert Comptable',
      titre: 'Tableau A',
      regime: 0,
      nbr_associes_min: 0,
      nbr_associes_max: 0,
      montant: 0,
      isNew: true 
    };
    setTarifs([newRow, ...tarifs]);
    setEditId(newId);
  };

  const handleSaveRow = async (row) => {
    const loadingToast = toast.loading('Sauvegarde en cours...');
    try {
      const { id, isNew, ...dataToPayload } = row;
      const cleanData = {
        ...dataToPayload,
        exercice_id: parseInt(dataToPayload.exercice_id, 10),
        regime: parseInt(dataToPayload.regime, 10),
        nbr_associes_min: parseInt(dataToPayload.nbr_associes_min, 10) || 0,
        nbr_associes_max: parseInt(dataToPayload.nbr_associes_max, 10) || 0,
        montant: parseFloat(dataToPayload.montant) || 0,
        statut: dataToPayload.statut 
      };

      let res;
      if (isNew) {
        res = await axiosPrivate.post('/api/grille-tarifaire', cleanData);
        setTarifs(prev => prev.map(t => t.id === id ? { ...res.data, isNew: false } : t));
      } else {
        res = await axiosPrivate.put(`/api/grille-tarifaire/${id}`, cleanData);
        setTarifs(prev => prev.map(t => t.id === id ? res.data : t));
      }
      
      setEditId(null);
      toast.success('Données enregistrées !', { id: loadingToast });
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de sauvegarde", { id: loadingToast });
    }
  };

  // Logique de suppression avec Dialog
  const askDelete = (id) => {
    setDeleteId(id);
    setOpenConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await axiosPrivate.delete(`/api/grille-tarifaire/${deleteId}`);
      setTarifs(tarifs.filter(t => t.id !== deleteId));
      toast.success('Tarif supprimé');
    } catch (err) { 
      toast.error("Erreur lors de la suppression"); 
    } finally {
      setOpenConfirm(false);
      setDeleteId(null);
    }
  };

  const handleChange = (id, field, value) => {
    setTarifs(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  return (
    <Box sx={{ maxWidth: 14000, mx: 'auto', p: 0 }}>
      <Toaster position="top-right" />
      <MyBreadcrumbs currentPath="Grille tarifaire" />
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <PaymentsOutlined sx={{ color: '#435844' }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1A2027' }}>Grille Tarifaire</Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Paramétrage des cotisations par exercice fiscal.</Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Exercice</InputLabel>
            <Select value={selectedEx} label="Exercice Fiscal" onChange={(e) => setSelectedEx(e.target.value)}>
              {exercices.map(ex => (
                <MenuItem key={ex.id} value={ex.id}>
                  {ex.libelle} : {new Date(ex.date_debut).toLocaleDateString('fr-FR')} - {new Date(ex.date_fin).toLocaleDateString('fr-FR')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button 
            variant="contained" startIcon={<AddOutlined />} onClick={handleAddRow}
            sx={{ bgcolor: '#435844', borderRadius: '8px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#354736' } }}
          >
            Nouveau tarif
          </Button>
        </Stack>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #ECEFF1' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#F8FAF9' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: '#455A64' }}>SECTION</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#455A64' }}>STATUT</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#455A64' }}>TITRE</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#455A64' }}>RÉGIME</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#455A64' }}>Associés MIN</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#455A64' }}>Associés MAX</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#455A64' }}>MONTANT (AR)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#455A64' }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tarifs.map((t) => {
              const isEditing = editId === t.id;
              return (
                <TableRow key={t.id} hover>
                  <TableCell>
                    {isEditing ? (
                      <Select size="small" value={t.section} onChange={(e) => handleChange(t.id, 'section', e.target.value)} fullWidth>
                        <MenuItem value="Expert Comptable">Expert Comptable</MenuItem>
                        <MenuItem value="Société Expert">Société Expert</MenuItem>
                      </Select>
                    ) : <Chip label={t.section} size="small" sx={{ ...getSectionStyle(t.section), borderRadius: '6px' }} />}
                  </TableCell>

                  <TableCell>
                    {isEditing ? (
                      <Select size="small" value={t.statut} onChange={(e) => handleChange(t.id, 'statut', e.target.value)} fullWidth>
                        <MenuItem value="Expert Comptable">Expert Comptable</MenuItem>
                        <MenuItem value="Expert Stagiaire">Expert Stagiaire</MenuItem>
                      </Select>
                    ) : <Chip label={t.statut} size="small" variant="outlined" sx={{ ...getStatutStyle(t.statut), borderRadius: '6px' }} />}
                  </TableCell>

                  <TableCell>
                    {isEditing ? (
                      <Select size="small" value={t.titre} onChange={(e) => handleChange(t.id, 'titre', e.target.value)} fullWidth>
                        <MenuItem value="Tableau A">Tableau A</MenuItem>
                        <MenuItem value="Tableau B">Tableau B</MenuItem>
                      </Select>
                    ) : <Chip label={t.titre} size="small" sx={getTitreStyle(t.titre)} />}
                  </TableCell>

                  <TableCell>
                    {isEditing ? (
                      <Select size="small" value={t.regime} onChange={(e) => handleChange(t.id, 'regime', e.target.value)} fullWidth>
                        <MenuItem value={0}>Normal</MenuItem>
                        <MenuItem value={1}>Réduit</MenuItem>
                      </Select>
                    ) : (
                      <Chip label={t.regime === 0 ? "Normal" : "Réduit"} size="small" 
                        sx={{ fontSize: '0.7rem', bgcolor: t.regime === 0 ? '#E8F5E9' : '#FFF3E0', color: t.regime === 0 ? '#2E7D32' : '#E65100' }} 
                      />
                    )}
                  </TableCell>

                  <TableCell>
                    {isEditing ? (
                      <TextField size="small" type="number" value={t.nbr_associes_min} onChange={(e) => handleChange(t.id, 'nbr_associes_min', e.target.value)} sx={{ width: 80 }} />
                    ) : <Typography variant="body2">{t.section === 'Société Expert' ? t.nbr_associes_min : '—'}</Typography>}
                  </TableCell>

                  <TableCell>
                    {isEditing ? (
                      <TextField size="small" type="number" value={t.nbr_associes_max} onChange={(e) => handleChange(t.id, 'nbr_associes_max', e.target.value)} sx={{ width: 80 }} />
                    ) : <Typography variant="body2">{t.section === 'Société Expert' ? t.nbr_associes_max : '—'}</Typography>}
                  </TableCell>

                  <TableCell align="right">
                    {isEditing ? (
                      <TextField 
                        size="small" type="number" value={t.montant} 
                        onChange={(e) => handleChange(t.id, 'montant', e.target.value)} 
                        sx={{ width: 120 }}
                        inputProps={{ style: { textAlign: 'right' } }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#435844' }}>
                        {new Intl.NumberFormat('fr-MG').format(t.montant)} Ar
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell align="right">
                    {isEditing ? (
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton onClick={() => handleSaveRow(t)} color="success" size="small"><SaveOutlined fontSize="small" /></IconButton>
                        <IconButton onClick={() => { setEditId(null); if(t.isNew) setTarifs(prev => prev.filter(x => x.id !== t.id)) }} color="inherit" size="small"><CloseOutlined fontSize="small" /></IconButton>
                      </Stack>
                    ) : (
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton onClick={() => setEditId(t.id)} size="small" sx={{ color: '#1976d2' }}><EditOutlined fontSize="small" /></IconButton>
                        <IconButton onClick={() => askDelete(t.id)} color="error" size="small"><DeleteOutlined fontSize="small" /></IconButton>
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* POPUP DE CONFIRMATION MUI */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} PaperProps={{ sx: { borderRadius: '12px', minWidth: '350px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Voulez-vous vraiment supprimer ce tarif ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenConfirm(false)} sx={{ color: 'text.secondary', fontWeight: 600 }}>Annuler</Button>
          <Button onClick={confirmDelete} variant="contained" color="error" sx={{ borderRadius: '8px', fontWeight: 700 }}>Supprimer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GrilleTarifaire;
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Button, Typography, Paper, Stack, Breadcrumbs, Link,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Drawer, Divider, IconButton, TextField, MenuItem, Grid,
  Avatar, InputAdornment, Card,
  Chip,
  TableContainer,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  HistoryOutlined, EditNoteOutlined, NavigateNext, HomeOutlined,
  FileUploadOutlined, CloseOutlined, SaveOutlined,
  SearchOutlined, ArrowForwardOutlined,
  BusinessCenterOutlined,
  LocationOnOutlined, AlternateEmailOutlined,
  PersonOutline,
  DeleteOutline,
  FileDownloadOutlined,
  ArrowForwardIosOutlined
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

const FastTextField = ({ label, value, onSave, ...props }) => {
  const [localValue, setLocalValue] = React.useState(value);

  // Si la valeur change (ex: sélection d'une version), on met à jour l'état local
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <TextField
      {...props}
      label={label}
      value={localValue || ''}
      onChange={(e) => setLocalValue(e.target.value)} // Ultra rapide car local
      onBlur={() => onSave(localValue)} // Enregistre dans le vrai formData quand on sort
    />
  );
};

// --- COMPOSANTS UTILITAIRES POUR LE DESIGN DU FORMULAIRE ---

const InfoBlock = ({ title, icon, children }) => (
  <Box sx={{ mb: 3 }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, color: '#1e293b' }}>
      {icon}
      <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </Typography>
    </Stack>
    <Paper elevation={0} sx={{ p: 2, bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      {children}
    </Paper>
  </Box>
);

// Options pour les Listbox (à adapter selon tes besoins réels)
const options = {
  section: ['Expert Comptable', 'Société Expert'],
  statut: ['Expert Comptable', 'Expert Stagiaire'],
  titre: ['Tableau A', 'Tableau B', 'Stagiaire'],
  poste: ['Caissier', 'Conseiller', 'Membre', 'Président', 'Président d honneur', 'Vice-Président Administratif', 'Vice-Président Technique', 'Secrétaire Exécutif', 'Secrétaire Général', 'Secrétaire Général Adjoint', 'Trésorier'],
  situation: ['En activité', 'Inactive', 'Suspendu'],
  sexe: [{ val: 'M', lab: 'Masculin' }, { val: 'F', lab: 'Féminin' }],
  active: ['Oui', 'Non'],
  region: ["Alaotra-Mangoro",	"Amoron'i Mania",	"Analamanga",	"Analanjirofo",	"Androy",	"Anosy",	"Atsimo-Andrefana",	"Atsimo-Atsinanana",	"Atsinanana",	"Betsiboka",	"Boeny",	"Bongolava",	"Diana",	"Fitovinany",	"Ihorombe",	"Itasy",	"Matsiatra Ambony",	"Melaky",	"Menabe",	"Sava",	"Sofia",	"Vakinankaratra",	"Vatovavy"]
};

const regionListe = ["Alaotra-Mangoro",	"Amoron'i Mania",	"Analamanga",	"Analanjirofo",	"Androy",	"Anosy",	"Atsimo-Andrefana",	"Atsimo-Atsinanana",	"Atsinanana",	"Betsiboka",	"Boeny",	"Bongolava",	"Diana",	"Fitovinany",	"Ihorombe",	"Itasy",	"Matsiatra Ambony",	"Melaky",	"Menabe",	"Sava",	"Sofia",	"Vakinankaratra",	"Vatovavy"];

const EditMembreDrawer = ({ open, onClose, formData, setFormData, onSave, onFinalSubmit, datesHistorique, selectedDate, handleVersionChange, onDeleteVersion, setSelectedFile }) => {
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const appUrl = URL;
  //const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(window.URL.createObjectURL(file));
    }
  };

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  // Cette fonction s'exécute uniquement quand on quitte le champ
  const handleBlur = (field) => (e) => {
    const newValue = e.target.value;
    // On ne met à jour que si la valeur a vraiment changé
    if (formData[field] !== newValue) {
      setFormData({ ...formData, [field]: newValue });
    }
  };

  const confirmAndFieldDelete = () => {
    onDeleteVersion(); // Appel de la fonction de suppression réelle
    setOpenConfirmDelete(false); // Fermeture de la popup après l'appel
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 600 }, border: 'none', bgcolor: '#f8fafc' } }}
    >
      {formData && (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

          {/* HEADER DYNAMIQUE */}
          <Box sx={{ p: 4, background: 'linear-gradient(135deg, #1d4634 0%, #2d6a4f 100%)', color: 'white', position: 'relative' }}>
            <IconButton
              onClick={() => setOpenUpdate(false)}
              sx={{ position: 'absolute', right: 12, top: 12, color: 'rgba(255,255,255,0.7)' }}
            >
              <CloseOutlined />
            </IconButton>
            <Stack direction="row" spacing={3} alignItems="center">
              <Box 
                sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: 2 // Ajoute un espace propre de 16px entre l'avatar et le bouton
                  }}
              >
                <Avatar
                  src={preview ? preview : (formData.photo_url ? `${appUrl}/uploads/profiles/${formData.photo_url}` : '')}
                  sx={{ width: 80, height: 80, border: '4px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}
                >
                  {/* {formData.nom?.charAt(0)} */}
                </Avatar>
                <Button size="small" variant="outlined" component="label" sx={{ textTransform: 'none', mb: 0, color:'white', bgcolor: 'rgba(255,255,255,0.15)' }}>
                    Modifier la photo
                    <input
                        key={formData.photo_url ? 'has-photo' : 'empty-photo'} // Force le reset de l'input quand preview change
                        type="file" 
                        hidden 
                        accept="image/*" 
                        onChange={handleFileChange} 
                    />
                </Button>
              </Box>
              
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 0 }}>Modification Profil</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {formData.nom} {formData.prenom}
                </Typography>
                <Chip
                  label={`Matricule: ${formData.matricule}`}
                  size="small"
                  sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 700 }}
                />
              </Box>
            </Stack>
          </Box>

          {/* CORPS DU FORMULAIRE */}
          <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>

            {/* Sélecteur de versions existantes */}
            <Grid item xs={selectedDate === 'new' ? 6 : 12}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>
                HISTORIQUE DES MODIFICATIONS
              </Typography>

              <Stack direction="row" spacing={1} alignItems="flex-start">
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={selectedDate}
                  onChange={(e) => handleVersionChange(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#f1f5f9', mb: 3 } }}
                >
                  <MenuItem value="new" sx={{ fontWeight: 700, color: '#2d6a4f' }}>
                    + NOUVELLE MISE À JOUR
                  </MenuItem>
                  <Divider />
                  {datesHistorique.map((d) => (
                    <MenuItem key={d.date_modification} value={d.date_modification}>
                      Version du {new Date(d.date_modification).toLocaleDateString('fr-FR')}
                    </MenuItem>
                  ))}
                </TextField>

                <IconButton
                  color="error"
                  disabled={selectedDate === 'new'} // Désactivé si "new"
                  onClick={() => setOpenConfirmDelete(true)} // Ouvre la popup
                  sx={{ bgcolor: '#fff1f0', '&:hover': { bgcolor: '#ffccc7' }, borderRadius: '8px' }}
                >
                  <DeleteOutline />
                </IconButton>
              </Stack>
            </Grid>

            {selectedDate === 'new' ?
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>DATE DE MODIFICATION</Typography>
                <TextField sx={{ width: 200 }} fullWidth size="small" type="date" value={formData.date_modification || ''} onChange={handleChange('date_modification')} />
              </Grid>
              : null
            }

            <Box sx={{ mb: 3 }}></Box>

            {/* 1. ADMINISTRATION (AVEC LISTBOX) */}
            <InfoBlock title="Situation OECFM" icon={<BusinessCenterOutlined />}>
              <Grid container spacing={2}>
                {[
                  { id: 'situation', label: 'Situation', type: 'select', opt: options.situation },
                  { id: 'statut', label: 'Statut', type: 'select', opt: options.statut },
                  { id: 'section', label: 'Section', type: 'select', opt: options.section },
                  { id: 'titre', label: 'Titre', type: 'select', opt: options.titre },
                  { id: 'poste', label: 'Poste occupé', type: 'select', opt: options.poste },
                  { id: 'promotion', label: 'Promotion', type: 'text' },
                  { id: 'membre_active', label: 'Membre Actif', type: 'select', opt: options.active },
                  { id: 'date_adhesion', label: "Date d'adhésion", type: 'date' },
                ].map((item) => (
                  <Grid item xs={6} key={item.id}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>
                      {item.label.toUpperCase()}
                    </Typography>
                    <TextField
                      select={item.type === 'select'}
                      fullWidth size="small"
                      type={item.type === 'date' ? 'date' : 'text'}
                      value={formData[item.id] || ''}
                      onChange={handleChange(item.id)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    >
                      {item.type === 'select' && item.opt.map((o) => (
                        <MenuItem key={o} value={o}>{o}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                ))}

                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>DIPLOME</Typography>
                  <FastTextField
                    fullWidth size="small"
                    value={formData.diplome || ''}
                    onChange={handleChange('diplome')}
                    onSave={(val) => setFormData({ ...formData, diplome: val })}
                  />
                </Grid>
              </Grid>
            </InfoBlock>

            {/* 2. CONTACTS & COMPTES */}
            <InfoBlock title="Contacts & Finances" icon={<AlternateEmailOutlined />}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>EMAIL OECFM</Typography>
                  <FastTextField
                    fullWidth size="small"
                    value={formData.email_oecfm || ''}
                    onChange={handleChange('email_oecfm')}
                    onSave={(val) => setFormData({ ...formData, email_oecfm: val })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>EMAIL PRO.</Typography>
                  <FastTextField
                    fullWidth
                    size="small"
                    value={formData.email_professionnel || ''}
                    onChange={handleChange('email_professionnel')}
                    onSave={(val) => setFormData({ ...formData, email_professionnel: val })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>EMAIL PERSO.</Typography>
                  <FastTextField
                    fullWidth size="small"
                    value={formData.email_personnel || ''}
                    onChange={handleChange('email_personnel')}
                    onSave={(val) => setFormData({ ...formData, email_personnel: val })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>TÉLÉPHONE</Typography>
                  <FastTextField
                    fullWidth size="small"
                    value={formData.telephone || ''}
                    onChange={handleChange('telephone')}
                    onSave={(val) => setFormData({ ...formData, telephone: val })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>FAX</Typography>
                  <FastTextField fullWidth size="small" value={formData.fax || ''}
                    onChange={handleChange('fax')}
                    onSave={(val) => setFormData({ ...formData, fax: val })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>N° COMPTE</Typography>
                  <FastTextField fullWidth size="small"
                    value={formData.num_compte || ''}
                    onChange={handleChange('num_compte')}
                    onSave={(val) => setFormData({ ...formData, num_compte: val })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>NB ASSOCIÉS</Typography>
                  <TextField fullWidth size="small" type="number"
                    value={formData.nombre_associe || ''}
                    onChange={handleChange('nombre_associe')}
                    onSave={(val) => setFormData({ ...formData, nombre_associe: val })}
                  />
                </Grid>
              </Grid>
            </InfoBlock>

            {/* 3. LOCALISATION */}
            <InfoBlock title="Localisation" icon={<LocationOnOutlined />}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>ADRESSE</Typography>
                  <FastTextField fullWidth multiline
                    rows={2} value={formData.adresse || ''}
                    onChange={handleChange('adresse')}
                    onSave={(val) => setFormData({ ...formData, adresse: val })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>VILLE</Typography>
                  <FastTextField fullWidth
                    size="small" value={formData.ville || ''}
                    onChange={handleChange('ville')}
                    onSave={(val) => setFormData({ ...formData, ville: val })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>RÉGION</Typography>
                  <TextField
                    select={true}
                    fullWidth size="small"
                    type={'text'}
                    value={formData.region || ''}
                    onChange={handleChange('region')}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  >
                    {regionListe.map((o) => (
                      <MenuItem key={o} value={o}>{o}</MenuItem>
                    ))}
                  </TextField>
                  
                  
                  
                  {/* <FastTextField fullWidth size="small"
                    value={formData.region || ''}
                    onChange={handleChange('region')}
                    onSave={(val) => setFormData({ ...formData, region: val })}
                  /> */}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>CODE POSTAL</Typography>
                  <FastTextField fullWidth size="small"
                    value={formData.code_postal || ''}
                    onChange={handleChange('code_postal')}
                    onSave={(val) => setFormData({ ...formData, code_postal: val })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>BOITE POSTALE</Typography>
                  <FastTextField fullWidth size="small"
                    value={formData.boite_postale || ''}
                    onChange={handleChange('boite_postale')}
                    onSave={(val) => setFormData({ ...formData, boite_postale: val })}
                  />
                </Grid>
              </Grid>
            </InfoBlock>

            {/* 4. IDENTITÉ PERSONNELLE */}
            <InfoBlock title="Identité & État Civil" icon={<PersonOutline />}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>SEXE</Typography>
                  <TextField disabled select fullWidth size="small" value={formData.sexe || ''} onChange={handleChange('sexe')}>
                    {options.sexe.map(s => <MenuItem key={s.val} value={s.val}>{s.lab}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>DATE DE NAISSANCE</Typography>
                  <TextField disabled fullWidth size="small" type="date" value={formData.date_naissance || ''} onChange={handleChange('date_naissance')} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>LIEU DE NAISSANCE</Typography>
                  <TextField fullWidth size="small"
                    disabled
                    value={formData.lieu_naissance || ''}
                  //onChange={handleChange('lieu_naissance')}
                  //onSave={(val) => setFormData({ ...formData, lieu_naissance: val })}
                  />
                </Grid>
                <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>N° CIN</Typography>
                  <TextField fullWidth size="small"
                    disabled
                    value={formData.cin || ''}
                  //onChange={handleChange('cin')}
                  //onSave={(val) => setFormData({ ...formData, cin: val })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>DÉLIVRÉ LE</Typography>
                  <TextField disabled fullWidth size="small" type="date" value={formData.date_cin || ''} onChange={handleChange('date_cin')} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>À (LIEU CIN)</Typography>
                  <TextField fullWidth size="small"
                    disabled
                    value={formData.lieu_cin || ''}
                  //onChange={handleChange('lieu_cin')}
                  //onSave={(val) => setFormData({ ...formData, lieu_cin: val })}
                  />
                </Grid>
              </Grid>
            </InfoBlock>
          </Box>

          {/* ACTIONS */}
          <Box sx={{ p: 3, bgcolor: 'white', borderTop: '1px solid #e2e8f0' }}>
            <Stack direction="row" spacing={2}>
              <Button fullWidth variant="outlined" onClick={onClose} sx={{ borderRadius: '12px', py: 1.5, textTransform: 'none', fontWeight: 700, color: '#64748b' }}>
                Annuler
              </Button>
              <Button
                fullWidth variant="contained"
                startIcon={<SaveOutlined />}
                onClick={onFinalSubmit}
                sx={{ bgcolor: '#1d4634', borderRadius: '12px', py: 1.5, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#1e293b' } }}
              >
                Sauvegarder les modifications
              </Button>
            </Stack>
          </Box>

          <Dialog open={openConfirmDelete} onClose={() => setOpenConfirmDelete(false)}>
            <DialogTitle>Supprimer cette version ?</DialogTitle>
            <DialogContent>
              <Typography>
                Êtes-vous sûr de vouloir supprimer l'historique du {new Date(selectedDate).toLocaleDateString('fr-FR')} ?
                Cette action est irréversible.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenConfirmDelete(false)} color="inherit">Annuler</Button>
              <Button
                onClick={confirmAndFieldDelete}
                color="error"
                variant="contained"
                startIcon={<DeleteOutline />}
              >
                Supprimer définitivement
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </Drawer>
  );
};

const MembreMiseAJourPro = () => {
  const axiosPrivate = useAxiosPrivate();

  // --- ÉTATS PRINCIPAUX ---
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  // --- ÉTATS DRAWERS ---
  const [openHistory, setOpenHistory] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);

  // --- ÉTATS DONNÉES SÉLECTIONNÉES ---
  const [selectedMembre, setSelectedMembre] = useState(null);
  const [historique, setHistorique] = useState([]); // <--- C'était la cause de l'erreur
  const [formData, setFormData] = useState({});

  // --- ÉTATS IMPORT ---
  const [openImport, setOpenImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const excelInputRef = useRef(null);

  const [datesHistorique, setDatesHistorique] = useState([]);
  const [selectedDate, setSelectedDate] = useState('new'); // 'new' par défaut
  const [selectedFile, setSelectedFile] = useState(null);

  // --- LOGIQUE DE COMPARAISON (TRACER) ---
  const getDiffFields = (current, previous) => {
    if (!previous) return [];
    const exclude = ['id', 'createdAt', 'updatedAt', 'date_modification', 'date_edition'];
    return Object.keys(current).filter(key => 
      !exclude.includes(key) && String(current[key]) !== String(previous[key])
    );
  };

  // 1. Charger la liste des dates disponibles pour ce membre
  const fetchDatesVersions = async (membreId) => {
    try {
      const res = await axiosPrivate.get(`/api/membres-updates/dates/${membreId}`);
      if (res.data && res.data.length > 0) {
        setDatesHistorique(res.data);
        // On sélectionne la date la plus récente
        setSelectedDate(res.data[0].date_modification);
      } else {
        // Si pas d'historique, on bascule sur "nouvelle" par défaut
        setDatesHistorique([]);
        setSelectedDate('new');
      }
    } catch (err) {
      console.error("Erreur dates:", err);
    }
  };

  // --- CHARGEMENT DES DONNÉES ---
  const fetchMembres = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosPrivate.get('/api/membres');
      setRows(response.data);
    } catch (error) {
      toast.error("Erreur de chargement des membres");
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate]);

  useEffect(() => { fetchMembres(); }, [fetchMembres]);

  // 2. Charger les données d'une version précise
  const handleVersionChange = async (date) => {
    setSelectedDate(date);
    if (date === 'new') {
      // Si "Nouvelle date", on peut soit vider, soit garder les dernières infos connues
      setFormData({ ...formData, date_modification: new Date().toISOString().split('T')[0] });
      return;
    }

    try {
      const res = await axiosPrivate.get(`/api/membres-updates/version/${selectedMembre.id}/${date}`);
      const versionData = res.data[0] || {};
      setFormData({ ...versionData }); // On écrase le formulaire avec les vieilles données
    } catch (err) {
      toast.error("Erreur de récupération de la version");
    }
  };

  // --- ACTIONS ---
  const handleViewHistory = async (membre) => {
    setSelectedMembre(membre);
    try {
      const res = await axiosPrivate.get(`/api/membres-updates/historique/${membre.id}`);
      setHistorique(res.data);
      setOpenHistory(true);
    } catch (err) {
      toast.error("Erreur lors du chargement de l'historique");
    }
  };

  const handleOpenUpdate = async (membre) => {
    setSelectedMembre(membre);
    try {
      const res = await axiosPrivate.get(`/api/membres-updates/last/${membre.id}`);
      const lastData = res.data[0] || {};

      fetchDatesVersions(membre.id);

      setFormData({
        id: lastData.id,
        membre_id: membre.id,
        adresse: lastData.adresse,
        boite_postale: lastData.boite_postale,
        cin: lastData.cin,
        code_postal: lastData.code_postal,
        date_adhesion: lastData.date_adhesion,
        date_cin: lastData.date_cin,
        date_edition: lastData.date_edition,
        date_modification: lastData.date_modification,
        diplome: lastData.diplome,
        date_naissance: lastData.date_naissance,
        email_oecfm: lastData.email_oecfm,
        email_personnel: lastData.email_personnel,
        email_professionnel: lastData.email_professionnel,
        fax: lastData.fax,
        lieu_cin: lastData.lieu_cin,
        lieu_naissance: lastData.lieu_naissance,
        matricule: lastData.matricule,
        membre_active: lastData.membre_active,
        nom: lastData.nom,
        nombre_associe: lastData.nombre_associe,
        num_compte: lastData.num_compte,
        photo_url: lastData.photo_url,
        poste: lastData.poste,
        prenom: lastData.prenom,
        promotion: lastData.promotion,
        region: lastData.region,
        section: lastData.section,
        sexe: lastData.sexe,
        situation: lastData.situation,
        statut: lastData.statut,
        telephone: lastData.telephone,
        titre: lastData.titre,
        ville: lastData.ville
      });
      setOpenUpdate(true);
    } catch (err) {
      toast.error("Erreur de récupération des dernières données");
    }
  };

  const saveNewUpdate = async () => {
    const loadId = toast.loading(
      selectedDate === 'new'
        ? "Création d'une nouvelle version..."
        : "Mise à jour de la version sélectionnée..."
    );

    try {
      if (selectedDate === 'new') {
        // CAS 1 : NOUVELLE VERSION
        // On envoie les données au serveur pour créer une nouvelle ligne

        //attacher le nouveau fichier photo
        const data = new FormData();
        Object.keys(formData).forEach(key => {
          if (formData[key] !== null && formData[key] !== undefined) {
            data.append(key, formData[key]); // 👈 Tout votre texte est injecté ici !
          }
        });
        
        if (selectedFile) {
            data.append('photo', selectedFile);
        }

        await axiosPrivate.post('/api/membres-updates', data,{
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // CAS 2 : MODIFIER UNE VERSION EXISTANTE
        // On envoie un PUT vers une URL qui contient l'ID et la DATE précise
        // Exemple : /api/membres-updates/12/2026-05-12

        const data = new FormData();
        Object.keys(formData).forEach(key => {
          if (formData[key] !== null && formData[key] !== undefined) {
            data.append(key, formData[key]); // 👈 Tout votre texte est injecté ici !
          }
        });
        
        if (selectedFile) {
            data.append('photo', selectedFile);
        }

        await axiosPrivate.put(`/api/membres-updates/${formData.id}`, data,{
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success("Enregistré avec succès !", { id: loadId });

      // On ferme et on rafraîchit la liste
      setSelectedFile(null);
      setOpenUpdate(false);
      fetchMembres();

    } catch (err) {
      console.error("Erreur lors de la sauvegarde:", err);
      toast.error(err.response?.data?.message || "Échec de l'enregistrement", { id: loadId });
    }
  };

  const handleDeleteVersion = async () => {
    const loadId = toast.loading("Suppression de la version...");
    try {
      // On utilise l'ID de la ligne d'update contenu dans formData
      await axiosPrivate.delete(`/api/membres-updates/${formData.id}`);

      toast.success("Version supprimée", { id: loadId });
      //setOpenConfirmDelete(false);

      // On recharge les dates et on repasse sur "new"
      fetchDatesVersions(formData.membre_id);
      handleVersionChange('new');
    } catch (err) {
      toast.error("Erreur lors de la suppression", { id: loadId });
    }
  };

  // --- FILTRAGE TABLEAU ---
  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      row.nom?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.prenom?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.matricule?.toString().includes(searchText)
    );
  }, [rows, searchText]);

  // --- LOGIQUE IMPORT EXCEL ---
  const handleImportExcel = async () => {
    if (!importFile) return toast.error("Veuillez sélectionner un fichier");

    const data = new FormData();
    data.append('file', importFile);
    const loadId = toast.loading("Importation des données en cours...");

    try {
      await axiosPrivate.post('/api/membres-updates/import-excel', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Importation réussie !", { id: loadId });
      setOpenImport(false);
      //fetchUpdates(); // Rafraîchir la liste après import
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "Erreur lors de l'importation.";
      toast.error(errorMsg, { id: loadId });
    } finally {
      setImportFile(null);
      if (excelInputRef.current) excelInputRef.current.value = "";
    }
  };

  const columns = [
    {
      field: 'member',
      headerName: 'MEMBRE',
      flex: 1,
      renderCell: (params) => (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ height: '100%' }}>
          <Avatar sx={{ bgcolor: '#e8f6ea', color: '#237524', fontWeight: 800, fontSize: '0.75rem' }}>
            {params.row.nom?.charAt(0)}{params.row.prenom?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
              {params.row.nom} {params.row.prenom}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Matricule: {params.row.matricule || '---'}
            </Typography>
          </Box>
        </Stack>
      )
    },
    {
      field: 'actions',
      headerName: 'SUIVI ET ACTIONS',
      width: 200,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" sx={{ height: '100%' }}>
          <IconButton size="small" onClick={() => handleViewHistory(params.row)} sx={{ color: '#237524' }}>
            <HistoryOutlined fontSize="small" />
          </IconButton>
          <Button
            size="small"
            variant="contained"
            disableElevation
            onClick={() => handleOpenUpdate(params.row)}
            sx={{
              bgcolor: '#e3f8e4',
              color: '#237524',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.7rem',
              borderRadius: '8px',
              '&:hover': { bgcolor: '#e2e8f0' }
            }}
          >
            Mise à jour
          </Button>
        </Stack>
      )
    }
  ];

  return (
    <Box sx={{ p: 1, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <MyBreadcrumbs currentPath="Mise à jour infos membres" />

      <Stack direction="column" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
          Mise à jour des membres
        </Typography>

        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Consultation de l'effectif et traçabilité des modifications administratives.
        </Typography>
      </Stack>

      {/* HEADER SECTION */}
      <Stack direction="row" justifyContent="space-between" alignItems="end" sx={{ mb: 2, width: '100%' }}>
        <Box sx={{ flex: 1 }}></Box>
        <Button
          variant="contained"
          startIcon={<FileUploadOutlined />}
          onClick={() => setOpenImport(true)}
          sx={{ bgcolor: '#18681c', borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 3 }}
        >
          Import Excel
        </Button>
      </Stack>

      {/* SEARCH BAR */}
      <TextField
        fullWidth
        placeholder="Rechercher par nom ou matricule..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            bgcolor: '#fff',
            borderRadius: '12px',
            '& fieldset': { borderColor: '#e2e8f0' },
            '&:hover fieldset': { borderColor: '#cbd5e1' }
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchOutlined sx={{ color: '#94a3b8' }} />
            </InputAdornment>
          ),
        }}
      />

      {/* MAIN TABLE */}
      <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          loading={loading}
          autoHeight
          rowHeight={65}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#f8fafc',
              color: '#64748b',
              fontSize: '0.65rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderBottom: '1px solid #e2e8f0'
            },
            '& .MuiDataGrid-cell': { borderBottom: '1px solid #f1f5f9' },
            '& .MuiDataGrid-row:hover': { bgcolor: '#f8fafc', cursor: 'pointer' }
          }}
        />
      </Paper>

      {/* --- DRAWER : HISTORIQUE (AUDIT) --- */}
      <Drawer
        anchor="right"
        open={openHistory}
        onClose={() => setOpenHistory(false)}
        PaperProps={{ sx: { width: 600, bgcolor: '#f8fafc', boxShadow: '-10px 0 20px rgba(0,0,0,0.05)' } }}
      >
        {/* Header Sticky */}
        <Box sx={{ p: 3, bgcolor: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
                Journal des modifications
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e' }} />
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  {selectedMembre?.nom} {selectedMembre?.prenom}
                </Typography>
              </Stack>
            </Box>
            <IconButton onClick={() => setOpenHistory(false)} sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}>
              <CloseOutlined fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        {/* Contenu de l'historique */}
        <Box sx={{ p: 3 }}>
          {historique.map((h, i) => {
            // Pour Sequelize, on accède souvent à dataValues si c'est du brut, 
            // sinon on prend l'objet directement.
            const current = h.dataValues || h;
            const prev = historique[i + 1]?.dataValues || historique[i + 1] || null;
            const changedFields = getDiffFields(current, prev);

            // Liste exhaustive des champs à afficher (ton schéma)
            const allFields = [
              'membre_active','situation', 'statut', 'titre', 'section','diplome','nombre_associe','poste', 'email_oecfm','email_personnel',
              'email_professionnel', 'adresse',
              'ville','code_postal', 'boite_postale', 'telephone', 'fax',
              'region', 'num_compte' 
            ];

            return (
              <Box key={current.id} sx={{ position: 'relative', mb: 4, pl: 3, borderLeft: '2px solid #e2e8f0' }}>
                {/* Point de la Timeline */}
                <Box sx={{
                  position: 'absolute', left: -9, top: 0, width: 16, height: 16,
                  bgcolor: i === 0 ? '#22c55e' : '#cbd5e1',
                  borderRadius: '50%', border: '4px solid #f8fafc'
                }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  {i === 0 ? "Version Actuelle" : `Révision du ${new Date(current.date_modification).toLocaleDateString('fr-FR')}`}
                  {i === 0 && <Chip label="Live" size="small" sx={{ height: 18, bgcolor: '#dcfce7', color: '#166534', fontWeight: 700, fontSize: '0.65rem' }} />}
                </Typography>

                <Card elevation={0} sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        {allFields.map((field) => {
                          const isChanged = changedFields.includes(field);
                          const value = current[field];
                          const oldValue = prev ? prev[field] : null;

                          return (
                            <TableRow key={field} sx={{
                              bgcolor: isChanged ? '#f0fdf4' : 'transparent',
                              '&:last-child td': { border: 0 }
                            }}>
                              <TableCell sx={{ width: '35%', py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: isChanged ? '#166534' : '#94a3b8', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                  {field.replace('_', ' ')}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  {isChanged && prev && (
                                    <>
                                      <Typography variant="caption" sx={{ color: '#94a3b8', textDecoration: 'line-through' }}>
                                        {oldValue || 'vide'}
                                      </Typography>
                                      <ArrowForwardIosOutlined sx={{ fontSize: 12, color: '#22c55e' }} />
                                    </>
                                  )}
                                  <Typography variant="body2" sx={{
                                    fontWeight: isChanged ? 700 : 500,
                                    color: isChanged ? '#166534' : '#475569'
                                  }}>
                                    {value || <em style={{ color: '#cbd5e1' }}>vide</em>}
                                  </Typography>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Box>
            );
          })}
        </Box>
      </Drawer>

      {/* --- DRAWER : MISE À JOUR (FORMULAIRE) --- */}
      <EditMembreDrawer
        open={openUpdate}
        onClose={() => setOpenUpdate(false)}
        formData={formData}
        setFormData={setFormData}
        onFinalSubmit={saveNewUpdate}
        datesHistorique={datesHistorique}
        selectedDate={selectedDate}
        handleVersionChange={handleVersionChange}
        onDeleteVersion={handleDeleteVersion}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
      />

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

    </Box>
  );
};

export default MembreMiseAJourPro;
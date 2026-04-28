import React, { useState } from 'react';
import { 
  Box, Grid, TextField, Typography, Paper, MenuItem, 
  Avatar, Button, Divider, Alert 
} from '@mui/material';
import { BadgeOutlined, SaveOutlined, PhotoCameraOutlined, AssignmentIndOutlined } from '@mui/icons-material';
import useAxiosPrivate from '../../../config/axiosPrivate';

const FormulaireStatique = () => {
  const axiosPrivate = useAxiosPrivate();
  const [success, setSuccess] = useState(false);

  const initialState = {
    nom: '',
    prenom: '',
    sexe: 'M',
    date_naissance: '',
    lieu_naissance: '',
    matricule: '',
    cin: '',
    date_cin: '',
    lieu_cin: '',
    date_adhesion: '',
    promotion: ''
    };

  // --- 1. ETATS POUR TOUTES LES DONNEES ---
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    sexe: 'M',
    date_naissance: '',
    lieu_naissance: '',
    matricule: '',
    cin: '',
    date_cin: '',
    lieu_cin: '',
    date_adhesion: '',
    promotion: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // --- 2. GESTION DES EVENEMENTS ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
    });
    
    if (selectedFile) {
        data.append('photo', selectedFile);
    }

    try {
        const response = await axiosPrivate.post('/api/membres', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (response.status === 201) {
        setSuccess(true);
        
        // --- VIDER LE FORMULAIRE ICI ---
        setFormData(initialState); // Remet les textes à vide
        setSelectedFile(null);     // Supprime le fichier stocké
        setPreview(null);          // Enlève l'aperçu de l'image (l'avatar redevient vide)
        
        // Optionnel : faire disparaître le message de succès après 5 secondes
        setTimeout(() => setSuccess(false), 5000);
        }
    } catch (error) {
        console.error("Erreur lors de l'enregistrement", error);
    }
    };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ pb: 5 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 800, color: 'primary.main' }}>
        Identité Civile & Adhésion
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>Membre enregistré avec succès!</Alert>}

      <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #eef2f6', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
        <Grid container spacing={4}>
          
          {/* SECTION PHOTO & PROMO */}
          <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderRight: { md: '1px solid #eee' } }}>
            <Avatar 
              src={preview} 
              sx={{ width: 140, height: 140, mb: 2, bgcolor: '#f0f4f0', border: '3px solid #eef2f6' }}
            >
              {!preview && <PhotoCameraOutlined sx={{ fontSize: 50, color: 'primary.main' }} />}
            </Avatar>
            
            <Button size="small" variant="outlined" component="label" sx={{ textTransform: 'none', mb: 3 }}>
                Photo de profil
                <input 
                    key={preview ? 'has-photo' : 'empty-photo'} // Force le reset de l'input quand preview change
                    type="file" 
                    hidden 
                    accept="image/*" 
                    onChange={handleFileChange} 
                />
            </Button>

            <Divider sx={{ width: '80%', mb: 2 }} />
            
            <Typography variant="body2" sx={{ width: '80%', fontWeight: 600, mb: 1, alignSelf: 'flex-start' }}>Promotion</Typography>
            <TextField 
                sx={{width: '80%', mb: 1, alignSelf: 'flex-start'}}
              fullWidth name="promotion" value={formData.promotion} onChange={handleChange}
              placeholder="Ex: Promotion 2024" size="small" 
            />
          </Grid>

          {/* FORMULAIRE DETAILLÉ */}
          <Grid item xs={12} md={9}>
            <Grid container spacing={3}>
              
              {/* Identité de base */}
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Nom de famille</Typography>
                <TextField size="small" fullWidth name="nom" value={formData.nom} onChange={handleChange} placeholder="NOM" />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Prénoms</Typography>
                <TextField size="small" fullWidth name="prenom" value={formData.prenom} onChange={handleChange} placeholder="Prénoms" />
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Sexe</Typography>
                <TextField size="small" select fullWidth name="sexe" value={formData.sexe} onChange={handleChange}>
                  <MenuItem value="M">Masculin</MenuItem>
                  <MenuItem value="F">Féminin</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Date de naissance</Typography>
                <TextField size="small" type="date" fullWidth name="date_naissance" value={formData.date_naissance} onChange={handleChange} InputLabelProps={{ shrink: true }} />
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Lieu de naissance</Typography>
                <TextField size="small" fullWidth name="lieu_naissance" value={formData.lieu_naissance} onChange={handleChange} placeholder="Ville" />
              </Grid>

              <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption" color="text.secondary">PIÈCE D'IDENTITÉ (CIN)</Typography></Divider></Grid>

              {/* Détails CIN */}
              <Grid item xs={12} md={4}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Numéro CIN</Typography>
                <TextField size="small" fullWidth name="cin" value={formData.cin} onChange={handleChange} placeholder="000 000 000 000" />
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Délivré le</Typography>
                <TextField size="small" type="date" fullWidth name="date_cin" value={formData.date_cin} onChange={handleChange} InputLabelProps={{ shrink: true }} />
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>À (Lieu CIN)</Typography>
                <TextField size="small" fullWidth name="lieu_cin" value={formData.lieu_cin} onChange={handleChange} placeholder="Commune / District" />
              </Grid>

              <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption" color="text.secondary">ADMINISTRATION OECFM</Typography></Divider></Grid>

              {/* Administration */}
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Matricule OECFM</Typography>
                <TextField 
                    size="small"
                   fullWidth name="matricule" value={formData.matricule} onChange={handleChange}
                   placeholder="Ex: 045-OECFM/26" 
                   InputProps={{ startAdornment: <BadgeOutlined sx={{ mr: 1, color: 'action.active' }} /> }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Date d'adhésion</Typography>
                <TextField 
                    size="small"
                  type="date" fullWidth name="date_adhesion" value={formData.date_adhesion} onChange={handleChange} 
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ startAdornment: <AssignmentIndOutlined sx={{ mr: 1, color: 'action.active' }} /> }}
                />
              </Grid>

            </Grid>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          type="submit" 
          variant="contained" 
          size="large" 
          startIcon={<SaveOutlined />} 
          sx={{ px: 6, py: 1.5, fontWeight: 700, borderRadius: '12px', fontSize: '1rem' }}
        >
          Finaliser l'inscription
        </Button>
      </Box>
    </Box>
  );
};

export default FormulaireStatique;
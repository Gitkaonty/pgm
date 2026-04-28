import React, { useState } from 'react';
import { 
  Box, Typography, Tab, Tabs, Paper, Grid, TextField, Button, Avatar, Chip, Stack 
} from '@mui/material';
import { SaveOutlined, HistoryOutlined, PersonOutline } from '@mui/icons-material';

const MembreDetail = () => {
  const [tabValue, setTabValue] = useState(0);

  return (
    <Box>
      {/* HEADER DE LA FICHE */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 4, bgcolor: 'primary.main', color: 'white' }}>
        <Stack direction="row" spacing={3} alignItems="center">
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'secondary.main', fontSize: '2rem' }}>RA</Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>RAKOTO Andry</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>Matricule : 045-OECFM/2026</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip label="Expert-Comptable" size="small" sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 700 }} />
              <Chip label="Catégorie A" size="small" sx={{ bgcolor: 'secondary.main', color: 'primary.main' }} />
            </Stack>
          </Box>
          <Button variant="contained" color="secondary" startIcon={<SaveOutlined />}>
            Enregistrer les modifs
          </Button>
        </Stack>
      </Paper>

      {/* ONGLETS */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} textColor="primary" indicatorColor="primary">
          <Tab icon={<PersonOutline />} label="Identité Fixe" iconPosition="start" />
          <Tab icon={<HistoryOutlined />} label="Situation OECFM (Mise à jour)" iconPosition="start" />
        </Tabs>
      </Box>

      {/* CONTENU DES ONGLETS */}
      <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #eef2f6' }}>
        {tabValue === 0 ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">Nom (Inchangeable)</Typography>
              <TextField fullWidth disabled defaultValue="RAKOTO" variant="filled" sx={{ mt: 1 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">Prénoms</Typography>
              <TextField fullWidth disabled defaultValue="Andry" variant="filled" sx={{ mt: 1 }} />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={3}>
            {/* ICI LES INFOS QUI CHANGENT SOUVENT */}
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">Grade Actuel</Typography>
              <TextField select fullWidth defaultValue="Expert" SelectProps={{ native: true }} sx={{ mt: 1 }}>
                <option value="Stagiaire">Expert-Stagiaire</option>
                <option value="Expert">Expert-Comptable</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">Catégorie</Typography>
              <TextField select fullWidth defaultValue="A" SelectProps={{ native: true }} sx={{ mt: 1 }}>
                <option value="A">Catégorie A (Libéral)</option>
                <option value="B">Catégorie B (Salarié)</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">Statut</Typography>
              <TextField select fullWidth defaultValue="Actif" SelectProps={{ native: true }} sx={{ mt: 1 }}>
                <option value="Actif">Inscrit (Actif)</option>
                <option value="Omis">Omis</option>
                <option value="Honoraire">Honoraire</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">Adresse Professionnelle (Mise à jour)</Typography>
              <TextField fullWidth placeholder="Lot IVG..." sx={{ mt: 1 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">Téléphone Expert</Typography>
              <TextField fullWidth placeholder="+261 34..." sx={{ mt: 1 }} />
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default MembreDetail;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Grid, Paper, Stack, Button, Card, CardHeader, CardContent, Avatar, Divider, Tooltip, 
  TextField
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { 
  WarningOutlined, 
  AccountBalanceWalletOutlined, 
  DescriptionOutlined,
  PeopleAltOutlined,
  BusinessCenterOutlined,
  SchoolOutlined,
  CheckCircleOutline
} from '@mui/icons-material';
import { BarChart } from '@mui/x-charts';
import { useState, useEffect } from 'react';
import { MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import useAxiosPrivate from '../../config/axiosPrivate';
import { jwtDecode } from 'jwt-decode';
import useAuth from '../hooks/useAuth';

const PromotionsChart = ({ data }) => {
  // On définit une couleur principale (ton vert sombre actuel ou un bleu SaaS)
  const MAIN_COLOR = '#435844';

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        borderRadius: 4, 
        border: '1px solid #eef2f6',
        width: '100%',
        height: 350
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}>
        Évolution par Promotion
      </Typography>

      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={data}
          margin={{ top: 25, right: 10, left: -20, bottom: 0 }}
        >
          {/* Grille horizontale discrète */}
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          
          <XAxis 
            dataKey="promotion" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }}
            dy={10}
          />
          
          {/* On cache l'axe Y pour un look plus moderne puisque les chiffres sont sur les barres */}
          <YAxis hide domain={[0, 'dataMax + 10']} />
          
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
            }}
          />

          <Bar 
            dataKey="count" 
            fill={MAIN_COLOR} 
            radius={[6, 6, 0, 0]} 
            barSize={45}
          >
            {/* --- AFFICHAGE DU NOMBRE SUR CHAQUE BARRE --- */}
            <LabelList 
              dataKey="count" 
              position="top" 
              style={{ fill: MAIN_COLOR, fontWeight: 700, fontSize: 13 }} 
              offset={10}
            />
            
            {/* Optionnel : changer la couleur au survol ou selon la valeur */}
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={MAIN_COLOR} fillOpacity={0.9} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

const DashboardHome = () => {
  // États pour stocker les données du backend
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [promotion, setPromotion] = useState(null);
  const [selectedEx, setSelectedEx] = useState(null); // Par défaut l'année en cours
  const [exercices, setExercices] = useState([]);

  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();
  const navigate = useNavigate();

  const decoded = auth?.accessToken
          ? jwtDecode(auth.accessToken)
          : undefined
  
  const roles = decoded.UserInfo.roles;
  const userId = decoded.UserInfo.userId || null;

  // 1. Chargement initial des exercices
  useEffect(() => {
    const initDashboard = async () => {
      try {
        const resEx = await axiosPrivate.get('/api/exercices');
        setExercices(resEx.data);
        
        // On sélectionne le premier exercice par défaut
        if (resEx.data.length > 0) {
          setSelectedEx(resEx.data[0].id);
        }
      } catch (err) {
        console.error("Erreur initialisation:", err);
      }
    };
    initDashboard();
  }, []);

  // 2. Chargement des stats quand l'exercice change
  useEffect(() => {
    if (!selectedEx) return;

    const fetchStats = async () => {
      setLoading(true);

      try {
        // On envoie l'ID de l'exercice au contrôleur
        const res = await axiosPrivate.get(`/api/dashboard/stats/${selectedEx}`);
        setStats(res.data);
      } catch (err) {
        console.error("Erreur stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedEx]);

  if (loading) return <Typography sx={{ p: 3 }}>Chargement des données...</Typography>;
  if (!stats) return <Typography sx={{ p: 3 }}>Erreur de chargement.</Typography>;
  
  // Données pour les graphiques
  const dataCategories = [
    { id: 0, value: stats.catA, label: 'Tableau A', color: '#435844' },
    { id: 1, value: stats.catB, label: 'Tableau B', color: '#8bc34a' },
  ];

  const dataTypes = [
    { id: 0, value: stats.expertsCount, label: 'Experts', color: '#435844' },
    { id: 1, value: stats.stagiairesCount, label: 'Stagiaires', color: '#ffb74d' },
    { id: 2, value: stats.societesCount, label: 'Sociétés', color: '#2196f3' },
  ];

  // Configuration des compteurs globaux
  const globalStats = [
    { label: 'Total Membres', value: stats.totalMembres.toLocaleString(), icon: <PeopleAltOutlined />, color: '#435844', bg: '#f0f4f0' },
    { label: 'Experts Comptables', value: stats.expertsCount, icon: <CheckCircleOutline />, color: '#2e7d32', bg: '#e8f5e9' },
    { label: 'Stagiaires', value: stats.stagiairesCount, icon: <SchoolOutlined />, color: '#ed6c02', bg: '#fff3e0' },
    { label: 'Sociétés d’Experts', value: stats.societesCount, icon: <BusinessCenterOutlined />, color: '#0288d1', bg: '#e1f5fe' },
  ];

  const fNum = (val) => {
        if (val === undefined || val === null) return "0";
        
        // 1. On convertit en entier pour enlever les virgules si besoin
        // 2. On utilise une regex pour ajouter un espace tous les 3 chiffres
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };

  const handleOpenPaiement = () => {
    //navigate("/cotisation/paiement");
  }

  return (
    <Box sx={{ pb: 5 }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 800, color: 'primary.main' }}>
        Vue d'ensemble OECFM
      </Typography>

      <Box sx={{ maxWidth: 400, mb:5 }}>
        <InputLabel sx={{ mb: 1, fontWeight: 700, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Exercice de référence</InputLabel>
        <TextField select fullWidth size="small" value={selectedEx} onChange={(e) => setSelectedEx(e.target.value)} sx={{ bgcolor: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } }}>
          {exercices.map(ex => (
            <MenuItem key={ex.id} value={ex.id}>
              {ex.libelle} : {new Date(ex.date_debut).toLocaleDateString('fr-FR')} - {new Date(ex.date_fin).toLocaleDateString('fr-FR')}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Grid container spacing={3}>
        
        {/* --- RANGÉE 1 : LES COMPTEURS GLOBAUX --- */}
        {globalStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2.5, 
                borderRadius: 4, 
                border: '1px solid #eef2f6',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <Avatar sx={{ bgcolor: stat.bg, color: stat.color, width: 56, height: 56 }}>
                {stat.icon}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{stat.value}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                  {stat.label}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}

        {/* --- RANGÉE 2 : ATTESTATIONS & SOLDE PERSONNEL --- */}
        
        {/* KPI : Attestations en attente */}
        <Grid item xs={12} md={3}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, borderRadius: 4, border: '1px solid #eef2f6', height: '100%',
              display: 'flex', flexDirection: 'column', justifyContent: 'center' 
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'rgba(255, 167, 38, 0.1)', color: 'warning.main', width: 48, height: 48 }}>
                <DescriptionOutlined />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>{stats.attestationsAPrevoir}</Typography>
                <Typography variant="body2" color="text.secondary">Attestations à signer</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Espace Solde Membre (Bandeau Premium) */}
        <Grid item xs={12} md={9}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, borderRadius: 4, 
              background: 'linear-gradient(135deg, #435844 0%, #2d3e2e 100%)', 
              color: 'white',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <AccountBalanceWalletOutlined fontSize="small" sx={{ color: 'secondary.main' }} />
                <Typography variant="subtitle2" sx={{ opacity: 0.9, fontWeight: 600, letterSpacing: 0.5 }}>
                  VOTRE SITUATION
                </Typography>
              </Stack>
              <Typography variant="h3" sx={{ fontWeight: 800 }}>
                {fNum(stats?.soldePersonnel)} <small style={{ fontSize: '1.2rem', fontWeight: 400 }}>MGA</small>
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>Solde des cotisations</Typography>
            </Box>
            {![3355,5150].includes(roles) && 
              <Button 
                onClick={handleOpenPaiement()}
                variant="contained" 
                color="secondary" 
                size="large"
                sx={{ fontWeight: 800, px: 4, borderRadius: 2, height: 50, color: 'primary.main' }}
              >
                Régulariser
              </Button>
            }
          </Paper>
        </Grid>

        {/* --- RANGÉE 3 : DIAGRAMMES --- */}
        
        {/* Graphique 1 : Catégories A & B */}
        <Grid item xs={6} md={6} lg={3}> {/* Ajusté la taille pour que le 400px de large tienne */}
          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #eef2f6' }}>
            <CardHeader 
              title="Répartition par Catégorie"
              subheader="Membre Tableau A (liberaux) vs Tableau B (salariés)" 
              titleTypographyProps={{ fontWeight: 700 }}
            />
            <Divider />
            {/* AJOUT DE position: relative ICI */}
            <CardContent sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
              <PieChart
                series={[
                  {
                    data: dataCategories,
                    innerRadius: 70,
                    outerRadius: 100,
                    paddingAngle: 5,
                    cornerRadius: 8,
                    arcLabel: (item) => `${item.value}`,
                    arcLabelMinAngle: 20,
                    // On force la couleur blanche via arcLabel
                    arcLabelRadius: 85, 
                  },
                ]}
                // Sélecteur spécifique pour la couleur blanche
                sx={{
                  '& .MuiChartsPieArcLabel-root': {
                    fill: 'white !important', // Force le blanc
                    fontWeight: 'bold',
                  },
                }}
                width={400}
                height={200}
                slotProps={{
                  legend: {
                    direction: 'column',
                    position: { vertical: 'middle', horizontal: 'right' },
                  },
                }}
              />

              {/* Le texte au centre */}
              <Box
                sx={{
                  position: 'absolute',
                  // On centre par rapport au CardContent
                  top: '50%',
                  left: '38%', // Ajusté pour être au milieu du donut (la légende prend de la place à droite)
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mb: -0.5 }}>
                  {stats?.totalMembres || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                  Total
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Graphique 2 : Structure de l'Ordre */}
        <Grid item xs={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #eef2f6' }}>
            <CardHeader 
              title="Analyse de la Structure" 
              subheader="Répartition par séction"
              titleTypographyProps={{ fontWeight: 700 }}
            />
            <Divider />
            <CardContent sx={{ height: 280, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <PieChart
                series={[
                  {
                    data: dataTypes, // ex: [{ id: 0, value: 10, label: 'Experts', color: '#1a237e' }, ...]
                    innerRadius: 0,
                    outerRadius: 90,
                    paddingAngle: 2,
                    cornerRadius: 4,
                    // Affiche la valeur numérique
                    arcLabel: (item) => `${item.value}`,
                    // Positionne le chiffre à 60% du rayon pour qu'il soit bien centré dans la part
                    arcLabelRadius: 55, 
                    arcLabelMinAngle: 25,
                  },
                ]}
                sx={{
                  // Force la couleur blanche sur les nombres
                  '& .MuiChartsPieArcLabel-root': {
                    fill: 'white !important',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    textShadow: '0px 1px 2px rgba(0,0,0,0.3)', // Optionnel : ajoute une ombre pour la lisibilité
                  },
                }}
                width={400}
                height={200}
                slotProps={{
                  legend: {
                    direction: 'column',
                    position: { vertical: 'middle', horizontal: 'right' },
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* --- RANGÉE 3 : ÉVOLUTION PAR PROMOTION --- */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #eef2f6' }}>
            <CardHeader 
              title="Membres par Promotion" 
              subheader="Nombre de membres inscrits par année de promotion"
              titleTypographyProps={{ fontWeight: 700 }}
              avatar={<Avatar sx={{width:55, height:55, bgcolor: '#f0f4f0', color: '#435844' }}><SchoolOutlined /></Avatar>}
            />
            <Divider />
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ width: '100%', height: 240 }}>
                <BarChart
                  dataset={stats?.promotions || []}
                  xAxis={[{ 
                    scaleType: 'band', 
                    dataKey: 'promotion',
                    label: 'Année de Promotion' 
                  }]}
                  series={[{ 
                    dataKey: 'count', 
                    label: 'Nombre de Membres', 
                    color: '#435844' 
                  }]}
                  borderRadius={8}
                  margin={{ top: 20, bottom: 50, left: 50, right: 20 }}
                  slotProps={{
                    legend: { hidden: true } // On cache la légende car le titre suffit
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
};

export default DashboardHome;
import React, { useState } from 'react';
import { 
  Box, Grid, Typography, TextField, Button, IconButton, 
  InputAdornment, Link, Stack, Fade, Divider, InputLabel, FormControl 
} from '@mui/material';
import { 
  Visibility, VisibilityOff, LockOutlined, EmailOutlined, 
  VerifiedUserOutlined, AccountBalanceOutlined 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import useAuth from '../hooks/useAuth';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/', { email:credentials.email, password: credentials.password },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        }
      );

      const accessToken = response?.data?.accessToken;
      setAuth({ accessToken });
      navigate("/dashboard");
    } catch (err) {
      if (!err.response) {
        toast.error('Le serveur ne repond pas');
      } else if (err.response?.status === 400) {
        toast.error('Veuillez insérer votre email et mot de passe correctement');
      } else if (err.response?.status === 401) {
        toast.error(err.response?.data?.message);
      } else {
        toast.error('Erreur de connexion');
      }
    }
  };

  return (
    <Grid container sx={{ minHeight: '100vh' }}>
      
      {/* GAUCHE : FORMULAIRE */}
      <Grid item xs={12} md={5} lg={4} sx={{ display: 'flex', alignItems: 'center', bgcolor: 'white' }}>
        <Fade in timeout={800}>
          {/* Un seul enfant Box ici pour éviter l'erreur style/ref */}
          <Box sx={{ p: { xs: 4, sm: 8 }, width: '100%' }}>
            <Box sx={{ mb: 6 }}>
              <Stack direction={'row'} sx={{mb:10}}>
                <img src="/logo500.png" alt="OECFM" style={{ height: 80, marginBottom: 0 }} />
                <Box>
                  <Typography 
                      variant="h6" 
                      sx={{ 
                          ml: 2, 
                          fontWeight: 800, 
                          color: 'Black', 
                          letterSpacing: 0.5,
                          whiteSpace: 'nowrap' // Évite que le texte saute à la ligne
                      }}
                  >
                      OECFM <span style={{ color: '#8BC34A' }}>Admin</span>
                  </Typography>
                  <Typography 
                    variant="body1" color="text.secondary"
                    sx={{ 
                          ml: 2, 
                          fontWeight: 800, 
                      }}
                  >
                    Ordre des Experts Comptables de Madagascar.
                  </Typography>
                </Box>
                
              </Stack>
              
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                Portail de Gestion des Membres
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Accédez à votre espace expert-comptable sécurisé.
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                {/* Champ Email */}
                <Box>
                  <Typography 
                    variant="body2" 
                    sx={{ mb: 1, fontWeight: 600, color: 'text.primary', ml: 0.5 }}
                  >
                    Adresse email professionnelle
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="exemple@oecfm.mg"
                    name="email"
                    onChange={handleChange}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#f9fafb', // Léger gris pour l'intérieur
                        '& fieldset': { border: '1px solid #e5e7eb' }, // Bordure fine
                        '&:hover fieldset': { borderColor: 'primary.main' },
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Champ Mot de passe */}
                <Box>
                  <Typography 
                    variant="body2" 
                    sx={{ mb: 1, fontWeight: 600, color: 'text.primary', ml: 0.5 }}
                  >
                    Mot de passe
                  </Typography>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    name="password"
                    onChange={handleChange}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#f9fafb',
                        '& fieldset': { border: '1px solid #e5e7eb' },
                        '&:hover fieldset': { borderColor: 'primary.main' },
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Stack>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Link href="#" variant="body2" color="secondary" sx={{ fontWeight: 500 }}>
                  Mot de passe oublié ?
                </Link>
              </Box>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                sx={{ 
                  mt: 4, py: 1.5, fontWeight: 700,
                  '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' } 
                }}
              >
                Se connecter
              </Button>
            </form>

            <Divider sx={{ my: 4 }}>OU</Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                Nouveau membre ? <Link href="#" sx={{ fontWeight: 700 }}>Créer un compte</Link>
              </Typography>
            </Box>
          </Box>
        </Fade>
      </Grid>

      {/* DROITE : ORNEMENTALE */}
      <Grid 
        item md={7} lg={8} 
        sx={{ 
          display: { xs: 'none', md: 'flex' }, 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          background: 'linear-gradient(rgba(67, 88, 68, 0.92), rgba(67, 88, 68, 0.92)), url(https://images.unsplash.com/photo-1454165833767-0275084924cd?q=80&w=1920)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          p: 8
        }}
      >
        <Fade in timeout={1500}>
          <Stack spacing={4} sx={{ maxWidth: 600, textAlign: 'center' }}>
            <VerifiedUserOutlined sx={{ fontSize: 80, color: 'secondary.main', mx: 'auto' }} />
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
                L'Excellence Comptable à Madagascar
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 400 }}>
                Gérez vos cotisations, vos attestations et votre historique de membre en toute simplicité.
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={4} justifyContent="center" sx={{ pt: 4 }}>
              <Box>
                <AccountBalanceOutlined sx={{ color: 'secondary.main', fontSize: 40 }} />
                <Typography variant="h6">Ordre National</Typography>
              </Box>
              <Box>
                <VerifiedUserOutlined sx={{ color: 'secondary.main', fontSize: 40 }} />
                <Typography variant="h6">Sécurisé</Typography>
              </Box>
            </Stack>
          </Stack>
        </Fade>
      </Grid>
    </Grid>
  );
};

export default LoginPage;
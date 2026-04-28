import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#435844', // Le vert sombre anthracite de votre bouton
      light: '#5e7d5f',
    },
    secondary: {
      main: '#8bc34a', // Le vert vif du logo
    },
    background: {
      default: '#f4f7f6', // Gris très léger type SaaS
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
      size: 'small',
      fullWidth: true,
      // On cache le label par défaut de MUI pour utiliser notre Typography personnalisé
      InputLabelProps: { shrink: true, sx: { display: 'none' } }, 
    },
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          backgroundColor: '#f9fafb',
          '& fieldset': {
            borderColor: '#e5e7eb',
          },
          '&:hover fieldset': {
            borderColor: '#435844', // Votre vert OECFM
          },
        },
      },
    },
  },
},
});

export default theme;
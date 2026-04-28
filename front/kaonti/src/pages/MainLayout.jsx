import React, { useEffect, useState } from 'react';
import {
    Box, Drawer, AppBar, Toolbar, List, Typography, Divider,
    IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Avatar, Badge, Stack, Container, Menu, MenuItem, Tooltip, Collapse,
    Paper,
    ButtonBase,
    TextField
} from '@mui/material';
import {
    DashboardOutlined, PeopleAltOutlined, ReceiptLongOutlined,
    HistoryOutlined, SettingsOutlined, NotificationsOutlined,
    LogoutOutlined, PersonOutline, FormatListBulletedOutlined,
    HistoryEduOutlined, ExpandLess, ExpandMore
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button
} from '@mui/material';
import useLogout from '../hooks/useLogout';
import toast from 'react-hot-toast';
import useAxiosPrivate from '../../config/axiosPrivate';
import { jwtDecode } from 'jwt-decode';
import useAuth from '../hooks/useAuth';
import CreateAccountDialog from './MainLayout_createCompte';

const drawerWidth = 260;
const closedDrawerWidth = 70;

const MainLayout = ({ children }) => {
    const navigate = useNavigate();
    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();

    const logOut = useLogout();
    const location = useLocation();

    const [isHovered, setIsHovered] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    // État pour ouvrir/fermer le sous-menu "Gestion des Membres"
    const [openMembers, setOpenMembers] = useState(false);
    const [openSettingsMenu, setOpenSettingsMenu] = useState(false);
    const [openCotisationMenu, setOpenCotisationMenu] = useState(false);
    const [openAttestationMenu, setOpenAttestationMenu] = useState(false);
    const [openLogout, setOpenLogout] = useState(false);
    const [openCreateAccount, setOpenCreateAccount] = useState(false);
    const [openPassword, setOpenPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // Pour l'icône "œil"
    const [showMenuParametre, setShowMenuParametre] = useState(false);
    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const roleMapping = {
        SuperAdmin: 3355,
        Admin: 5150,
        Lector: 1984,
        User: 2001
    };

    const decoded = auth?.accessToken
        ? jwtDecode(auth.accessToken)
        : undefined

    const roles = decoded.UserInfo.roles;
    const userId = decoded.UserInfo.userId || null;
    const username = decoded.UserInfo.username || null;
    const comptename = decoded.UserInfo.compte || null;
    const role = Object.keys(roleMapping).find(
        key => roleMapping[key] === roles
    );

    const rolesArray = [].concat(decoded.UserInfo.roles);

    useEffect(() =>{
        if([3355, 5150].includes(roles)){
            setShowMenuParametre(true);
        }
    },[roles]);

    //modification password
    const handlePasswordChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    //save new password
    const handleSavePassword = async () => {
        // 1. Petite validation de sécurité côté client
        if (!passwords.oldPassword || !passwords.newPassword) {
            toast.error("Veuillez remplir tous les champs");
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            // Déjà géré par l'UI, mais une sécurité de plus ne fait pas de mal
            return;
        }

        try {
            // 2. Appel vers ton backend Node/Express
            // On suppose que tu as l'ID de l'utilisateur dans ton contexte d'authentification
            const response = await axiosPrivate.post('/api/auth/change-password', {
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword,
                userId: userId // Récupéré depuis ton AuthContext ou Redux
            });

            if (response.status === 200) {
                // 3. Succès : On ferme et on reset
                setOpenPassword(false);
                setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });

                // Si tu as un composant Snackbar/Toast pour les notifications :
                // showSnackbar("Mot de passe mis à jour avec succès !", "success");
                toast.success("Mot de passe mis à jour !");
            }
        } catch (error) {
            // 4. Gestion d'erreur (Ancien mot de passe incorrect, etc.)
            const message = error.response?.data?.message || "Erreur lors de la mise à jour";
            toast.error(message);
        }
    };

    //ajouter un nouveau compte
    const handleOpenCreateAccount = () => {
        setAnchorEl(null);
        setOpenCreateAccount(true);
    };

    const handleLogoutClick = () => {
        // Ferme d'abord le menu de l'avatar s'il est ouvert
        setAnchorEl(null);
        setOpenLogout(true);
    };

    const confirmLogout = () => {
        setOpenLogout(false);
        // Ta logique de déconnexion ici (ex: logout() ou redirection)
        logOut();
        navigate("/");
    };

    const handleUserMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleUserMenuClose = () => setAnchorEl(null);

    const handleMembersClick = () => {
        if (isHovered) {
            setOpenMembers(!openMembers);
        }
    };

    const handleSettingsMenuClick = () => {
        if (isHovered) {
            setOpenSettingsMenu(!openSettingsMenu);
        }
    };

    const handleCotisationClick = () => {
        if (isHovered) {
            setOpenCotisationMenu(!openCotisationMenu);
        }
    };

    const handleAttestationClick = () => {
        if (isHovered) {
            setOpenAttestationMenu(!openAttestationMenu);
        }
    };

    const drawer = (
        <Box
            sx={{
                display: 'flex', flexDirection: 'column', height: '100%',
                bgcolor: '#1A1D1F',
                color: '#FFFFFF'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setOpenMembers(false);
                setOpenCotisationMenu(false);
                setOpenAttestationMenu(false);
                setOpenSettingsMenu(false);
            }}
        >
            {/* HEADER : LOGO OECFM */}
            <Box sx={{ p: 1, mb: 2, display: 'flex', alignItems: 'center', height: 64 }}>
                <ButtonBase
                    onClick={() => navigate('/oecfm')}
                    disabled={!showMenuParametre}
                    sx={{
                        display: 'flex', alignItems: 'center', textAlign: 'left',
                        borderRadius: 2, p: 0.5, transition: '0.3s',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' }
                    }}
                >
                    <Avatar
                        src="/logo500.png"
                        variant="rounded"
                        sx={{ width: 50, height: 50, bgcolor: 'transparent', p: 0.5 }}
                    />
                    {isHovered && (
                        <Typography variant="h6" sx={{ ml: 2, fontWeight: 800, color: 'white', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                            OECFM <span style={{ color: '#8BC34A' }}>Admin</span>
                        </Typography>
                    )}
                </ButtonBase>
            </Box>

            <List sx={{ px: 1.5, flexGrow: 1 }}>
                {/* ITEM : DASHBOARD */}
                <ListItemButton
                    onClick={() => navigate('/dashboard')}
                    selected={location.pathname === '/dashboard'}
                    sx={{
                        borderRadius: '10px', mb: 1, py: 1.2,
                        color: 'rgba(255,255,255,0.7)',
                        '&.Mui-selected': {
                            bgcolor: '#435844 !important',
                            color: '#FFFFFF',
                            '& .MuiListItemIcon-root': { color: '#8BC34A' }
                        },
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}><DashboardOutlined /></ListItemIcon>
                    <ListItemText primary="Tableau de bord" sx={{ opacity: isHovered ? 1 : 0 }} />
                </ListItemButton>

                {/* --- COMPOSANT RÉUTILISABLE POUR L'ARBORESCENCE --- */}
                {[
                    {
                        label: "Gestion Membres",
                        icon: <PeopleAltOutlined />,
                        open: openMembers,
                        onClick: handleMembersClick,
                        subItems: [
                            ...(showMenuParametre ? [{ label: "Effectif total", path: "/membres/liste" }]: []),
                            ...(showMenuParametre ? [{ label: "Mises à jour", path: "/membres/historique" }]: []),
                            { label: "Situation membres", path: "/membres/situation" }
                        ]
                    },
                    {
                        label: "Cotisation",
                        icon: <ReceiptLongOutlined />,
                        open: openCotisationMenu,
                        onClick: handleCotisationClick,
                        subItems: [
                            ...(showMenuParametre ? [{ label: "Appel cotisation", path: "/cotisation/appel" }]: []),
                            { label: "Paiement", path: "/cotisation/paiement" },
                            { label: "Balance", path: "/cotisation/grandlivre" }
                        ]
                    },
                    {
                        label: "Attestations",
                        icon: <HistoryEduOutlined />,
                        open: openAttestationMenu,
                        onClick: handleAttestationClick,
                        subItems: [
                            { label: "Demande", path: "/attestation/demande" },
                           ...(showMenuParametre ? [{ label: "Validation", path: "/attestation/validation" }] : [])
                        ]
                    }
                ].map((menu) => (
                    <Box key={menu.label} sx={{ mb: 0.5 }}>
                        <ListItemButton
                            onClick={menu.onClick}
                            sx={{
                                borderRadius: '10px', py: 1.2,
                                color: menu.open ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                                bgcolor: menu.open ? 'rgba(255,255,255,0.05)' : 'transparent',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40, color: menu.open ? '#8BC34A' : 'inherit' }}>
                                {menu.icon}
                            </ListItemIcon>
                            <ListItemText primary={menu.label} sx={{ opacity: isHovered ? 1 : 0 }} />
                            {isHovered && (menu.open ? <ExpandLess /> : <ExpandMore />)}
                        </ListItemButton>

                        <Collapse in={menu.open && isHovered} timeout="auto">
                            <List component="div" disablePadding
                                sx={{
                                    ml: 2.5, // Espace pour la ligne
                                    borderLeft: '1.5px solid rgba(139, 195, 74, 0.3)', // LIGNE D'ARBORESCENCE
                                    mt: 0.5, mb: 1
                                }}
                            >
                                {menu.subItems.map((sub) => (
                                    <ListItemButton
                                        key={sub.path}
                                        onClick={() => navigate(sub.path)}
                                        selected={location.pathname === sub.path}
                                        sx={{
                                            pl: 3, py: 0.8, borderRadius: '0 8px 8px 0',
                                            color: 'rgba(255,255,255,0.5)',
                                            position: 'relative',
                                            '&:before': { // Petite encoche horizontale
                                                content: '""',
                                                position: 'absolute',
                                                left: 0, top: '50%',
                                                width: 10, height: '1.5px',
                                                bgcolor: 'rgba(139, 195, 74, 0.3)',
                                            },
                                            '&.Mui-selected': {
                                                bgcolor: 'rgba(139, 195, 74, 0.12)',
                                                color: '#8BC34A',
                                                '&:before': { bgcolor: '#8BC34A' }
                                            },
                                            '&:hover': { color: '#FFFFFF' }
                                        }}
                                    >
                                        <ListItemText
                                            primary={sub.label}
                                            primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: 500 }}
                                        />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Collapse>
                    </Box>
                ))}

                {/* ITEM : HISTORIQUE */}
                <ListItemButton
                    onClick={() => navigate('/historique')}
                    selected={location.pathname === '/historique'}
                    sx={{
                        borderRadius: '10px', py: 1.2, mb: 1,
                        color: 'rgba(255,255,255,0.7)',
                        '&.Mui-selected': { bgcolor: '#435844 !important', color: '#FFFFFF' },
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}><HistoryOutlined /></ListItemIcon>
                    <ListItemText primary="Historique" sx={{ opacity: isHovered ? 1 : 0 }} />
                </ListItemButton>

                {/* MENU PARAMÈTRES (TREEVIEW) */}
                {
                    showMenuParametre && (
                        <Box>
                            <ListItemButton
                                onClick={handleSettingsMenuClick}
                                sx={{
                                    borderRadius: '10px', py: 1.2,
                                    color: openSettingsMenu ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                                    bgcolor: openSettingsMenu ? 'rgba(255,255,255,0.05)' : 'transparent',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: openSettingsMenu ? '#8BC34A' : 'inherit' }}>
                                    <SettingsOutlined />
                                </ListItemIcon>
                                <ListItemText primary="Paramètres" sx={{ opacity: isHovered ? 1 : 0 }} />
                                {isHovered && (openSettingsMenu ? <ExpandLess /> : <ExpandMore />)}
                            </ListItemButton>
                            <Collapse in={openSettingsMenu && isHovered} timeout="auto">
                                <List component="div" disablePadding sx={{ ml: 2.5, borderLeft: '1.5px solid rgba(139, 195, 74, 0.3)', mt: 0.5 }}>
                                    <ListItemButton
                                        onClick={() => navigate('/parametres/exercices')}
                                        selected={location.pathname === '/parametres/exercices'}
                                        sx={{
                                            pl: 3, py: 0.8, borderRadius: '0 8px 8px 0', color: 'rgba(255,255,255,0.5)',
                                            position: 'relative', '&:before': { content: '""', position: 'absolute', left: 0, top: '50%', width: 10, height: '1.5px', bgcolor: 'rgba(139, 195, 74, 0.3)' },
                                            '&.Mui-selected': { bgcolor: 'rgba(139, 195, 74, 0.12)', color: '#8BC34A', '&:before': { bgcolor: '#8BC34A' } }
                                        }}
                                    >
                                        <ListItemText primary="Exercices" primaryTypographyProps={{ fontSize: '0.82rem' }} />
                                    </ListItemButton>
                                    <ListItemButton
                                        onClick={() => navigate('/parametres/tarifs')}
                                        selected={location.pathname === '/parametres/tarifs'}
                                        sx={{
                                            pl: 3, py: 0.8, borderRadius: '0 8px 8px 0', color: 'rgba(255,255,255,0.5)',
                                            position: 'relative', '&:before': { content: '""', position: 'absolute', left: 0, top: '50%', width: 10, height: '1.5px', bgcolor: 'rgba(139, 195, 74, 0.3)' },
                                            '&.Mui-selected': { bgcolor: 'rgba(139, 195, 74, 0.12)', color: '#8BC34A', '&:before': { bgcolor: '#8BC34A' } }
                                        }}
                                    >
                                        <ListItemText primary="Grille tarifaire" primaryTypographyProps={{ fontSize: '0.82rem' }} />
                                    </ListItemButton>
                                </List>
                            </Collapse>
                        </Box>
                    )
                }
            </List>

            {/* BAS DU MENU : SESSION UTILISATEUR */}
            <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)' }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ px: 1 }}>
                    <Badge variant="dot" color="success" overlap="circular">
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#8BC34A', color: '#1A1D1F', fontSize: '0.8rem', fontWeight: 800 }}>AD</Avatar>
                    </Badge>
                    {isHovered && (
                        <Box>
                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, display: 'block' }}>Admin OECFM</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>Session active</Typography>
                        </Box>
                    )}
                </Stack>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8fafb', minHeight: '100vh' }}>
            <AppBar
                position="fixed"
                elevation={1}
                sx={{
                    width: { sm: `calc(100% - ${isHovered ? drawerWidth : closedDrawerWidth}px)` },
                    ml: { sm: `${isHovered ? drawerWidth : closedDrawerWidth}px` },
                    bgcolor: 'primary.main',
                    color: 'white',
                    transition: 'width 0.3s, margin-left 0.3s'
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Portail de Gestion de l'Ordre
                    </Typography>

                    <Stack direction="row" spacing={2} alignItems="center">
                        <IconButton color="inherit"><Badge badgeContent={4} color="error"><NotificationsOutlined /></Badge></IconButton>
                        <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />

                        <Stack direction="row" spacing={1.5} alignItems="center" onClick={handleUserMenuOpen} sx={{ cursor: 'pointer' }}>
                            <Avatar sx={{ bgcolor: 'secondary.main', color: 'primary.main', fontWeight: 700 }}>{username[0]}</Avatar>
                            <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{username}</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>{role}</Typography>
                            </Box>
                        </Stack>

                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleUserMenuClose}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            // Voici la nouvelle syntaxe standard
                            slotProps={{
                                paper: {
                                    elevation: 3,
                                    sx: {
                                        minWidth: 200,
                                        mt: 1.5,
                                        borderRadius: '12px', // Bords plus doux style SaaS
                                        border: '1px solid #eef2f6',
                                        overflow: 'visible',
                                        '&:before': { // La petite flèche pointant vers le haut (optionnel)
                                            content: '""',
                                            display: 'block',
                                            position: 'absolute',
                                            top: 0,
                                            right: 14,
                                            width: 10,
                                            height: 10,
                                            bgcolor: 'background.paper',
                                            transform: 'translateY(-50%) rotate(45deg)',
                                            zIndex: 0,
                                        },
                                    },
                                },
                            }}
                        >
                            <MenuItem onClick={() => { handleUserMenuClose(); setOpenPassword(true); }}>
                                <PersonOutline sx={{ mr: 2, fontSize: 20 }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Changer le mot de passe</Typography>
                            </MenuItem>

                            {showMenuParametre && 
                            <MenuItem onClick={handleOpenCreateAccount}>
                                <SettingsOutlined sx={{ mr: 2, fontSize: 20 }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Paramètres des comptes</Typography>
                            </MenuItem>
                            }

                            <Divider sx={{ my: 1, opacity: 0.6 }} />

                            <MenuItem
                                onClick={handleLogoutClick}
                                sx={{ color: 'error.main', '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.04)' } }}
                            >
                                <LogoutOutlined sx={{ mr: 2, fontSize: 20 }} />
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>Déconnexion</Typography>
                            </MenuItem>
                        </Menu>
                    </Stack>
                </Toolbar>
            </AppBar>

            <Box component="nav" sx={{ width: { sm: isHovered ? drawerWidth : closedDrawerWidth }, flexShrink: { sm: 0 }, transition: '0.3s' }}>
                <Drawer
                    variant="permanent"
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: isHovered ? drawerWidth : closedDrawerWidth,
                            borderRight: '1px solid', borderColor: 'divider',
                            transition: 'width 0.3s',
                            overflowX: 'hidden'
                        }
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { sm: `calc(100% - ${isHovered ? drawerWidth : closedDrawerWidth}px)` },
                    minHeight: '100vh',
                    mt: 8, // Hauteur de l'AppBar
                    transition: '0.3s',
                    bgcolor: '#f8fafb', // Gris très léger pour faire ressortir le blanc des tableaux
                    p: 3, // Padding uniforme sur toute l'appli
                }}
            >
                {/* On enlève le Container ou on le met en fluide total */}
                <Box sx={{ width: '100%', height: '100%' }}>
                    {children}
                </Box>
            </Box>

            {/* DIALOG POUR CONFIRMER LA DECONNEXION */}
            <Dialog
                open={openLogout}
                onClose={() => setOpenLogout(false)}
                PaperProps={{
                    sx: { borderRadius: 3, padding: 1, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    Confirmer la déconnexion
                </DialogTitle>

                <DialogContent>
                    <DialogContentText sx={{ fontSize: '0.95rem', color: '#64748b' }}>
                        Êtes-vous sûr de vouloir vous déconnecter de votre session ?
                    </DialogContentText>
                </DialogContent>

                <DialogActions sx={{ padding: 2 }}>
                    <Button
                        onClick={() => setOpenLogout(false)}
                        sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={confirmLogout}
                        variant="contained"
                        color="error"
                        sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 3,
                            boxShadow: 'none',
                            '&:hover': { boxShadow: 'none', bgcolor: '#d32f2f' }
                        }}
                    >
                        Déconnexion
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODIFICATION DE MOT DE PASSE */}
            <Dialog
                open={openPassword}
                onClose={() => setOpenPassword(false)}
                PaperProps={{
                    sx: { borderRadius: 3, width: '100%', maxWidth: 400, p: 1 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, fontSize: '1.2rem' }}>
                    Modifier mon mot de passe
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', mb: 1 }}>
                            Assurez-vous d'utiliser un mot de passe complexe pour protéger votre compte.
                        </Typography>

                        {/* ANCIEN MOT DE PASSE */}
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.85rem' }}>
                                Ancien mot de passe
                            </Typography>
                            <TextField
                                name="oldPassword"
                                type={showPassword ? 'text' : 'password'}
                                fullWidth
                                variant="outlined"
                                size="small"
                                placeholder="Saisissez votre mot de passe actuel"
                                value={passwords.oldPassword}
                                onChange={handlePasswordChange}
                            />
                        </Box>

                        <Divider sx={{ my: 0.5 }}>
                            <Typography variant="caption" sx={{ color: '#cbd5e1' }}>NOUVEAU</Typography>
                        </Divider>

                        {/* NOUVEAU MOT DE PASSE */}
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.85rem' }}>
                                Nouveau mot de passe
                            </Typography>
                            <TextField
                                name="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                fullWidth
                                variant="outlined"
                                size="small"
                                placeholder="Minimum 8 caractères"
                                value={passwords.newPassword}
                                onChange={handlePasswordChange}
                            />
                        </Box>

                        {/* CONFIRMATION */}
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.85rem' }}>
                                Confirmer le nouveau mot de passe
                            </Typography>
                            <TextField
                                name="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                fullWidth
                                variant="outlined"
                                size="small"
                                placeholder="Répétez le nouveau mot de passe"
                                value={passwords.confirmPassword}
                                onChange={handlePasswordChange}
                                error={passwords.newPassword !== passwords.confirmPassword && passwords.confirmPassword !== ''}
                                helperText={
                                    passwords.newPassword !== passwords.confirmPassword && passwords.confirmPassword !== ''
                                        ? "Les mots de passe ne correspondent pas"
                                        : ""
                                }
                            />
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2.5 }}>
                    <Button
                        onClick={() => setOpenPassword(false)}
                        sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSavePassword}
                        variant="contained"
                        disableElevation
                        sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 3,
                            bgcolor: '#2e3d2f',
                            '&:hover': { bgcolor: '#7a9e7c' }
                        }}
                    >
                        Mettre à jour
                    </Button>
                </DialogActions>
            </Dialog>

            {/* NOUVEAU : Popup de création de compte */}
            <CreateAccountDialog
                open={openCreateAccount}
                onClose={() => setOpenCreateAccount(false)}
                refreshList={() => {
                    // Optionnel : si tu as une liste d'utilisateurs à rafraîchir en arrière-plan
                    console.log("Liste rafraîchie");
                }}
            />
        </Box>
    );
};

export default MainLayout;
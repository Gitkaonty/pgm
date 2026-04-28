import React, { useState, useEffect } from 'react';
import { 
    Grid, Card, CardContent, TextField, Button, Typography, 
    Avatar, Box, InputLabel, Snackbar, Alert, CircularProgress,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    MenuItem
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import useAxiosPrivate from '../../config/axiosPrivate';
import { URL } from '../../config/axios';

const OrderInfoPage = () => {
    const GREEN_MAIN = '#435844'; 
    const GREEN_ACCENT = '#8BC34A';
    const url = URL;
    const axiosPrivate = useAxiosPrivate();

    // 1. États des données
    const [orderInfo, setOrderInfo] = useState({
        adresse: '', 
        boite_postale: '', 
        telephone: '', 
        email: '', 
        site_web: '',
        sig_president: '',
        sig_vice_president_admin: '',
        sig_secretaire: '',
        sig_tresorier: '',
        sig_caissier: '',
    });

    // État pour la prévisualisation et le zoom
    const [previews, setPreviews] = useState({});
    const [zoomedPoste, setZoomedPoste] = useState(null); // Nouveau : gère le zoom
    const [loading, setLoading] = useState(false);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const labelStyle = { 
        fontSize: '0.875rem', 
        fontWeight: 700, 
        color: '#1e293b', 
        mb: 0.8, 
        ml: 0.2 
    };

    // Style pour l'agrandissement x5
    const zoomStyle = {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) scale(5)',
        zIndex: 9999,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        border: '2px solid #fff',
        borderRadius: '4px',
        backgroundColor: '#f5f5f5', // Fond gris clair pour voir les traits noirs
        transition: 'transform 0.2s ease-in-out',
        cursor: 'zoom-out',
    };

    const signaturesConfig = [
        { label: 'Président', key: 'President', col: 'sig_president' },
        { label: 'Vice-Président Administratif', key: 'Vice_President_Admin', col: 'sig_vice_president_admin' }, 
        { label: 'Secrétaire Général', key: 'Secretaire', col: 'sig_secretaire' },
        { label: 'Trésorier', key: 'Tresorier', col: 'sig_tresorier' },
        { label: 'Caissier', key: 'Caissier', col: 'sig_caissier' }
    ];

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axiosPrivate.get('/api/settings-ordre');
            if (res.data) setOrderInfo(res.data);
        } catch (err) {
            showNotify("Erreur lors du chargement des données", "error");
        }
    };

    const handleChange = (e) => {
        setOrderInfo({ ...orderInfo, [e.target.name]: e.target.value });
    };

    const handleOpenConfirm = () => setOpenConfirm(true);
    const handleCloseConfirm = () => setOpenConfirm(false);

    const handleSelectFile = (e, posteKey) => {
        const file = e.target.files[0];
        if (file) {
            setPreviews(prev => ({ ...prev, [posteKey]: file }));
        }
    };

    const handleUploadSignature = async (posteKey, colName) => {
        const file = previews[posteKey];
        if (!file) return;

        const formData = new FormData();
        formData.append('signature', file);

        try {
            setLoading(true);
            const res = await axiosPrivate.post(`/api/settings-ordre/upload/${posteKey}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setOrderInfo(prev => ({ ...prev, [colName]: res.data.fileName }));
            const updatedPreviews = { ...previews };
            delete updatedPreviews[posteKey];
            setPreviews(updatedPreviews);

            showNotify(`Signature de ${posteKey} mise à jour`, "success");
        } catch (err) {
            showNotify("Erreur lors de l'upload", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSave = async () => {
        handleCloseConfirm();
        setLoading(true);
        try {
            await axiosPrivate.put('/api/settings-ordre/update', orderInfo);
            showNotify("Informations mises à jour avec succès !", "success");
        } catch (err) {
            showNotify("Erreur lors de la sauvegarde", "error");
        } finally {
            setLoading(false);
        }
    };

    const showNotify = (msg, sev) => setSnackbar({ open: true, message: msg, severity: sev });

    return (
        <Box sx={{ p: 3 }}>
            {/* Overlay pour fermer le zoom en cliquant n'importe où */}
            {zoomedPoste && (
                <Box 
                onClick={() => setZoomedPoste(null)}
                    sx={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        bgcolor: 'rgba(0,0,0,0.7)', zIndex: 9998, cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <Typography sx={{ 
                        color: 'white', fontWeight: 800, mb: 45, fontSize: '1.2rem',
                        bgcolor: 'rgba(0,0,0,0.5)', px: 3, py: 1, borderRadius: 2, textTransform: 'none'
                    }}>
                        Signature du {signaturesConfig.find(s => s.key === zoomedPoste)?.label} :{" "}
                        {orderInfo.noms_signataires?.[signaturesConfig.find(s => s.key === zoomedPoste)?.label] || "Nom non défini"}
                    </Typography>
                </Box>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                    <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #eaecf0' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: GREEN_MAIN }}>
                                Coordonnées de l'Ordre
                            </Typography>
                            
                            <Grid container spacing={2.5}>
                                <Grid item xs={12}>
                                    <InputLabel sx={labelStyle}>Adresse Physique</InputLabel>
                                    <TextField fullWidth name="adresse" size="small" value={orderInfo.adresse} onChange={handleChange} />
                                </Grid>
                                <Grid item xs={6}>
                                    <InputLabel sx={labelStyle}>Boîte Postale</InputLabel>
                                    <TextField fullWidth name="boite_postale" size="small" value={orderInfo.boite_postale} onChange={handleChange} />
                                </Grid>
                                <Grid item xs={6}>
                                    <InputLabel sx={labelStyle}>Téléphone</InputLabel>
                                    <TextField fullWidth name="telephone" size="small" value={orderInfo.telephone} onChange={handleChange} />
                                </Grid>
                                <Grid item xs={12}>
                                    <InputLabel sx={labelStyle}>Email Officiel</InputLabel>
                                    <TextField fullWidth name="email" size="small" value={orderInfo.email} onChange={handleChange} />
                                </Grid>
                                <Grid item xs={12}>
                                    <InputLabel sx={labelStyle}>Site Web</InputLabel>
                                    <TextField fullWidth name="site_web" size="small" value={orderInfo.site_web} onChange={handleChange} />
                                </Grid>
                            </Grid>

                            <Button 
                                variant="contained" 
                                onClick={handleOpenConfirm}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                sx={{ 
                                    mt: 4, bgcolor: GREEN_MAIN, 
                                    '&:hover': { bgcolor: '#2e3d2f' },
                                    textTransform: 'none', px: 4, borderRadius: 2
                                }}
                            >
                                Enregistrer les informations
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={5}>
                    <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #eaecf0' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: GREEN_MAIN }}>
                                Signataires Autorisés
                            </Typography>

                            {signaturesConfig.map((poste) => {
                                const localFile = previews[poste.key];
                                const serverImg = orderInfo[poste.col];
                                const isZoomed = zoomedPoste === poste.key;

                                // Récupération du nom correspondant au label (ex: 'Président')
                                const nomMembre = orderInfo.noms_signataires?.[poste.label];

                                return (
                                    <Box key={poste.key} sx={{ mb: 4 }}>
                                        <InputLabel sx={labelStyle}>{poste.label}</InputLabel>

                                        {/* AFFICHAGE DU NOM DU RESPONSABLE */}
                                        <Typography 
                                            sx={{ 
                                                fontSize: '0.75rem', 
                                                color: nomMembre ? GREEN_MAIN : '#94a3b8', // Vert si trouvé, gris sinon
                                                fontWeight: 600,
                                                mt: -0.5, // Remonte un peu pour coller au label
                                                mb: 1.5,
                                                fontStyle: nomMembre ? 'normal' : 'italic',
                                                display: 'block'
                                            }}
                                        >
                                            {nomMembre ? nomMembre : "Aucun titulaire assigné"}
                                        </Typography>
                                        
                                        <Box sx={{ 
                                            display: 'flex', alignItems: 'center', gap: 2, p: 2, 
                                            border: localFile ? `2px solid ${GREEN_ACCENT}` : '1px dashed #d0d5dd', 
                                            borderRadius: 3, bgcolor: localFile ? '#f1f8e9' : '#f9fafb' 
                                        }}>
                                            <Avatar 
                                                variant="square" 
                                                src={localFile ? window.URL.createObjectURL(localFile) : (serverImg ? `${url}/uploads/signatures/${serverImg}` : '')}
                                                // Gère l'activation/désactivation du zoom au clic
                                                onClick={() => (localFile || serverImg) && setZoomedPoste(zoomedPoste === poste.key ? null : poste.key)}
                                                sx={{ 
                                                    width: 100, 
                                                    height: 50, 
                                                    bgcolor: '#f5f5f5', 
                                                    border: '1px solid #f2f4f7', 
                                                    borderRadius: 1,
                                                    cursor: (localFile || serverImg) ? 'zoom-in' : 'default',

                                                    // STYLE DYNAMIQUE SI ZOOMÉ
                                                    ...(zoomedPoste === poste.key ? {
                                                        position: 'fixed',
                                                        top: '50%',
                                                        left: '50%',
                                                        transform: 'translate(-50%, -50%) scale(5)',
                                                        zIndex: 9999,
                                                        bgcolor: '#e2e8f0', // Fond gris bleuté pour faire ressortir les traits noirs
                                                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                                                        transition: 'all 0.2s ease-in-out',
                                                        cursor: 'zoom-out',
                                                    } : {}),

                                                    '& img': { objectFit: 'contain' }
                                                }} 
                                            >
                                                {!localFile && !serverImg && "SGN"}
                                            </Avatar>

                                            {localFile ? (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        onClick={() => handleUploadSignature(poste.key, poste.col)}
                                                        sx={{ bgcolor: GREEN_ACCENT, textTransform: 'none', fontWeight: 800, fontSize: '0.75rem' }}
                                                    >
                                                        Confirmer l'envoi
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        onClick={() => {
                                                            const newP = { ...previews };
                                                            delete newP[poste.key];
                                                            setPreviews(newP);
                                                        }}
                                                        sx={{ textTransform: 'none', fontSize: '0.7rem', color: 'gray' }}
                                                    >
                                                        Annuler
                                                    </Button>
                                                </Box>
                                            ) : (
                                                <Button
                                                    component="label"
                                                    variant="text"
                                                    size="small"
                                                    startIcon={<CloudUploadIcon />}
                                                    sx={{ textTransform: 'none', color: GREEN_ACCENT, fontWeight: 700 }}
                                                >
                                                    {serverImg ? "Modifier le scan" : "Uploader Scan"}
                                                    <input 
                                                        type="file" 
                                                        hidden 
                                                        accept="image/*" 
                                                        onChange={(e) => handleSelectFile(e, poste.key)} 
                                                    />
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Dialog
                open={openConfirm}
                onClose={handleCloseConfirm}
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: GREEN_MAIN, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutlineIcon color="success" /> Confirmation
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontWeight: 500, color: '#475569' }}>
                        Êtes-vous sûr de vouloir modifier les coordonnées officielles de l'Ordre ? 
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseConfirm} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 700 }}>
                        Annuler
                    </Button>
                    <Button 
                        onClick={handleConfirmSave} 
                        variant="contained"
                        sx={{ bgcolor: GREEN_MAIN, '&:hover': { bgcolor: '#2e3d2f' }, textTransform: 'none', borderRadius: 2, px: 3 }}
                    >
                        Confirmer la mise à jour
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={4000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{ mt: 8 }}
            >
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', fontWeight: 600, borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default OrderInfoPage;
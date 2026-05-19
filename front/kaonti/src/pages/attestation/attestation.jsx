import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios'; // Import de axios pour le back
import {
    Box, Typography, TextField, InputAdornment, Card, Stack,
    Avatar, Chip, LinearProgress, Grid, IconButton, Tooltip,
    Breadcrumbs, Link,
    CircularProgress,
    Alert,
    AlertTitle
} from '@mui/material';
import {
    Search, FilterList, CheckCircle, MoreVert,
    AccountBalanceWalletOutlined, CalendarMonthOutlined,
    PrintOutlined,
    NavigateNext,
    HomeOutlined
} from '@mui/icons-material';

import {
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    Autocomplete
} from '@mui/material';
import { Add, DescriptionOutlined, DeleteOutline } from '@mui/icons-material';
import useAxiosPrivate from '../../../config/axiosPrivate';
import { Toaster } from 'react-hot-toast';
import { Tabs, Tab } from '@mui/material';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';
import PdfAttestationExpA from './pdf_attestation';
import { pdf } from '@react-pdf/renderer';
import { InfoOutlined } from '@mui/icons-material';

const GREEN_MAIN = '#435844';
const GREEN_ACCENT = '#8BC34A';

const MyBreadcrumbs = ({ currentPath }) => (
    <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="/dashboard" sx={{ display: 'flex', alignItems: 'center' }}>
            <HomeOutlined sx={{ mr: 0.5, fontSize: 20 }} /> Dashboard
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>{currentPath}</Typography>
    </Breadcrumbs>
);

const fNum = (val) => {
    if (val === undefined || val === null) return "0";

    // 1. On convertit en entier pour enlever les virgules si besoin
    // 2. On utilise une regex pour ajouter un espace tous les 3 chiffres
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

// --- COMPOSANT MODAL DEMANDE ---
const DemandeAttestationModal = ({ open, onClose, membres, exercices, onRefresh }) => {
    const axiosPrivate = useAxiosPrivate();
    const [selectedMembre, setSelectedMembre] = useState(null);
    const [selectedExo, setSelectedExo] = useState(null);
    const [load, setLoad] = useState(false);

    const handleDemander = async () => {
        if (!selectedMembre || !selectedExo) return;
        try {
            setLoad(true);
            await axiosPrivate.post('/api/attestations/create', {
                membre_id: selectedMembre.id,
                exercice_id: selectedExo.id
            });
            onRefresh(); // Recharge la liste de la page
            onClose(); // Ferme la modal
            setSelectedMembre(null);
            setSelectedExo(null);
            setLoad(false);
        } catch (err) {
            toast.error("Erreur lors de la demande");
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescriptionOutlined sx={{ color: '#435844' }} />
                Nouvelle demande d'attestation
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    <Autocomplete
                        options={membres}
                        getOptionLabel={(option) => `${option.matricule} - ${option.nom} ${option.prenom}`}
                        onChange={(event, newValue) => setSelectedMembre(newValue)}
                        renderInput={(params) => (
                            <TextField {...params} label="Sélectionner le membre" variant="outlined" placeholder="Tapez le nom ou matricule..." />
                        )}
                    />

                    <Autocomplete
                        options={exercices}
                        getOptionLabel={(option) => {
                            if (!option) return "";

                            const debut = option.date_debut ? new Date(option.date_debut).toLocaleDateString('fr-FR') : '...';
                            const fin = option.date_fin ? new Date(option.date_fin).toLocaleDateString('fr-FR') : '...';

                            return `${option.libelle} : ${debut} - ${fin}`;
                        }}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        onChange={(event, newValue) => setSelectedExo(newValue)}
                        renderInput={(params) => (
                            <TextField {...params} label="Exercice concerné" variant="outlined" />
                        )}
                    />

                    {/* NOTICE INFORMATION COMPLETE SUR LES CIRCUITS */}
                    
                        <Alert 
                            icon={<InfoOutlined fontSize="medium" />} 
                            severity="info"
                            sx={{ 
                                borderRadius: 2, 
                                bgcolor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                color: '#334155',
                                '& .MuiAlert-icon': {
                                    color: '#435844'
                                }
                            }}
                        >
                            <AlertTitle sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', mb: 1 }}>
                                Rappel du circuit des validations
                            </AlertTitle>
                            
                            <Stack spacing={1}>
                                <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                                    • <strong>Si le solde est positif :</strong> La demande passe d'abord par le <strong>Secrétaire</strong>, puis le <strong>Secrétaire Général (SG)</strong>, et enfin le <strong>Président</strong>.
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                                    • <strong>Si le solde est nul ou négatif (à jour) :</strong> La demande est transmise directement au <strong>Secrétaire Général (SG)</strong>, puis au <strong>Président</strong>.
                                </Typography>
                            </Stack>
                        </Alert>
                   
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'none' }}>
                    Annuler
                </Button>
                <Button
                    variant="contained"
                    onClick={handleDemander}
                    disabled={!selectedMembre || !selectedExo}
                    sx={{
                        bgcolor: '#435844',
                        '&:hover': { bgcolor: '#354736' },
                        borderRadius: 2,
                        px: 4,
                        fontWeight: 700,
                        textTransform: 'none'
                    }}
                >
                    {load ? <CircularProgress size={16} /> : 'Demander'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};


const AttestationCard = ({ data, onRefresh, orderInfo }) => {
    const [openDelete, setOpenDelete] = useState(false);
    const [loading, setLoading] = useState(false);

    const axiosPrivate = useAxiosPrivate();
    // Calcul basé sur tes colonnes validation_1 et validation_2
    const valCount = (data.validation_1 ? 1 : 0) + (data.validation_2 ? 1 : 0);
    const progress = (valCount / 2) * 100;

    const handleDelete = async () => {
        try {
            await axiosPrivate.delete(`/api/attestations/delete/${data.id}`);
            onRefresh();
            setOpenDelete(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Erreur lors de la suppression");
        }
    };

    //imprimer l'attestation
    const handlePrintAttestation = async (data, orderInfo) => {
        try {
            setLoading(true);
            const doc = (
                <PdfAttestationExpA 
                rows={data} 
                infoSignataire={orderInfo} 
                />
            );

            // 3. On crée un Blob et on l'ouvre dans un nouvel onglet
            const blob = await pdf(doc).toBlob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            setLoading(false);
        } catch (error) {
            console.error("Erreur impression:", error);
            toast.error("Impossible de générer le PDF");
        }
    };

    return (
        <>
            <Card sx={{
                mb: 2, p: 2, borderRadius: 2, border: '1px solid #e0e4e7',
                display: 'flex', alignItems: 'center',
                transition: '0.2s',
                // --- LOGIQUE DE COULEUR DE FOND ---
                bgcolor: data.rejeter
                    ? '#FFF5F5' // Rouge très clair (rejet)
                    : (progress === 100 ? '#F6FFF6' : 'white'), // Vert très clair (terminé) ou Blanc
                '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }
            }}>
                <Stack direction="row" spacing={2} sx={{ minWidth: 500, borderRight: '1px solid #f0f0f0', pr: 2 }}>
                    <Avatar sx={{ width: 52, height: 52, bgcolor: '#f0f4f0', color: GREEN_MAIN, fontWeight: 800 }}>
                        {data.nom ? data.nom[0] : "?"}
                    </Avatar>
                    <Box>
                        {/* <Typography variant="caption" sx={{ color: GREEN_ACCENT, fontWeight: 800 }}>
                            #{data.matricule}
                        </Typography> */}
                        <Chip
                            label={data.num_attestation}
                            size="small"
                            sx={{
                                bgcolor: '#f0c77a',
                                color: 'black',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                borderRadius: '6px',
                                border: `1px solid #f0c77a30`,
                                height: 20
                            }}
                        />

                        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: '0.85rem' }}>
                            <Typography variant="caption" sx={{ color: GREEN_ACCENT, fontWeight: 800, fontSize: '0.85rem' }}>
                                #{data.matricule}
                            </Typography>{" "}{data.nom} {data.prenom}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.primary', fontWeight: 600, mt: 0.5 }}>
                            {data.section} — {data.titre}
                        </Typography>
                        <Chip
                            label={data.statut}
                            size="small"
                            sx={{
                                mt: 0.5, fontSize: '0.65rem', height: 18,
                                bgcolor: data.statut === 'Stagiaire' ? '#FFF3E0' : '#E3F2FD',
                                color: data.statut === 'Stagiaire' ? '#E65100' : '#1565C0',
                                fontWeight: 700
                            }}
                        />
                    </Box>
                </Stack>

                <Grid container sx={{ px: 2, flexGrow: 1 }}>
                    <Grid item xs={8}>
                        {/* Conteneur pour mettre Poste et Adhésion côte à côte */}
                        <Stack direction="row" spacing={3} sx={{ mb: 1 }}>
                            {/* Bloc Poste */}
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Poste
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {data.poste || 'Non renseigné'}
                                </Typography>
                            </Box>

                            {/* Bloc Adhésion */}
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Adhésion
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {data.date_adhesion ? new Date(data.date_adhesion).toLocaleDateString('fr-FR') : 'np'}
                                </Typography>
                            </Box>

                            {/* Bloc Adhésion */}
                            <Box >
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Exercice
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {data.exercice_label ? data.exercice_label : 'np'}
                                </Typography>
                            </Box>
                        </Stack>

                        {/* Ligne d'édition en bas (bien séparée) */}
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                color: 'text.secondary',
                                pt: 0.5,
                                borderTop: '1px dashed #f0f0f0' // Optionnel : une petite séparation légère
                            }}
                        >
                            <CalendarMonthOutlined sx={{ fontSize: 14 }} />
                            Édition : {data.date_edition ? new Date(data.date_edition).toLocaleDateString('fr-FR') : 'N/A'}
                        </Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">Solde Cotisation</Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <AccountBalanceWalletOutlined sx={{ fontSize: 16, color: data.solde > 0 ? '#d32f2f' : GREEN_MAIN }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, color: data.solde > 0 ? '#d32f2f' : GREEN_MAIN }}>
                                {fNum(data.solde)} Ar
                            </Typography>
                        </Stack>
                    </Grid>
                </Grid>

                <Box sx={{ minWidth: 200, textAlign: 'right', px: 2, borderLeft: '1px solid #f0f0f0' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: 800,
                                // --- LOGIQUE DE COULEUR DU TEXTE ---
                                color: data.rejeter ? '#d32f2f' : 'text.primary'
                            }}
                        >
                            {data.rejeter ? 'Validation : Rejetée' : `Validation : ${progress}%`}
                        </Typography>
                        <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Validateur 1"><CheckCircle sx={{ fontSize: 16, color: data.validation_1 ? GREEN_ACCENT : '#e0e0e0' }} /></Tooltip>
                            <Tooltip title="Validateur 2"><CheckCircle sx={{ fontSize: 16, color: data.validation_2 ? GREEN_ACCENT : '#e0e0e0' }} /></Tooltip>
                        </Stack>
                    </Stack>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 6, borderRadius: 5, bgcolor: '#f0f0f0',
                            '& .MuiLinearProgress-bar': { bgcolor: progress === 100 ? GREEN_MAIN : GREEN_ACCENT }
                        }}
                    />
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary', fontSize: '0.7rem' }}>
                        {progress === 100 ? "Prêt pour impression" : "Validation en cours"}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
                    <Tooltip title={progress < 100 ? "En attente de validations" : "Imprimer"}>
                        <span>
                            {progress < 100 ? (
                                /* 1. Version désactivée (Simple bouton sans lien) */
                                <IconButton
                                    disabled
                                    sx={{
                                        color: '#bdbdbd',
                                        border: '1px solid #e0e4e7',
                                        borderRadius: 2
                                    }}
                                >
                                    <PrintOutlined fontSize="small" />
                                </IconButton>
                            ) : (
                                /* 2. Version active (Le lien n'existe que quand c'est prêt) */
                               
                                <IconButton
                                    onClick={() => handlePrintAttestation(data, orderInfo)}
                                    sx={{
                                        bgcolor: '#f5f5f5',
                                        color: GREEN_MAIN,
                                        border: '1px solid #e0e4e7',
                                        borderRadius: 2,
                                        '&:hover': { bgcolor: '#eeeeee' }
                                    }}
                                >
                                    {loading ? <CircularProgress size={16} /> : <PrintOutlined fontSize="small" />}
                                </IconButton>
                            )}
                        </span>
                    </Tooltip>

                    <Tooltip title={valCount > 0 ? "Suppression impossible (déjà en cours de validation)" : "Supprimer la demande"}>
                        <span>
                            <IconButton
                                disabled={valCount > 0}
                                onClick={() => setOpenDelete(true)}
                                sx={{
                                    color: valCount > 0 ? '#bdbdbd' : '#d32f2f',
                                    border: '1px solid',
                                    borderColor: valCount > 0 ? '#e0e4e7' : '#ffcdd2',
                                    borderRadius: 2,
                                    '&:hover': { bgcolor: '#fff5f5' }
                                }}
                            >
                                <DeleteOutline fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <IconButton><MoreVert /></IconButton>
                </Stack>
            </Card>

            {/* Rendu de la Popup SaaS */}
            <ConfirmDeleteModal
                open={openDelete}
                onClose={() => setOpenDelete(false)}
                onConfirm={handleDelete}
                title={`${data.nom} ${data.prenom}`}
            />
        </>
    );
};

const ConfirmDeleteModal = ({ open, onClose, onConfirm, title }) => (
    <Dialog
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
    >
        <DialogTitle sx={{ fontWeight: 800, color: '#d32f2f' }}>
            Confirmer la suppression
        </DialogTitle>
        <DialogContent>
            <Typography variant="body1">
                Êtes-vous sûr de vouloir supprimer la demande d'attestation pour <strong>{title}</strong> ?
                Cette action est irréversible.
            </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
            <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 700 }}>
                Annuler
            </Button>
            <Button
                onClick={onConfirm}
                variant="contained"
                sx={{
                    bgcolor: '#d32f2f',
                    '&:hover': { bgcolor: '#b71c1c' },
                    borderRadius: 2,
                    fontWeight: 700
                }}
            >
                Supprimer définitivement
            </Button>
        </DialogActions>
    </Dialog>
);

const AttestationsPage = () => {
    const axiosPrivate = useAxiosPrivate();
    const [searchTerm, setSearchTerm] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('toutes');

    // États pour les données du back
    const [allAttestations, setAllAttestations] = useState([]);
    const [membresData, setMembresData] = useState([]);
    const [exercicesData, setExercicesData] = useState([]);
    const [orderInfo, setOrderInfo] = useState({});

    const [president, setPresident] = useState(false);
    const [secretaireGen, setSecretaireGen] = useState(false);

    const loadData = async () => {
        try {
            const [resA, resM, resE] = await Promise.all([
                axiosPrivate.get('/api/attestations'),
                axiosPrivate.get('/api/membres'), // ta route qui renvoie les membres
                axiosPrivate.get('/api/exercices')
            ]);

            const { data, poste } = resA.data;

            recup_poste(poste);
            setAllAttestations(data);
            setMembresData(resM.data);
            setExercicesData(resE.data);
        } catch (err) {
            console.error("Erreur chargement back", err);
        }
    };

    const recup_poste = (poste) => {
        if (poste === 'Président') {
            setPresident(true);
        }

        if (poste === 'Secrétaire Général') {
            setSecretaireGen(true);
        }
    }

    useEffect(() => {
        loadData();
        fetchSettings();
    }, []);

    //récupération infos signataire
    const fetchSettings = async () => {
        try {
            const res = await axiosPrivate.get('/api/settings-ordre');
            if (res.data) setOrderInfo(res.data);

        } catch (err) {
            showNotify("Erreur lors du chargement des données", "error");
        }
    };

    // const filteredList = useMemo(() => {
    //     return allAttestations.filter(item =>
    //         (item.nom?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    //         (item.prenom?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    //         (item.matricule?.toLowerCase().includes(searchTerm.toLowerCase()))
    //     );
    // }, [searchTerm, allAttestations]);

    const filteredList = useMemo(() => {
        return allAttestations.filter(item => {
            // 1. Filtre Recherche (Déjà existant)
            const matchesSearch =
                item.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.matricule?.toLowerCase().includes(searchTerm.toLowerCase());

            // 2. Filtre Statut Validation
            let matchesStatus = true;
            const isValideTotal = item.validation_1 && item.validation_2;

            if (filterStatus === 'rejetees') {
                matchesStatus = item.rejeter === true;
            } else if (filterStatus === 'validees') {
                matchesStatus = isValideTotal && !item.rejeter;
            } else if (filterStatus === 'en_attente') {
                matchesStatus = !isValideTotal && !item.rejeter;
            }

            return matchesSearch && matchesStatus;
        });
    }, [searchTerm, allAttestations, filterStatus]);

    return (
        <Box sx={{ p: 2 }}>
            <MyBreadcrumbs currentPath="Demande attestation" />
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: GREEN_MAIN }}>Demandes Attestations</Typography>
                    <Typography variant="body2" color="text.secondary">Suivi de vos demandes d'attestation</Typography>
                </Box>

                <Stack direction="row" spacing={2}>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setOpenModal(true)}
                        sx={{
                            bgcolor: '#435844',
                            '&:hover': { bgcolor: '#354736' },
                            borderRadius: 3,
                            textTransform: 'none',
                            fontWeight: 700
                        }}
                    >
                        Demander une attestation
                    </Button>

                    <TextField
                        placeholder="Rechercher par nom ou matricule..."
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ width: 350, bgcolor: 'transparent', '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment>
                            ),
                        }}
                    />
                    <IconButton sx={{ bgcolor: 'white', border: '1px solid #e0e4e7', borderRadius: 2 }}>
                        <FilterList />
                    </IconButton>
                </Stack>
            </Stack>

            <Box sx={{ borderBottom: '1px solid #e0e4e7', mb: 3 }}>
                <Tabs
                    value={filterStatus}
                    onChange={(e, newValue) => setFilterStatus(newValue)}
                    textColor="primary"
                    indicatorColor="primary"
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            minWidth: 100
                        },
                        '& .MuiTabs-indicator': { bgcolor: GREEN_MAIN }
                    }}
                >
                    <Tab label="Toutes" value="toutes" />
                    <Tab label="Validées" value="validees" />
                    <Tab label="En attente" value="en_attente" />
                    <Tab label="Rejetées" value="rejetees" />
                </Tabs>
            </Box>

            <Box>
                {filteredList.length > 0 ? (
                    filteredList.map(item => <AttestationCard key={item.id} data={item} onRefresh={loadData} orderInfo={orderInfo} />)
                ) : (
                    <Box sx={{ textAlign: 'center', py: 10 }}>
                        <Typography color="text.secondary">Aucune attestation trouvée.</Typography>
                    </Box>
                )}
            </Box>

            <DemandeAttestationModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                membres={membresData}
                exercices={exercicesData}
                onRefresh={loadData}
            />
        </Box>
    );
};

export default AttestationsPage;
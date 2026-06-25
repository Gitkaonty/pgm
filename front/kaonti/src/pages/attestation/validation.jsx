import React, { useState, useMemo, useEffect } from 'react';
import {
    Box, Typography, TextField, InputAdornment, Card, Stack,
    Avatar, Chip, LinearProgress, Grid, IconButton, Tooltip,
    Breadcrumbs, Link, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, Autocomplete,
    CircularProgress
} from '@mui/material';
import {
    Search, FilterList, CheckCircle, MoreVert,
    AccountBalanceWalletOutlined, CalendarMonthOutlined,
    PrintOutlined, NavigateNext, HomeOutlined, Add,
    DescriptionOutlined, DeleteOutline
} from '@mui/icons-material';
import useAxiosPrivate from '../../../config/axiosPrivate';
import toast, { Toaster } from 'react-hot-toast';
import { Tabs, Tab } from '@mui/material';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';
import PdfAttestationExpA from './pdf_attestation';
import { pdf } from '@react-pdf/renderer';
import QRCode from 'qrcode';

const GREEN_MAIN = '#435844';
const GREEN_ACCENT = '#8BC34A';

// --- COMPOSANTS UTILITAIRES ---
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
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

// --- MODAL DE CONFIRMATION VALIDATION ---
const ConfirmValidationModal = ({ open, onClose, onConfirm, step, name }) => {
    // On définit si c'est un rejet ou une validation
    const isRejet = step === 0;

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
            <DialogTitle sx={{
                fontWeight: 800,
                color: isRejet ? '#d32f2f' : GREEN_MAIN,
                display: 'flex',
                alignItems: 'center',
                gap: 1
            }}>
                {isRejet ? <DeleteOutline /> : <CheckCircle sx={{ color: GREEN_ACCENT }} />}
                {isRejet ? 'Confirmer le rejet' : 'Confirmer la validation'}
            </DialogTitle>

            <DialogContent>
                <Typography>
                    {isRejet ? (
                        <>Voulez-vous rejeter la demande de <strong>{name}</strong> ? Cette action annulera les validations précédentes.</>
                    ) : (
                        <>Voulez-vous approuver la demande de <strong>{name}</strong> pour l'étape <strong>{step === 1 ? 'Secrétariat' : step === 2 ?'Présidence': 'SG'}</strong> ?</>
                    )}
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
                        bgcolor: isRejet ? '#d32f2f' : GREEN_MAIN,
                        '&:hover': { bgcolor: isRejet ? '#b71c1c' : '#354736' },
                        borderRadius: 2,
                        fontWeight: 700,
                        textTransform: 'none'
                    }}
                >
                    
                    {isRejet ? 'Oui, rejeter' : 'Oui, approuver'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// --- MODAL DE SUPPRESSION ---
const ConfirmDeleteModal = ({ open, onClose, onConfirm, title }) => (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#d32f2f' }}>Confirmer la suppression</DialogTitle>
        <DialogContent>
            <Typography>Êtes-vous sûr de vouloir supprimer la demande de <strong>{title}</strong> ?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
            <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 700 }}>Annuler</Button>
            <Button onClick={onConfirm} variant="contained" sx={{ bgcolor: '#d32f2f', borderRadius: 2, fontWeight: 700 }}>Supprimer</Button>
        </DialogActions>
    </Dialog>
);

// --- MODAL DEMANDE ---
const DemandeAttestationModal = ({ open, onClose, membres, exercices, onRefresh }) => {
    const axiosPrivate = useAxiosPrivate();
    const [selectedMembre, setSelectedMembre] = useState(null);
    const [selectedExo, setSelectedExo] = useState(null);

    const handleDemander = async () => {
        if (!selectedMembre || !selectedExo) {
            toast.error("Veuillez remplir tous les champs");
            return;
        }
        try {
            await axiosPrivate.post('/api/attestations/create', {
                membre_id: selectedMembre.id,
                exercice_id: selectedExo.id
            });
            toast.success("Demande créée !");
            onRefresh();
            onClose();
            setSelectedMembre(null);
            setSelectedExo(null);
        } catch (err) {
            toast.error("Erreur lors de la demande");
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescriptionOutlined sx={{ color: GREEN_MAIN }} /> Nouvelle demande
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    <Autocomplete
                        options={membres}
                        getOptionLabel={(o) => `${o.matricule} - ${o.nom} ${o.prenom}`}
                        onChange={(e, v) => setSelectedMembre(v)}
                        renderInput={(p) => <TextField {...p} label="Membre" variant="outlined" />}
                    />
                    <Autocomplete
                        options={exercices}
                        getOptionLabel={(o) => `${o.libelle} : ${new Date(o.date_debut).toLocaleDateString('fr-FR')} - ${new Date(o.date_fin).toLocaleDateString('fr-FR')}`}
                        onChange={(e, v) => setSelectedExo(v)}
                        renderInput={(p) => <TextField {...p} label="Exercice" variant="outlined" />}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose}>Annuler</Button>
                <Button variant="contained" onClick={handleDemander} sx={{ bgcolor: GREEN_MAIN, borderRadius: 2 }}>Demander</Button>
            </DialogActions>
        </Dialog>
    );
};

// --- CARTE D'ATTESTATION ---
const AttestationCard = ({ data, onRefresh, onValidateRequest, orderInfo, president,secretaireGen }) => {
    const [openDelete, setOpenDelete] = useState(false);
    const [loading, setLoading] = useState(false);
    const [openSigChoice, setOpenSigChoice] = useState(false);

    const axiosPrivate = useAxiosPrivate();

    const valCount = (data.validation_1 ? 1 : 0) + (data.validation_2 ? 1 : 0);
    const progress = (valCount / 2) * 100;

    const handleDelete = async () => {
        try {
            await axiosPrivate.delete(`/api/attestations/delete/${data.id}`);
            toast.success("Supprimé !");
            onRefresh();
            setOpenDelete(false);
        } catch (err) {
            toast.error("Erreur suppression");
        }
    };

    //imprimer l'attestation
    const handlePrintAttestation = async (data, orderInfo, withSignature) => {
        try {
            setLoading(true);

            // QR code → page du site selon la catégorie du membre (comme l'appel)
            const siteBase = import.meta.env.VITE_PUBLIC_SITE_URL || 'https://www.oecfm.mg';
            let qrPath = '';
            if (data.statut === 'Stagiaire' || data.statut === 'Expert Stagiaire') {
                qrPath = '/fr/liste-stagiaire';
            } else if (data.titre === 'Tableau A') {
                qrPath = '/fr/tableau-a';
            } else if (data.titre === 'Tableau B') {
                qrPath = '/fr/tableau-b';
            }
            const qrDataUrl = await QRCode.toDataURL(`${siteBase}${qrPath}`, { margin: 1, width: 240 });

            const doc = (
                <PdfAttestationExpA
                rows={data}
                infoSignataire={orderInfo}
                withSignature={withSignature}
                qrDataUrl={qrDataUrl}
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
                        {/* <Typography variant="caption" sx={{ color: GREEN_ACCENT, fontWeight: 800 }}>#{data.matricule}</Typography> */}
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

                        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 ,fontSize: '0.85rem'}}>
                            <Typography variant="caption" sx={{ color: GREEN_ACCENT, fontWeight: 800, fontSize: '0.85rem' }}>
                                #{data.matricule}
                            </Typography>{" "}{data.nom} {data.prenom}
                        </Typography>
                        {/* <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{data.nom} {data.prenom}</Typography> */}
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>{data.section} — {data.titre}</Typography>
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
                        <Stack direction="row" spacing={3} sx={{ mb: 1 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Poste</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{data.poste || 'NP'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Adhésion</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {data.date_adhesion ? new Date(data.date_adhesion).toLocaleDateString('fr-FR') : 'NP'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Exercice</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{data.exercice_label || 'NP'}</Typography>
                            </Box>
                        </Stack>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', pt: 0.5, borderTop: '1px dashed #f0f0f0' }}>
                            <CalendarMonthOutlined sx={{ fontSize: 14 }} /> Édition : {data.date_edition ? new Date(data.date_edition).toLocaleDateString('fr-FR') : 'N/A'}
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

                <Box sx={{flex:1}}></Box>

                <Box sx={{ minWidth: 200, textAlign: 'right', px: 2, borderLeft: '1px solid #f0f0f0' }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
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
                            <CheckCircle sx={{ fontSize: 16, color: data.validation_1 ? GREEN_ACCENT : '#e0e0e0' }} />
                            <CheckCircle sx={{ fontSize: 16, color: data.validation_2 ? GREEN_ACCENT : '#e0e0e0' }} />
                        </Stack>
                    </Stack>
                    <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 5, bgcolor: '#f0f0f0', '& .MuiLinearProgress-bar': { bgcolor: GREEN_MAIN } }} />
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary', fontSize: '0.7rem' }}>
                        {progress === 100 ? "Prêt pour impression" : "Validation en cours"}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
                    {!data.rejeter && !data.validation_0 && !data.validation_1 && !data.validation_2 && !secretaireGen && !president && (
                        <Button variant="contained" size="small" onClick={() => onValidateRequest(data, 3)} sx={{ bgcolor: GREEN_ACCENT, textTransform: 'none' }}>Valider V0</Button>
                    )}
                    {!data.rejeter && data.validation_0 && !data.validation_1 && secretaireGen && (
                        <Button variant="contained" size="small" onClick={() => onValidateRequest(data, 1)} sx={{ bgcolor: GREEN_ACCENT, textTransform: 'none' }}>Valider V1</Button>
                    )}
                    {!data.rejeter && data.validation_0 && data.validation_1 && !data.validation_2 && president && (
                        <Button variant="contained" size="small" onClick={() => onValidateRequest(data, 2)} sx={{ bgcolor: GREEN_MAIN, textTransform: 'none' }}>Valider V2</Button>
                    )}

                    {/* && (secretaireGen || president) : enlever car les admin peuvent maintenant rejeter des demandes*/}
                    {progress < 100  && (
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => onValidateRequest(data, 0)} // On envoie 0 pour signifier le rejet
                            sx={{ textTransform: 'none', borderRadius: 1 }}
                        >
                            Rejeter
                        </Button>
                    )}

                    {/* {progress === 100 && ( */}
                        {/* <IconButton sx={{ border: '1px solid #e0e4e7', color: GREEN_MAIN }}><PrintOutlined fontSize="small" /></IconButton> */}
                    {/* )} */}

                    <IconButton
                        onClick={() => setOpenSigChoice(true)}
                        sx={{
                            bgcolor: progress === 100 ? '#f5f5f5' : 'transparent',
                            color: progress === 100 ? GREEN_MAIN : '#bdbdbd',
                            border: '1px solid #e0e4e7',
                            borderRadius: 2
                        }}
                    >
                        {loading ? <CircularProgress size={16} /> : <PrintOutlined fontSize="small" />}
                    </IconButton>


                    <IconButton onClick={() => setOpenDelete(true)} disabled={valCount > 0} color="error"><DeleteOutline fontSize="small" /></IconButton>

                </Stack>
            </Card>

            <ConfirmDeleteModal open={openDelete} onClose={() => setOpenDelete(false)} onConfirm={handleDelete} title={`${data.nom} ${data.prenom}`} />

            {/* Choix : impression avec ou sans signature électronique */}
            <Dialog open={openSigChoice} onClose={() => setOpenSigChoice(false)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>Impression de l'attestation</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        Voulez-vous imprimer l'attestation <strong>avec la signature électronique</strong> ou <strong>sans</strong> ?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setOpenSigChoice(false)} sx={{ color: 'text.secondary', fontWeight: 700 }}>Annuler</Button>
                    <Button
                        variant="outlined"
                        onClick={() => { setOpenSigChoice(false); handlePrintAttestation(data, orderInfo, false); }}
                        sx={{ fontWeight: 700, textTransform: 'none' }}
                    >
                        Sans signature
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => { setOpenSigChoice(false); handlePrintAttestation(data, orderInfo, true); }}
                        sx={{ bgcolor: GREEN_MAIN, fontWeight: 700, textTransform: 'none' }}
                    >
                        Avec signature
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

// --- PAGE PRINCIPALE ---
const ValidationAttestationsPage = () => {
    const axiosPrivate = useAxiosPrivate();
    const [searchTerm, setSearchTerm] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [allAttestations, setAllAttestations] = useState([]);
    const [membresData, setMembresData] = useState([]);
    const [exercicesData, setExercicesData] = useState([]);
    const [filterStatus, setFilterStatus] = useState('toutes');
    const [orderInfo,setOrderInfo] = useState({});

    // État pour la popup de validation
    const [openConfirmVal, setOpenConfirmVal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    const [president, setPresident] = useState(false);
    const [secretaireGen, setSecretaireGen] = useState(false);

    const loadData = async () => {
        try {
            const [resA, resM, resE] = await Promise.all([
                axiosPrivate.get('/api/attestations'),
                axiosPrivate.get('/api/membres'),
                axiosPrivate.get('/api/exercices')
            ]);

             const { data, poste } = resA.data;

            recup_poste(poste);
            setAllAttestations(data);
            setMembresData(resM.data);
            setExercicesData(resE.data);
        } catch (err) { console.error(err); }
    };

    const recup_poste = (poste) => {
        if(poste ==='Président'){
            setPresident(true);
        }

        if(poste ==='Secrétaire Général'){
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

    const handleValidateRequest = (attestation, step) => {
        setSelectedTask({ id: attestation.id, step, name: `${attestation.nom} ${attestation.prenom}` });
        setOpenConfirmVal(true);
    };

    const handleExecuteValidation = async () => {
        try {
            await axiosPrivate.patch(`/api/attestations/validate/${selectedTask.id}`, { step: selectedTask.step });
            toast.success("Validation enregistrée !");
            setOpenConfirmVal(false);
            loadData();
        } catch (err) { toast.error("Erreur de validation"); }
    };

    // const filteredList = useMemo(() => {
    //     return allAttestations.filter(item =>
    //         item.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //         item.matricule?.toLowerCase().includes(searchTerm.toLowerCase())
    //     );
    // }, [searchTerm, allAttestations]);

    return (
        <Box sx={{ p: 2 }}>
            <Toaster position="top-right" />
            <MyBreadcrumbs currentPath="Validation attestation" />

            <Stack direction="row" justifyContent="space-between" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: GREEN_MAIN }}>Validations des attestations</Typography>
                    <Typography variant="body2" color="text.secondary">Approuvez les demandes en attente</Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    {/* <Button variant="contained" startIcon={<Add />} onClick={() => setOpenModal(true)} sx={{ bgcolor: GREEN_MAIN, borderRadius: 3 }}>Nouvelle demande</Button> */}
                    <TextField
                        placeholder="Rechercher..."
                        size="small"
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
                        sx={{ width: 300, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
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
                {filteredList.map(item => (
                    <AttestationCard key={item.id} data={item} onRefresh={loadData} onValidateRequest={handleValidateRequest} orderInfo={orderInfo} president={president} secretaireGen={secretaireGen}/>
                ))}
            </Box>

            <DemandeAttestationModal open={openModal} onClose={() => setOpenModal(false)} membres={membresData} exercices={exercicesData} onRefresh={loadData} />

            <ConfirmValidationModal
                open={openConfirmVal}
                onClose={() => setOpenConfirmVal(false)}
                onConfirm={handleExecuteValidation}
                step={selectedTask?.step}
                name={selectedTask?.name}
            />
        </Box>
    );
};

export default ValidationAttestationsPage;
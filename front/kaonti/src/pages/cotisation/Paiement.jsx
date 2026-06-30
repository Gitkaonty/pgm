import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Stack, FormControl, Select, MenuItem,
    Dialog, DialogTitle, DialogContent, DialogActions, Grid,
    TextField, Autocomplete, InputAdornment, IconButton, Divider,
    InputLabel,
    CircularProgress,
    Breadcrumbs,
    Link,
    Badge,
    Tooltip
} from '@mui/material';
import { DataGrid, frFR, GridToolbar, useGridApiContext, GridFooterContainer, GridFooter } from '@mui/x-data-grid';
import AddCardIcon from '@mui/icons-material/AddCard';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { NumericFormat } from 'react-number-format';
import useAxiosPrivate from '../../../config/axiosPrivate';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import toast from 'react-hot-toast';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Icône pleine pour le validé
import PendingActionsIcon from '@mui/icons-material/PendingActions'; // Icône pour l'attente
import Chip from '@mui/material/Chip';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { GridPagination } from '@mui/x-data-grid';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';
import XLSX from 'xlsx-js-style';
import { HomeOutlined, LocalPrintshopOutlined, NavigateNext } from '@mui/icons-material';
import SendEmailModal from './PaiementSendMail';
import EmailIcon from '@mui/icons-material/Email';
import ConfirmSingleModal from '../../components/ConfirmSingleEmailModal';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import { URL } from '../../../config/axios';
import { jwtDecode } from 'jwt-decode';
import useAuth from '../../hooks/useAuth';
import { pdf } from '@react-pdf/renderer';
import PaiementTableauPDF from './PaiementTableauPDF';
import TicketCaissePDF from './TicketCaissePDF';
import QRCode from 'qrcode';

const MyBreadcrumbs = ({ currentPath }) => (
    <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="/dashboard" sx={{ display: 'flex', alignItems: 'center' }}>
            <HomeOutlined sx={{ mr: 0.5, fontSize: 20 }} /> Dashboard
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>{currentPath}</Typography>
    </Breadcrumbs>
);

const formatRef = (row) => {
    if (row.ref_prefix && row.ref_seq) {
        return `${row.ref_prefix}${row.ref_seq.toString().padStart(6, '0')}`;
    }
    return row.reference || "N/A";
};

const PaiementPage = () => {
    const axiosPrivate = useAxiosPrivate();
    // --- STATES DONNÉES ---
    const [selectedEx, setSelectedEx] = useState('');
    const [exerciceLabel, setExerciceLabel] = useState('');
    const [membres, setMembres] = useState([]);
    const [membre_id, setMembre_id] = useState(null);
    const [exercices, setExercices] = useState([]);
    const [rows, setRows] = useState([]); // Doit contenir { id, matricule, nom, prenom, section, statut, titre, anouveau, cotisation, autre }
    const [openModal, setOpenModal] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [currentMember, setCurrentMember] = useState(null);

    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState([]);
    const [historyTarget, setHistoryTarget] = useState('');

    const [singleModalOpen, setSingleModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [orderInfo, setOrderInfo] = useState({});
    const [showComponent, setShowComponent] = useState(false);

    const [loading, setLoading] = useState(false);

    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        onConfirm: null,
        color: 'primary'
    });

    const { auth } = useAuth();

    const decoded = auth?.accessToken
        ? jwtDecode(auth.accessToken)
        : undefined

    const roles = decoded.UserInfo.roles;
    const userId = decoded.UserInfo.userId || null;

    useEffect(() => {
        if ([3355, 5150].includes(roles)) {
            setShowComponent(true);
        }
    }, [roles]);

    //ENVOI MAIL================================================================================================
    const handleOpenEmail = (member = null) => {
        setCurrentMember(member); // Si null, ce sera "Tous les membres" par défaut
        setEmailModalOpen(true);
    };

    const handleSendBulk = async () => {
        // Appel à la nouvelle route bulk
        await handleSendMail('all');
    };

    const handleConfirmSingle = async () => {
        setIsSending(true); // 1. On active le chargement
        try {
            const ex = exercices.find(e => e.id === selectedEx);
            if (!ex) return "";

            const date_start = new Date(ex.date_debut).toLocaleDateString('fr-FR');
            const date_fin = new Date(ex.date_fin).toLocaleDateString('fr-FR');

            // On utilise l'ID stocké quand on a cliqué sur l'icône
            await axiosPrivate.post(`/api/paiements/${selectedRow.id}/send-email`, {
                dateFin: ex.date_fin
            });

            toast.success("Email envoyé avec succès !");
            setSingleModalOpen(false); // On ferme le popup
            await loadPaiements(selectedEx);          // On rafraîchit le tableau
        } catch (err) {
            toast.error("Erreur lors de l'envoi");
        } finally {
            setIsSending(false); // 2. On désactive le chargement (qu'il y ait succès ou erreur)
        }
    };

    const handleSendMail = async (target) => {
        try {
            const ex = exercices.find(e => e.id === selectedEx);
            if (!ex) return "";

            const date_start = new Date(ex.date_debut).toLocaleDateString('fr-FR');
            const date_fin = new Date(ex.date_fin).toLocaleDateString('fr-FR');

            // Définition de l'URL selon la cible
            const url = target === 'all'
                ? '/api/paiements/send-email-bulk'
                : `/api/paiements/${target}/send-email`;

            await axiosPrivate.post(url, {
                dateFin: ex.date_fin,
                paiementIds: target === 'all' ? rows.map(row => row.id) : null
            });

            toast.success(target === 'all' ? "Envois groupés terminés !" : "Email envoyé !");

            // On rafraîchit les données pour mettre à jour les badges (email_logs)
            await loadPaiements(selectedEx);

        } catch (err) {
            console.error(err);
            toast.error("Erreur lors de l'envoi");
        }
    };

    //affichage mail historique
    const handleShowEmailHistory = async (row) => {
        try {
            // Optionnel : afficher un loader si tu veux être très propre
            //const response = await axiosPrivate.get(`/api/dashboard/stats/${selectedEx}`);
            const response = await axiosPrivate.get(`/api/paiements/${row.id}/email-logs`);

            // On stocke les logs récupérés
            setSelectedHistory(response.data);
            setHistoryTarget(`${row.nom} ${row.prenom}`);
            setHistoryModalOpen(true);
        } catch (error) {
            console.error("Erreur lors de la récupération de l'historique :", error);
            toast.error("Impossible de charger l'historique des emails.");
        }
    };

    // --- FORM STATE MODAL ---
    const initialForm = {
        date: new Date().toISOString().split('T')[0],
        membreId: null,
        exerciceId: '',
        sitAnouveau: 0,
        sitCotisation: 0,
        sitAutre: 0,
        payeAnouveau: 0,
        payeCotisation: 0,
        payeAutre: 0,
        mode: 'Espèce',
        reference: ''
    };
    const [form, setForm] = useState(initialForm);

    const handleToggleValidation = (row) => {
        const isCurrentlyValid = row.valide;
        const action = isCurrentlyValid ? 'unvalidate' : 'validate';
        const label = isCurrentlyValid ? 'dévalider' : 'valider';

        setConfirmDialog({
            open: true,
            title: `${label.charAt(0).toUpperCase() + label.slice(1)} le règlement`,
            message: `Voulez-vous vraiment ${label} cet encaissement ?`,
            color: isCurrentlyValid ? "warning" : "success", // Orange pour dévalider
            onConfirm: async () => {
                try {
                    await axiosPrivate.put(`/api/paiements/${row.id}/${action}`);
                    toast.success(`Règlement ${label}é !`);
                    loadPaiements(selectedEx);
                } catch (err) {
                    toast.error(`Erreur lors de la ${label}ation`);
                }
            }
        });
    };

    useEffect(() => {
        const fetchDataInit = async () => {
            try {
                const [resEx, resMem] = await Promise.all([
                    axiosPrivate.get('/api/exercices'),
                    axiosPrivate.get('/api/membres')
                ]);
                setExercices(resEx.data);
                //setMembres(resMem.data);
                if (resEx.data.length > 0) setSelectedEx(resEx.data[0].id);
                const response = await axiosPrivate.get(`/api/membres/${resEx.data[0].date_fin}/active`);
                setMembres(response.data);
            } catch (err) { toast.error("Erreur chargement données"); }
        };
        fetchDataInit();
        fetchSettings();
    }, [axiosPrivate]);

    useEffect(() => {
        const fetchDataInit = async () => {
            try {
                const ex = exercices.find(e => e.id === selectedEx);
                if (!ex) return "";

                const response = await axiosPrivate.get(`/api/membres/${ex.date_fin}/active`);
                setMembres(response.data);
            } catch (err) { toast.error("Erreur chargement données"); }
        };
        fetchDataInit();
        fetchSettings();
    }, [selectedEx]);

    useEffect(() => {
        const fetchSynthese = async () => {
            // Condition : exercice et membre doivent être sélectionnés

            if (form.exerciceId && form.membreId) {
                const ex = exercices.find(e => e.id === form.exerciceId);
                if (!ex) return "";

                const date_start = new Date(ex.date_debut).toLocaleDateString('fr-FR');
                const date_fin = new Date(ex.date_fin).toLocaleDateString('fr-FR');

                try {
                    const response = await axiosPrivate.get('/api/paiements/synthese-reglement', {
                        params: {
                            membreId: form.membreId,
                            exerciceId: form.exerciceId,
                            // On récupère la date_debut depuis l'objet exercice sélectionné
                            dateDebut: ex.date_debut
                        }
                    });

                    const { anouveau, cotisAnnee, autreAppel } = response.data;

                    // Mise à jour des champs
                    setForm(prev => ({
                        ...prev,
                        sitAnouveau: anouveau,
                        sitCotisation: cotisAnnee,
                        sitAutre: autreAppel,

                    }));

                } catch (error) {
                    toast.error("Erreur lors de la récupération du solde");
                }
            }
        };

        fetchSynthese();
        fetchSettings();
    }, [form.exerciceId, form.membreId]);

    //récupération infos signataire
    const fetchSettings = async () => {
        try {
            const res = await axiosPrivate.get('/api/settings-ordre');
            if (res.data) setOrderInfo(res.data);

        } catch (err) {
        }
    };

    // --- CONFIGURATION COLONNES DATAGRID ---
    const columns = [
        { field: 'created_at', headerName: "Édition", width: 100, pinned: 'left', valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('fr-FR') : '' },
        { field: 'date', headerName: "date paiement", width: 120, editable: true, type: 'date', pinned: 'left', valueGetter: (p) => p.value ? new Date(p.value) : null, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('fr-FR') : '' },
        { field: 'matricule', headerName: 'Matricule', width: 120 },
        {
            field: 'fullName',
            headerName: 'Membre',
            width: 350,
            // Correction : on extrait "row" de l'objet de paramètres
            valueGetter: (params) => {
                const row = params.row;
                if (!row) return '';
                return `${row.nom || ''} ${row.prenom || ''}`.trim();
            }
        },
        {
            field: 'num_ticket',
            headerName: 'Référence paiement',
            width: 200,
        },
        { field: 'mode', headerName: 'Mode de règlement', width: 175 },
        { field: 'reference', headerName: 'Détails paiement', width: 250 },
        {
            field: 'anouveau',
            headerName: 'Pai. A-nouveau',
            type: 'number',
            width: 180,
            // On déstructure l'objet pour récupérer { value }
            valueFormatter: ({ value }) => value ? `${value.toLocaleString('fr-FR')} Ar` : '0 Ar'
        },
        {
            field: 'cotis_annee',
            headerName: 'Pai. Cotis. Année',
            type: 'number',
            width: 180,
            valueFormatter: ({ value }) => value ? `${value.toLocaleString('fr-FR')} Ar` : '0 Ar'
        },
        {
            field: 'autre_appel',
            headerName: 'Pai. Autre Appel',
            type: 'number',
            width: 180,
            valueFormatter: ({ value }) => value ? `${value.toLocaleString('fr-FR')} Ar` : '0 Ar'
        },
        {
            field: 'total',
            headerName: 'Total Payé',
            type: 'number',
            width: 180,
            cellClassName: 'font-bold-green',
            valueFormatter: ({ value }) => value ? `${value.toLocaleString('fr-FR')} Ar` : '0 Ar'
        },
        {
            field: 'valide',
            headerName: 'ÉTAT',
            width: 120,
            renderCell: (params) => {
                const isValid = params.value; // true ou false provenant du back (Sequelize)

                return (
                    <Stack direction="row" alignItems="center" spacing={1}>
                        {isValid ? (
                            <Chip
                                icon={<CheckCircleIcon style={{ color: '#1b4332' }} />}
                                label="Validé"
                                size="small"
                                sx={{
                                    bgcolor: '#dcfce7',
                                    color: '#1b4332',
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    border: '1px solid #1b4332'
                                }}
                            />
                        ) : (
                            <Chip
                                icon={<PendingActionsIcon style={{ color: '#991b1b' }} />}
                                label="En attente"
                                size="small"
                                sx={{
                                    bgcolor: '#fee2e2',
                                    color: '#991b1b',
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    border: '1px solid #991b1b'
                                }}
                            />
                        )}
                    </Stack>
                );
            }
        },
        {
            field: 'nb_envois',
            headerName: 'SUIVI MAIL',
            width: 110,
            headerAlign: 'center', // Aligne le titre au centre
            align: 'center',       // Aligne le contenu de la cellule au centre
            renderCell: (params) => (
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%'
                }}>
                    <IconButton
                        size="small"
                        onClick={() => handleShowEmailHistory(params.row)}
                        sx={{ padding: '4px' }} // Réduit le padding pour que le badge reste bien centré
                    >
                        <Badge
                            badgeContent={params.value}
                            color="primary"
                            slotProps={{ badge: { style: { fontSize: '0.65rem', height: '16px', minWidth: '16px' } } }}
                        >
                            <EmailIcon
                                fontSize="small"
                                sx={{ color: params.value > 0 ? '#2563EB' : '#94a3b8' }}
                            />
                        </Badge>
                    </IconButton>
                </Box>
            )
        },
        {
            field: 'actions',
            headerName: 'ACTIONS',
            width: 175,
            renderCell: (p) => (
                <Stack direction="row" spacing={0.5}>
                    {/* Bouton dynamique : Valider OU Dévalider */}
                    {showComponent &&
                        <IconButton
                            size="small"
                            onClick={() => handleToggleValidation(p.row)}
                            sx={{ color: p.row.valide ? '#ed6c02' : '#059669' }} // Orange si validé, Vert sinon
                            title={p.row.valide ? "Dévalider" : "Valider"}
                        >
                            {p.row.valide ? (
                                <SettingsBackupRestoreIcon fontSize="small" />
                            ) : (
                                <CheckCircleOutlineIcon fontSize="small" />
                            )}
                        </IconButton>
                    }

                    {showComponent &&
                        <IconButton
                            disabled={!p.row.valide}
                            onClick={() => {
                                setSelectedRow(p.row); // On capture la ligne (id, nom, prenom)
                                setSingleModalOpen(true);   // On ouvre le popup
                            }}
                        >
                            <ForwardToInboxIcon sx={{ color: '#2563EB', fontSize: '20px' }} />
                        </IconButton>
                    }

                    {/* Bouton Impression Ticket */}
                    <IconButton
                        onClick={() => handlePrintCaisse(p.row, exercices, orderInfo, selectedEx)}
                        size="small"
                        sx={{ color: '#1b4332' }}
                        disabled={loading}
                        title="Imprimer le ticket"
                    >
                        {loading ? <CircularProgress size={16} /> : <LocalPrintshopOutlined fontSize="small" />}
                    </IconButton>

                    <IconButton
                        size="small"
                        disabled={p.row.valide}
                        onClick={() => handleDelete(p.row.id)}
                        sx={{ color: '#dc2626' }}
                    >
                        <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                </Stack>
            )
        }
    ];

    const totalSit = Number(form.sitAnouveau) + Number(form.sitCotisation) + Number(form.sitAutre);
    const totalPaye = Number(form.payeAnouveau) + Number(form.payeCotisation) + Number(form.payeAutre);

    const loadPaiements = async (exerciceId) => {
        if (!exerciceId) return;
        try {
            // Utilisation d'axiosPrivate au lieu de fetch
            const response = await axiosPrivate.get('/api/paiements', {
                params: { exerciceId: exerciceId }
            });

            // Avec Axios, les données sont directement dans response.data
            setRows(response.data);
        } catch (error) {
            console.error("Erreur lors du chargement des paiements:", error);
            // Tu peux ajouter une notification d'erreur ici si nécessaire
        }
    };

    useEffect(() => {
        loadPaiements(selectedEx);
    }, [selectedEx]);

    //sauvegarder un paiement
    const handleSave = async () => {
        // Validation rapide
        if (!form.membreId || !form.exerciceId) {
            alert("Veuillez sélectionner un membre et un exercice.");
            return;
        }

        try {
            // Envoi des données au format attendu par ton contrôleur Sequelize
            await axiosPrivate.post('/api/paiements', {
                membreId: form.membreId,
                exerciceId: form.exerciceId,
                date: form.date,
                payeAnouveau: form.payeAnouveau,
                payeCotisation: form.payeCotisation,
                payeAutre: form.payeAutre,
                mode: form.mode,
                reference: form.reference
            });

            // Succès : on ferme, on reset et on recharge
            setOpenModal(false);
            setForm(initialForm);
            loadPaiements(selectedEx);

            // Optionnel : ajouter un toast de succès ici
        } catch (error) {
            console.error("Erreur lors de l'enregistrement:", error);
            alert("Erreur lors de l'enregistrement du règlement.");
        }
    };

    //récupérer les informations de dettes du membre
    // useEffect(() => {
    //     const fetchSituation = async () => {
    //         if (form.membreId && form.exerciceId) {
    //             try {
    //                 // Remplace par ta route qui calcule la situation actuelle du membre
    //                 const res = await axiosPrivate.get(`/api/membres/${form.membreId}/situation`, {
    //                     params: { exerciceId: form.exerciceId }
    //                 });
    //                 setForm(prev => ({
    //                     ...prev,
    //                     sitAnouveau: res.data.resteAnouveau || 0,
    //                     sitCotisation: res.data.resteCotisation || 0,
    //                     sitAutre: res.data.resteAutre || 0
    //                 }));
    //             } catch (err) {
    //                 console.error("Erreur situation membre");
    //             }
    //         }
    //     };
    //     fetchSituation();
    // }, [form.membreId, form.exerciceId, axiosPrivate]);

    // --- COMPOSANT DE DIALOGUE GÉNÉRIQUE ---
    const ConfirmationDialog = () => (
        <Dialog
            open={confirmDialog.open}
            onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
            PaperProps={{ sx: { borderRadius: '10px', p: 1 } }}
        >
            <DialogTitle sx={{ fontWeight: 800 }}>{confirmDialog.title}</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary">
                    {confirmDialog.message}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ pb: 2, px: 3 }}>
                <Button
                    onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
                    sx={{ color: '#64748b', textTransform: 'none' }}
                >
                    Annuler
                </Button>
                <Button
                    variant="contained"
                    color={confirmDialog.color}
                    onClick={() => {
                        confirmDialog.onConfirm();
                        setConfirmDialog({ ...confirmDialog, open: false });
                    }}
                    sx={{ textTransform: 'none', borderRadius: '6px', px: 3 }}
                >
                    Confirmer
                </Button>
            </DialogActions>
        </Dialog>
    );

    const handleValidate = (id) => {
        setConfirmDialog({
            open: true,
            title: "Validation du règlement",
            message: "Êtes-vous sûr de vouloir valider ce paiement ? Cette action confirmera l'encaissement.",
            color: "success",
            onConfirm: async () => {
                try {
                    await axiosPrivate.put(`/api/paiements/${id}/validate`);
                    toast.success("Règlement validé avec succès !");
                    loadPaiements(selectedEx);
                } catch (err) { console.error("Erreur validation"); }
            }
        });
    };

    const handleDelete = (id) => {
        setConfirmDialog({
            open: true,
            title: "Suppression définitive",
            message: "Attention : cette action est irréversible. Voulez-vous vraiment supprimer ce règlement ?",
            color: "error",
            onConfirm: async () => {
                try {
                    await axiosPrivate.delete(`/api/paiements/${id}`);
                    toast.success("Règlement supprimé.");
                    loadPaiements(selectedEx);
                } catch (err) { console.error("Erreur suppression"); }
            }
        });
    };

    const totalAnouveau = rows.reduce((sum, row) => sum + (Number(row.anouveau) || 0), 0);
    const totalCotisation = rows.reduce((sum, row) => sum + (Number(row.cotisation) || 0), 0);
    const totalAutre = rows.reduce((sum, row) => sum + (Number(row.autre) || 0), 0);
    const grandTotal = totalAnouveau + totalCotisation + totalAutre;

    // const CustomFooter = () => (
    //     <Box sx={{ display: 'flex', flexDirection: 'column' }}>
    //         {/* Ligne des Totaux */}
    //         <Box sx={{
    //             display: 'flex', p: 1, bgcolor: '#cce4da',
    //             borderTop: '1px solid #e2e8f0', fontWeight: 800, fontSize: '0.95rem'
    //         }}>
    //             <Typography variant="caption" sx={{ fontSize: '0.95rem', fontWeight: 800, flex: 1, ml: 2, color: '#64748b' }}>
    //                 TOTAL {rows.length > 0 ? `(${rows.length} lignes)` : ''}
    //             </Typography>

    //             <Stack direction="row" spacing={0} sx={{ textAlign: 'right', mr: '235px' }}>
    //                 {/* mr: 100px correspond à la largeur de ta colonne Actions pour rester aligné */}
    //                 <Box sx={{ width: 180 }}>{totalAnouveau.toLocaleString('fr-FR')} Ar</Box>
    //                 <Box sx={{ width: 180 }}>{totalCotisation.toLocaleString('fr-FR')} Ar</Box>
    //                 <Box sx={{ width: 180 }}>{totalAutre.toLocaleString('fr-FR')} Ar</Box>
    //                 <Box sx={{ width: 180, color: '#1b4332' }}>{grandTotal.toLocaleString('fr-FR')} Ar</Box>
    //             </Stack>
    //         </Box>

    //         <Divider />

    //         {/* Pagination Native */}
    //         <GridPagination />
    //     </Box>
    // );

    //formatage date exercice
    const getFullExerciceLabel = () => {
        const ex = exercices.find(e => e.id === selectedEx);
        if (!ex) return "";

        const start = new Date(ex.date_debut).toLocaleDateString('fr-FR');
        const end = new Date(ex.date_fin).toLocaleDateString('fr-FR');

        return `${start} au ${end}`;
    };

    //export Excel
    const handleExportExcel = () => {
        const currentRows = rows;
        const periode = getFullExerciceLabel();

        // --- CONFIGURATION DES STYLES ---
        const styleHeader = {
            fill: { fgColor: { rgb: "1B4332" } }, // Vert foncé OECFM
            font: { color: { rgb: "FFFFFF" }, bold: true, sz: 10 },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } }
            }
        };

        const styleFooter = {
            fill: { fgColor: { rgb: "DCFCE7" } }, // Vert clair
            font: { bold: true, color: { rgb: "1B4332" } },
            alignment: { horizontal: "right" }
        };

        // Style numérique avec séparateur de milliers (Espace pour la localisation FR/MG)
        const styleCellNum = {
            numFmt: "#,##0",
            alignment: { horizontal: "right" },
            font: { sz: 10 }
        };

        const styleCellDate = {
            numFmt: "dd/mm/yyyy",
            alignment: { horizontal: "center" }, // Souvent centré pour les dates
            font: { sz: 10 }
        };

        const styleText = { font: { sz: 10 } };

        // --- CONSTRUCTION DES DONNÉES ---
        const wsData = [
            [{ v: "OECFM", s: { font: { bold: true, sz: 14, color: { rgb: "1B4332" } } } }],
            [{ v: "Ordre des Experts Comptables et Financiers de Madagascar", s: { font: { italic: true, sz: 10 } } }],
            [""],
            [{ v: "TABLEAU DES PAIEMENTS DE COTISATIONS", s: { font: { bold: true, sz: 12 } } }],
            [`Période : ${periode}`],
            [""],
        ];

        // Entête du tableau avec TOUTES les colonnes
        const headerCols = [
            { v: "Edition", s: styleHeader },
            { v: "Date paiement", s: styleHeader },
            { v: "Matricule", s: styleHeader },
            { v: "Nom & Prénoms", s: styleHeader },
            { v: "Détails paiement / référence", s: styleHeader },
            { v: "Pai. anouveaux", s: styleHeader },
            { v: "Pai. cotis année", s: styleHeader },
            { v: "Pai. autre appel", s: styleHeader },
            { v: "Total payé", s: styleHeader },
            { v: "Validé", s: styleHeader },
        ];
        wsData.push(headerCols);

        // Lignes de données
        currentRows.forEach(row => {
            const rowLine = [
                { v: new Date(row.created_at).toLocaleDateString('fr-FR'), s: styleCellDate },
                { v: new Date(row.date).toLocaleDateString('fr-FR'), s: styleCellDate },
                { v: row.matricule, s: styleText },
                { v: `${row.nom} ${row.prenom}`, s: styleText },
                { v: row.reference, s: styleText },
                { v: parseFloat(row.anouveau) || 0, s: styleCellNum },
                { v: parseFloat(row.cotisation) || 0, s: styleCellNum },
                { v: parseFloat(row.autre) || 0, s: styleCellNum },
                { v: parseFloat(row.total) || 0, s: styleCellNum },
                { v: row.valide === true ? "Validé" : "Non validé", s: styleText },
            ];

            wsData.push(rowLine);
        });

        // --- LIGNE DE TOTAL (FOOTER) ---
        const totalAnouveau = currentRows.reduce((sum, r) => sum + parseFloat(r.anouveau || 0), 0);
        const totalCotisation = currentRows.reduce((sum, r) => sum + parseFloat(r.cotisation || 0), 0);
        const totalAutre = currentRows.reduce((sum, r) => sum + parseFloat(r.autre || 0), 0);
        const total = currentRows.reduce((sum, r) => sum + parseFloat(r.total || 0), 0);

        // On aligne le "TOTAL GÉNÉRAL" sous la colonne Statut
        const footerRow = [
            { v: "", s: styleFooter }, { v: "", s: styleFooter }, { v: "", s: styleFooter },
            { v: "", s: styleFooter },
            { v: "TOTAL GÉNÉRAL", s: styleFooter },
            { v: totalAnouveau, s: { ...styleFooter, ...styleCellNum } },
            { v: totalCotisation, s: { ...styleFooter, ...styleCellNum } },
            { v: totalAutre, s: { ...styleFooter, ...styleCellNum } },
            { v: total, s: { ...styleFooter, ...styleCellNum } }
        ];

        wsData.push(footerRow);

        // --- GÉNÉRATION DU FICHIER ---
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Largeur des colonnes adaptée
        ws['!cols'] = [
            { wch: 10 }, { wch: 35 }, { wch: 12 }, { wch: 12 },
            { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 18 },
            { wch: 18 }, { wch: 18 }
        ];

        // Fusions pour l'en-tête institutionnel
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "paiement");
        XLSX.writeFile(wb, `OECFM_Export_paiement.xlsx`);
    };

    const fNum = (val) => {
        if (val === undefined || val === null) return "0";

        // 1. On convertit en entier pour enlever les virgules si besoin
        // 2. On utilise une regex pour ajouter un espace tous les 3 chiffres
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };

    //export PDF du ticket de caisse
    // const TicketCaissePDF = ({ row, exercice }) => {
    //     const data = Array.isArray(orderInfo) ? orderInfo[0] : orderInfo;
    //     const url = URL;

    //     // On utilise l'accession sécurisée
    //     const nom_tresorier = data?.noms_signataires?.["Trésorier"] || "Nom inconnu";
    //     const nom_vice_president_admin = data?.noms_signataires?.["Vice-Président Administratif"] || "Nom inconnu";
    //     const nom_caissier = data?.noms_signataires?.["Caissier"] || "Nom inconnu";

    //     // Fonction pour extraire "AAAA - AAAA"
    //     const formatExercice = () => {
    //         const ex = exercice.find(e => e.id === selectedEx);
    //         if (!ex) return "";
    //         const start = new Date(ex.date_debut).getFullYear();
    //         const end = new Date(ex.date_fin).getFullYear();
    //         return `${start} - ${end}`;
    //     }

    //     const nombreEnLettres = (valeurEntrante) => {
    //         const nb = Math.abs(parseInt(valeurEntrante, 10));

    //         const unites = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
    //         const dizaines = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];

    //         if (isNaN(nb)) return "";
    //         if (nb === 0) return "zéro";

    //         const conv = (n) => {
    //             if (n < 10) return unites[n];

    //             if (n < 20) {
    //                 const exceptions = { 10: "dix", 11: "onze", 12: "douze", 13: "treize", 14: "quatorze", 15: "quinze", 16: "seize" };
    //                 return exceptions[n] || "dix-" + unites[n - 10];
    //             }

    //             if (n < 100) {
    //                 const d = Math.floor(n / 10);
    //                 const r = n % 10;
    //                 if (d === 7) return "soixante-" + (r === 1 ? "et-onze" : conv(10 + r));
    //                 if (d === 9) return "quatre-vingt-" + conv(10 + r);
    //                 const liaison = (r === 1 && d < 8) ? " et " : "-";
    //                 return dizaines[d] + (r === 0 ? "" : liaison + unites[r]);
    //             }

    //             if (n < 1000) {
    //                 const c = Math.floor(n / 100);
    //                 const r = n % 100;
    //                 const centStr = c === 1 ? "cent" : unites[c] + " cent";
    //                 return (centStr + " " + conv(r)).trim();
    //             }

    //             if (n < 1000000) {
    //                 const m = Math.floor(n / 1000);
    //                 const r = n % 1000;
    //                 const milleStr = m === 1 ? "mille" : conv(m) + " mille";
    //                 return (milleStr + " " + conv(r)).trim();
    //             }

    //             // NOUVEAU : Gestion des Millions
    //             if (n < 1000000000) {
    //                 const mil = Math.floor(n / 1000000);
    //                 const r = n % 1000000;
    //                 const millionStr = mil === 1 ? "un million" : conv(mil) + " millions";
    //                 return (millionStr + " " + conv(r)).trim();
    //             }

    //             // NOUVEAU : Gestion des Milliards
    //             if (n < 1000000000000) {
    //                 const mrd = Math.floor(n / 1000000000);
    //                 const r = n % 1000000000;
    //                 const milliardStr = mrd === 1 ? "un milliard" : conv(mrd) + " milliards";
    //                 return (milliardStr + " " + conv(r)).trim();
    //             }

    //             return n.toString();
    //         };

    //         return conv(nb).trim().toLowerCase().replace(/\s+/g, ' ');
    //     };

    //     return (
    //         <Document>
    //             <Page size="A4" style={{ padding: 40, fontSize: 10, fontFamily: 'Helvetica' }}>
    //                 {/* Header avec Logo (Placeholder) */}
    //                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
    //                     {/* LOGO à gauche */}
    //                     <View style={{ width: 100, height: 100, backgroundColor: 'transparent', borderRadius: 30 }} >
    //                         <Image
    //                             style={{ width: 100, height: 100, marginRight: 10, objectFit: 'contain' }}
    //                             src="/logo500.png" // Assure-toi que le nom du fichier est exact
    //                         />
    //                     </View>

    //                     {/* BLOC TEXTE à droite */}
    //                     <View style={{ marginLeft: 0, marginBottom: 0 }}>
    //                         <View style={{
    //                             flex: 1,               // Prend tout l'espace restant pour permettre l'alignement
    //                             alignItems: 'flex-end' // Aligne le conteneur lui-même vers la droite
    //                         }}>
    //                             <Text style={{ fontSize: 8, textAlign: 'right' }}>
    //                                 Régie par l'Ordonnance modifiée n°92-047 du 05/11/1992
    //                             </Text>
    //                             <Text style={{ fontSize: 8, textAlign: 'right' }}>
    //                                 {data.adresse}
    //                             </Text>
    //                             <Text style={{ fontSize: 8, textAlign: 'right' }}>
    //                                 8737 - ({data.boite_postale}) ANTANANARIVO - Tel : {data.telephone} - E-mail :{" "}
    //                                 <Text style={{ color: "blue", textDecorationLine: "underline" }}>
    //                                     {data.email}
    //                                 </Text>
    //                             </Text>
    //                         </View>

    //                         <View style={{ marginLeft: 0, marginBottom: 0 }}>
    //                             {/* Première ligne */}
    //                             <Text style={{ fontSize: 8 }}>
    //                                 <Text style={{ textDecoration: 'underline' }}>Membre de :</Text>
    //                                 {" "} - L'international Federation of Accountants (IFAC)
    //                             </Text>

    //                             <View style={{ marginLeft: 50, marginBottom: 10 }}>
    //                                 {/* Deuxième ligne décalée vers le bas avec un petit marginTop */}
    //                                 <Text style={{ fontSize: 8, marginTop: 4 }}>
    //                                     - Pan African Federation of Accountants (PAFA)
    //                                 </Text>
    //                                 <Text style={{ fontSize: 8, marginTop: 4 }}>
    //                                     - La Fédération Internationale Des Experts comptables Francophones (FIDEF)
    //                                 </Text>
    //                             </View>
    //                         </View>
    //                     </View>
    //                 </View>

    //                 <View style={{
    //                     borderBottomColor: '#e2e8f0', // Couleur grise légère (style Pennylane)
    //                     borderBottomWidth: 1,         // Épaisseur du trait
    //                     marginTop: 10,                // Espace au-dessus
    //                     marginBottom: 0,             // Espace en-dessous
    //                     marginLeft: 20,              // Pour l'aligner avec vos textes décalés
    //                     marginRight: 20               // Pour ne pas qu'il touche le bord droit
    //                 }} />

    //                 <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginVertical: 20, textDecoration: 'none' }}>
    //                     Ticket de caisse {row.valide ? "" : "(Non validé)"}
    //                 </Text>

    //                 <View style={{ marginBottom: 20, lineHeight: 1 }}>
    //                     <Text>Date d'édition : {new Date(row.created_at).toLocaleDateString('fr-FR')}</Text>
    //                     <Text>Date de paiement : {new Date(row.date).toLocaleDateString('fr-FR')}</Text>
    //                     <Text>Exercice : {formatExercice(exercice)}</Text>
    //                     <Text>Référence : {row.num_ticket}</Text>
    //                     <Text>Nom : {row.nom}</Text>
    //                     <Text>Prénom (s) : {row.prenom}</Text>
    //                 </View>

    //                 {/* Tableau des règlements */}
    //                 <View style={{ border: '1pt solid #000' }}>
    //                     <View style={{ flexDirection: 'row', backgroundColor: '#f0fdf4', fontWeight: 'bold', borderBottom: '1pt solid #000', padding: 5 }}>
    //                         <Text style={{ flex: 2 }}>Détail du règlement</Text>
    //                         <Text style={{ flex: 1, textAlign: 'right' }}>Paiement</Text>
    //                     </View>
    //                     {[
    //                         { label: "Sur solde A nouveau", val: row.anouveau ? row.anouveau : 0 },
    //                         { label: `Sur cotisation de l'exercice ${formatExercice(exercice)}`, val: row.cotis_annee ? row.cotis_annee : 0 },
    //                         { label: `Sur autre appel ${formatExercice(exercice)}`, val: row.autre_appel ? row.autre_appel : 0 }
    //                     ].map((item, i) => (
    //                         <View key={i} style={{ flexDirection: 'row', borderBottom: '0.5pt solid #eee', padding: 5 }}>
    //                             <Text style={{ flex: 2 }}>{item.label}</Text>
    //                             <Text style={{ flex: 1, textAlign: 'right' }}>{fNum(item.val)} Ar</Text>
    //                         </View>
    //                     ))}
    //                     <View style={{ flexDirection: 'row', padding: 5, fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
    //                         <Text style={{ flex: 2 }}>Total payé</Text>
    //                         <Text style={{ flex: 1, textAlign: 'right' }}>{fNum(row.total)} Ar</Text>
    //                     </View>
    //                 </View>

    //                 <Text style={{ marginTop: 20, fontStyle: 'italic' }}>
    //                     Arrêté à la somme de : {nombreEnLettres(row.total)} Ariary
    //                 </Text>

    //                 {/* Signatures */}
    //                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 50 }}>
    //                     <View style={{ width: 220, flexDirection: 'column', justifyContent: 'space-between', marginTop: 0, alignContent: 'center', alignItems: 'center' }}>
    //                         <Text style={{ textAlign: 'center' }}>Le Vice-Président</Text>
    //                         <Text style={{ textAlign: 'center' }}>Administratif</Text>
    //                         {row.valide &&
    //                             <Image
    //                                 style={{ width: 100, height: 100, objectFit: 'contain' }}
    //                                 src={`${url}/uploads/signatures/${data.sig_vice_president_admin}`}
    //                             />
    //                         }
    //                         <Text style={{ marginTop: row.valide ? 0 : 50, textAlign: 'center' }}>{nom_vice_president_admin}</Text>
    //                     </View>

    //                     <View style={{ width: 220, flexDirection: 'column', justifyContent: 'space-between', marginTop: 0, alignContent: 'center', alignItems: 'center' }}>
    //                         <Text style={{ textAlign: 'center' }}>Le Trésorier</Text>
    //                         {row.valide &&
    //                             <Image
    //                                 style={{ width: 100, height: 100, objectFit: 'contain' }}
    //                                 src={`${url}/uploads/signatures/${data.sig_tresorier}`}
    //                             />
    //                         }
    //                         <Text style={{ marginTop: row.valide ? 0 : 50, textAlign: 'center' }}>{nom_tresorier}</Text>
    //                     </View>

    //                     <View style={{ width: 220, flexDirection: 'column', justifyContent: 'space-between', marginTop: 0, alignContent: 'center', alignItems: 'center' }}>
    //                         <Text style={{ textAlign: 'center' }}>Le Caissier</Text>
    //                         {row.valide &&
    //                             <Image
    //                                 style={{ width: 100, height: 100, objectFit: 'contain' }}
    //                                 src={`${url}/uploads/signatures/${data.sig_caissier}`}
    //                             />
    //                         }
    //                         <Text style={{ marginTop: row.valide ? 0 : 50, textAlign: 'center' }}>{nom_caissier}</Text>
    //                     </View>

    //                     <Text style={{ width: 220, textAlign: 'center' }}>Le Remettant</Text>
    //                 </View>
    //             </Page>
    //         </Document>
    //     );
    // }

    const totalAnouveauPage = rows.reduce((sum, r) => sum + (Number(r.anouveau) || 0), 0);
    const totalCotisationPage = rows.reduce((sum, r) => sum + (Number(r.cotis_annee) || 0), 0);
    const totalAutrePage = rows.reduce((sum, r) => sum + (Number(r.autre_appel) || 0), 0);
    const totalGeneral = rows.reduce((sum, r) => sum + (Number(r.total) || 0), 0);

    //export tableau Appel vers pdf
    const handlePrintPaiementTable = async (rows, exerciceLabel) => {
        try {
            setLoading(true);
            const doc = (
                <PaiementTableauPDF
                    data={rows}
                    exerciceLabel={exerciceLabel}
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

    const handlePrintCaisse = async (row, exercices, orderInfo, selectedEx) => {
        try {
            setLoading(true);

            // QR code → redirige simplement vers le site de l'ordre
            const qrTarget = import.meta.env.VITE_PUBLIC_SITE_URL || 'https://www.oecfm.mg';
            const qrDataUrl = await QRCode.toDataURL(qrTarget, { margin: 1, width: 240 });

            const doc = (
                <TicketCaissePDF
                    row={row}
                    exercice={exercices}
                    selectedEx={selectedEx}
                    orderInfo={orderInfo}
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

    const CustomFooter = () => {
        const apiRef = useGridApiContext();

        // 1. On récupère l'état du filtrage directement
        const filterLookup = apiRef.current.state.filter.filteredRowsLookup;

        // 2. On récupère tous les IDs
        const allIds = apiRef.current.getAllRowIds();

        // 3. On ne garde que ceux qui sont à 'true' dans le lookup (ceux qui passent le filtre)
        // Si le lookup n'existe pas encore, on prend tout par défaut
        const visibleIds = filterLookup
            ? allIds.filter((id) => filterLookup[id] !== false)
            : allIds;

        // 4. On récupère les lignes pour le calcul
        const visibleRows = visibleIds.map((id) => apiRef.current.getRow(id));

        // Calculs
        const totalAnouveau = visibleRows.reduce((sum, row) => sum + (Number(row?.anouveau) || 0), 0);
        const totalCotis_annee = visibleRows.reduce((sum, row) => sum + (Number(row?.cotis_annee) || 0), 0);
        const totalAutre_appel = visibleRows.reduce((sum, row) => sum + (Number(row?.autre_appel) || 0), 0);
        const total = visibleRows.reduce((sum, row) => sum + (Number(row?.total) || 0), 0);

        const fNum = (val) => new Intl.NumberFormat('fr-FR').format(val);

        return (
            <GridFooterContainer sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafb' }}>
                <Box sx={{ display: 'flex', gap: 3, ml: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1b4332' }}>
                        TOTAL FILTRÉ :
                    </Typography>
                    <Typography variant="caption">
                        Anouveaux: <strong>{fNum(totalAnouveau)} Ar</strong>
                    </Typography>
                    <Typography variant="caption">
                        Cotisation de l'année: <strong>{fNum(totalCotis_annee)} Ar</strong>
                    </Typography>
                    <Typography variant="caption">
                        Autres appels: <strong>{fNum(totalAutre_appel)} Ar</strong>
                    </Typography>
                    <Typography variant="caption">
                        Total: <strong>{fNum(total)} Ar</strong>
                    </Typography>
                </Box>
                <GridFooter />
            </GridFooterContainer>
        );
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f1f5f9', minHeight: '100vh' }}>
            {/* HEADER & FILTRE EXERCICE */}
            <Box sx={{ mb: 3 }}>
                <MyBreadcrumbs currentPath="paiement" />
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>Paiements</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Gestion des paiements de cotisation</Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }} spacing={1}>
                    <Box sx={{ maxWidth: 400 }}>
                        <InputLabel sx={{ mb: 1, fontWeight: 700, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Exercice de référence</InputLabel>
                        <TextField select fullWidth size="small" value={selectedEx} onChange={(e) => setSelectedEx(e.target.value)} sx={{ bgcolor: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } }}>
                            {exercices.map(ex => (
                                <MenuItem key={ex.id} value={ex.id}>
                                    {ex.libelle} : {new Date(ex.date_debut).toLocaleDateString('fr-FR')} - {new Date(ex.date_fin).toLocaleDateString('fr-FR')}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        mb: 3,
                        p: 2,
                        bgcolor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
                    }}>
                        {/* DROITE : Les 4 Totaux */}
                        <Stack direction="row" spacing={4} sx={{ mb: 0.5 }}>
                            {[
                                { label: 'À-NOUVEAU', val: totalAnouveauPage, color: '#64748b' },
                                { label: 'COTIS. ANNÉE', val: totalCotisationPage, color: '#64748b' },
                                { label: 'AUTRES APPELS', val: totalAutrePage, color: '#64748b' },
                                { label: 'TOTAL GÉNÉRAL', val: totalGeneral, color: '#2563EB' }
                            ].map((item, index) => (
                                <Box key={index} sx={{ textAlign: 'right', minWidth: '120px' }}>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontWeight: 800,
                                            color: '#94a3b8',
                                            display: 'block',
                                            letterSpacing: '0.5px',
                                            fontSize: '0.7rem'
                                        }}
                                    >
                                        {item.label}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            fontWeight: 900,
                                            fontSize: '1.15rem',
                                            color: item.color,
                                            lineHeight: 1.2
                                        }}
                                    >
                                        {fNum(item.val)}
                                        <span style={{ fontSize: '0.7rem', marginLeft: '4px', fontWeight: 600 }}>Ar</span>
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Box>

                    <Box sx={{ flex: 1 }}></Box>

                    <Button
                        variant="contained"
                        startIcon={<AddCardIcon />}
                        onClick={() => { setForm({ ...initialForm, exerciceId: selectedEx }); setOpenModal(true); }}
                        sx={{ bgcolor: '#1b4332', '&:hover': { bgcolor: '#143225' }, textTransform: 'none', borderRadius: '6px' }}
                    >
                        Enregistrer un règlement
                    </Button>

                    {showComponent &&
                        <Button
                            disabled={!showComponent}
                            startIcon={<EmailIcon />}
                            onClick={() => handleOpenEmail()}
                            variant="outlined"
                            sx={{ ml: 1 }}
                        >
                            Email groupé
                        </Button>
                    }

                    <Button
                        variant="outlined"
                        startIcon={<SaveIcon />}
                        onClick={handleExportExcel}
                        sx={{ ml: 1, color: '#1d6f42', borderColor: '#1d6f42' }}
                    >
                        Télécharger Excel
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={loading ? <CircularProgress size={16} /> : <LocalPrintshopOutlined />}
                        onClick={() => handlePrintPaiementTable(rows, getFullExerciceLabel())}
                        sx={{ ml: 1, color: '#b91c1c', borderColor: '#b91c1c' }}
                    >
                        Télécharger PDF
                    </Button>

                </Stack>
            </Box>

            {/* TABLEAU DATAGRID */}
            <Box sx={{
                height: 550, // Augmenté pour éviter le scroll vertical interne au Paper
                width: '100%',
                bgcolor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden', // On garde hidden ici pour le border-radius
            }}>
                <DataGrid
                    rowHeight={38}
                    rows={rows}
                    columns={columns}
                    // ... tes autres props
                    slots={{ toolbar: GridToolbar, footer: CustomFooter }}
                    slotProps={{
                        toolbar: {
                            showQuickFilter: true, // Affiche le champ de recherche
                            quickFilterProps: { debounceMs: 500 }, // Optionnel : attend 500ms avant de filtrer
                        },
                    }}
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
                        '& .font-bold-green': { color: '#1b4332', fontWeight: 'bold' },
                        // Force l'affichage de la barre de défilement si nécessaire
                        '& .MuiDataGrid-mainX': { overflow: 'auto' },
                    }}
                />
            </Box>

            {/* MODAL PAIEMENT */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 3 }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>NOUVEAU RÈGLEMENT</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>Saisissez les détails du paiement reçu</Typography>
                    </Box>
                    <IconButton onClick={() => setOpenModal(false)}><CloseIcon /></IconButton>
                </DialogTitle>

                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 0 }}>

                        {/* DATE ET EXERCICE */}
                        <Grid container spacing={2} >
                            <Grid item xs={7} sx={{ ml: -2 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: '#475569' }}>DATE DU PAIEMENT</Typography>
                                <TextField type="date" fullWidth size="small" sx={{ width: 180 }}
                                    value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                            </Grid>

                            <Grid item xs={6} sx={{ ml: -2 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: '#475569' }}>EXERCICE</Typography>

                                <TextField
                                    disabled={true}
                                    select
                                    fullWidth
                                    size="small"
                                    value={form.exerciceId}
                                    onChange={(e) => setForm({ ...form, exerciceId: e.target.value })}
                                    sx={{ width: 400, bgcolor: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } }}
                                >
                                    {exercices.map((ex) => (
                                        /* Utilise ex.id pour la key et la value */
                                        <MenuItem key={ex.id} value={ex.id}>
                                            {ex.libelle} : {new Date(ex.date_debut).toLocaleDateString('fr-FR')} - {new Date(ex.date_fin).toLocaleDateString('fr-FR')}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        </Grid>

                        {/* MEMBRE */}
                        <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: '#475569' }}>NOM ET PRÉNOM (S)</Typography>
                            <Autocomplete
                                options={membres}
                                getOptionLabel={(o) => `${o.nom} ${o.prenom}`}
                                value={membres.find(m => m.id === form.membreId) || null}
                                onChange={(e, nv) => setForm({ ...form, membreId: nv ? nv.id : null })}
                                renderInput={(params) => <TextField {...params} size="small" placeholder="Rechercher..." />}
                            />
                        </Box>

                        {/* ZONE FINANCIÈRE */}
                        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <Grid container sx={{ mb: 1, px: 1 }}>
                                <Grid item xs={6}><Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>LIBELLÉ</Typography></Grid>
                                <Grid item xs={3} align="right"><Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>DÛ</Typography></Grid>
                                <Grid item xs={3} align="right"><Typography variant="caption" sx={{ fontWeight: 700, color: '#1b4332' }}>VERSÉ</Typography></Grid>
                            </Grid>

                            {[
                                { label: 'A-NOUVEAU', s: 'sitAnouveau', p: 'payeAnouveau' },
                                { label: 'COTISATION DE L\'ANNÉE', s: 'sitCotisation', p: 'payeCotisation' },
                                { label: 'AUTRES APPELS', s: 'sitAutre', p: 'payeAutre' }
                            ].map((item) => (
                                <Grid container spacing={1} key={item.label} alignItems="center" sx={{ mb: 1.5, px: 1 }}>
                                    <Grid item xs={6}><Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{item.label}</Typography></Grid>
                                    <Grid item xs={3} align="right">
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {new Intl.NumberFormat('fr-FR').format(form[item.s])} Ar
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={3}>
                                        <NumericFormat
                                            customInput={TextField}
                                            variant="standard"
                                            fullWidth
                                            thousandSeparator=" "
                                            suffix=" Ar"
                                            value={form[item.p]}
                                            onValueChange={(values) => setForm({ ...form, [item.p]: values.floatValue || 0 })}
                                            inputProps={{ style: { textAlign: 'right', fontWeight: 800, color: '#1b4332' } }}
                                        />
                                    </Grid>
                                </Grid>
                            ))}

                            <Divider sx={{ my: 1 }} />

                            <Grid container sx={{ px: 1 }}>
                                <Grid item xs={6}><Typography variant="subtitle2" sx={{ fontWeight: 800 }}>TOTAL</Typography></Grid>
                                <Grid item xs={3} align="right"><Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{new Intl.NumberFormat('fr-FR').format(totalSit)} Ar</Typography></Grid>
                                <Grid item xs={3} align="right"><Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1b4332' }}>{new Intl.NumberFormat('fr-FR').format(totalPaye)} Ar</Typography></Grid>
                            </Grid>
                        </Box>

                        {/* MODE DE RÈGLEMENT */}
                        <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: '#475569' }}>MODE DE RÈGLEMENT</Typography>
                            <TextField select fullWidth size="small" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                                <MenuItem value="Espèce">ESPÈCE</MenuItem>
                                <MenuItem value="Virement">VIREMENT</MenuItem>
                                <MenuItem value="Chèque">CHÈQUE</MenuItem>
                                <MenuItem value="M-Vola">MOBILE MONEY</MenuItem>
                            </TextField>
                        </Box>

                        {/* DÉTAILS PAIEMENT (PLEINE LARGEUR) */}
                        <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: '#475569' }}>DÉTAILS PAIEMENT / RÉFÉRENCE</Typography>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Renseigner les détails du paiement ici"
                                value={form.reference}
                                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                            />
                        </Box>

                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9' }}>
                    <Button onClick={() => setOpenModal(false)} startIcon={<CancelIcon />} sx={{ color: '#64748b', textTransform: 'none' }}>ANNULER</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}
                        sx={{ bgcolor: '#1b4332', '&:hover': { bgcolor: '#143225' }, textTransform: 'none', px: 4, borderRadius: '6px' }}>
                        ENREGISTRER
                    </Button>
                </DialogActions>
            </Dialog>

            {/* POPUP D'ENVOI DE MAIL */}
            <SendEmailModal
                open={emailModalOpen}
                handleClose={() => setEmailModalOpen(false)}
                membres={rows}
                initialMember={currentMember}
                onSend={() => handleSendMail('all')}
            />

            {/* --- Fenêtre de confirmation individuelle --- */}
            <ConfirmSingleModal
                open={singleModalOpen}
                handleClose={() => setSingleModalOpen(false)}
                onConfirm={handleConfirmSingle}
                loading={isSending} // Si tu as un état de chargement, sinon mets false
                name={selectedRow ? `${selectedRow.nom} ${selectedRow.prenom}` : ""}
            />

            {/* POPUP HISTORIQUE D'ENVOI EMAIL */}
            <Dialog
                open={historyModalOpen}
                onClose={() => setHistoryModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '8px' } }}
            >
                <DialogTitle sx={{ bgcolor: '#0F172A', color: 'white', py: 1.5 }}>
                    <Typography variant="subtitle1" fontWeight="600">
                        Historique des envois : {historyTarget}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    {selectedHistory.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#F8FAFC', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '12px' }}>Date & Heure</th>
                                    <th style={{ padding: '12px' }}>Destinataire</th>
                                    <th style={{ padding: '12px' }}>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedHistory.map((log, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '10px 12px' }}>
                                            {new Date(log.date_envoi).toLocaleString('fr-FR')}
                                        </td>
                                        <td style={{ padding: '10px 12px' }}>{log.email_dest}</td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <Chip
                                                label={log.statut}
                                                size="small"
                                                sx={{
                                                    height: '20px', fontSize: '0.7rem',
                                                    bgcolor: log.statut === 'Succès' ? '#DCFCE7' : '#FEE2E2',
                                                    color: log.statut === 'Succès' ? '#166534' : '#991B1B'
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                            <Typography variant="body2">Aucun mail envoyé pour ce règlement.</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHistoryModalOpen(false)} sx={{ textTransform: 'none', color: '#64748B' }}>
                        Fermer
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmationDialog />
        </Box>
    );
};

export default PaiementPage;
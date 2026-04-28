import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Tabs, Tab,
    Typography, TextField, Autocomplete, Divider, FormControlLabel, Switch, Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import useAxiosPrivate from '../../config/axiosPrivate';
import toast from 'react-hot-toast';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const CreateAccountDialog = ({ open, onClose }) => {
    const axiosPrivate = useAxiosPrivate();
    const [tabValue, setTabValue] = useState(0);
    const [isLinkedToMember, setIsLinkedToMember] = useState(true);
    const [members, setMembers] = useState([]); // Liste chargée depuis ton API
    const [bulkRole, setBulkRole] = useState(1);
    const [roles, setRoles] = useState([]);
    const [existingUsers, setExistingUsers] = useState({});
    const [loading, setLoading] = useState(false);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const [selectedRowIds, setSelectedRowIds] = useState([]);

    const [form, setForm] = useState({
        username: '',
        member: null,
        email: '',
        role: 1
    });

    useEffect(() => {
        const fetchDataInit = async () => {
            try {
                const [resM, rolesD, usersD] = await Promise.all([
                    axiosPrivate.get('/api/membres/activeLastUpdate'),
                    axiosPrivate.get('/api/roles'),
                    axiosPrivate.get('/api/users'),
                ]);

                setMembers(resM.data);
                setRoles(rolesD.data);
                setExistingUsers(usersD.data);

                const InitRole = rolesD.data;
                setForm({ ...form, role: InitRole[0].id });
            } catch (err) { toast.error("Erreur chargement données"); }
        };
        fetchDataInit();
    }, [axiosPrivate]);

    // Liste des rôles pour le menu
    // const roles = [
    //     { value: 'utilisateur', label: 'Utilisateur', desc: 'Accès standard aux modules' },
    //     { value: 'lector', label: 'Lector', desc: 'Lecture seule (consultation)' },
    //     { value: 'administrateur', label: 'Administrateur', desc: 'Gestion des données et exports' },
    //     { value: 'superAdministrateur', label: 'Super Administrateur', desc: 'Contrôle total du système' }
    // ];

    // Validation d'email simple
    const isEmailValid = (email) => /\S+@\S+\.\S+/.test(email);

    // Colonnes du DataGrid avec la nouvelle colonne "Statut Envoi"
    const columns = [
        { field: 'matricule', headerName: 'Mat', width: 80 },
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
        { field: 'email_oecfm', headerName: 'Email OECFM', flex: 1 },
        {
            field: 'status_envoi',
            headerName: 'Ctrl Envoi',
            width: 130,
            renderCell: (params) => (
                params.value === 'success' ?
                    <Chip icon={<CheckCircleIcon />} label="Envoyé" color="success" size="small" variant="outlined" /> :
                    <Chip icon={<ErrorIcon />} label="En attente" color="default" size="small" variant="outlined" />
            )
        },
    ];

    const editColumns = [
        { field: 'matricule', headerName: 'Mat', width: 80 },
        {
            field: 'username',
            headerName: 'Utilisateur',
            flex: 1,
        },
        { field: 'email', headerName: 'Email', flex: 1 },
        {
            field: 'role_id',
            headerName: 'Rôle',
            width: 180,
            renderCell: (params) => (
                <TextField
                    select
                    fullWidth
                    size="small"
                    value={params.value}
                    onChange={(e) => handleRoleUpdate(params.row.id, e.target.value)}
                    SelectProps={{ native: true }}
                    sx={{ mt: 0.5, bgcolor: 'transparent' }}
                >
                    {roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.nom}</option>
                    ))}
                </TextField>
            )
        },
        {
            field: 'actions',
            headerName: '',
            width: 80,
            sortable: false,
            renderCell: (params) => (
                <Button
                    color="error"
                    onClick={() => {
                        setUserToDelete(params.row);
                        setDeleteDialogOpen(true);
                    }}
                >
                    <DeleteOutlineIcon fontSize="small" />
                </Button>
            )
        }
    ];

    const handleRoleUpdate = async (userId, newRole) => {
        try {
            // Appel API pour mettre à jour uniquement le rôle
            await axiosPrivate.put(`/api/users/${userId}/role`, { role: newRole });

            // Optionnel : rafraîchir localement l'état pour que l'UI soit à jour
            setExistingUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, role_id: newRole } : user
            ));

            // Tu peux ajouter un petit feedback visuel ici
            toast.success(`Rôle mis à jour pour l'utilisateur ${userId}`);
        } catch (error) {
            console.error("Erreur lors du changement de rôle", error);
        }
    };

    //création d'un nouveau compte
    const handleSave = async () => {
        // Validation : On exige soit un membre, soit un username
        if (!form.username && !isLinkedToMember) {
            alert("Veuillez saisir un nom d'utilisateur.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                email: form.email,
                username: form.username, // La valeur du nouveau champ
                role_id: Number(form.role),
                member_id: isLinkedToMember ? form.member?.id : 0,
                password: "Password123!" // Password par défaut
            };

            const res = await axiosPrivate.post('/api/create-account', payload);

            // ... reste de la logique (onClose, refresh, etc.)
            setLoading(false);

            toast.success(res.data.message);

            // 2. Fermer le modal
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Erreur lors de la création.");
        } finally {
            setLoading(false);
        }
    };

    //supprimer un compte utilisateur
    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;

        setLoading(true);
        try {
            await axiosPrivate.delete(`/api/users/${userToDelete.id}`);

            // Mise à jour locale de l'UI
            setExistingUsers(prev => prev.filter(u => u.id !== userToDelete.id));

            toast.success("Compte supprimé avec succès");
            setDeleteDialogOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Erreur lors de la suppression");
        } finally {
            setLoading(false);
            setUserToDelete(null);
        }
    };

    //création de comptes utilisateurs (membre) en masse
    const handleBulkCreate = async () => {
        setLoading(true);
        try {
            const membersToCreate = members.filter(m => selectedRowIds.includes(m.id));
            const payload = membersToCreate.map(m => ({
                email: m.email_oecfm,
                username: `${m.prenom} ${m.nom}`,
                role_id: Number(bulkRole),
                member_id: m.id,
                password: "Password123!"
            }));

            const res = await axiosPrivate.post('/api/create-accounts-bulk', { users: payload });
            const { summary, details } = res.data;

            if (summary.errorCount > 0) {
                // On affiche un message détaillé
                const errorList = details.errors.map(e => `${e.username} (${e.reason})`).join('\n');
                toast((t) => (
                    <span>
                        <b>{summary.successCount} comptes créés.</b><br />
                        {summary.errorCount} échecs :<br />
                        <small style={{ whiteSpace: 'pre-line' }}>{errorList}</small>
                    </span>
                ), { duration: 6000, icon: '⚠️' });
            } else {
                toast.success(`${summary.successCount} comptes créés avec succès !`);
            }

            // Rafraîchir les données et fermer si tout ou partie a réussi
            if (summary.successCount > 0) {
                // Optionnel : refreshMembers();
                onClose();
            }
        } catch (error) {
            toast.error("Erreur critique lors de l'envoi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>


            <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 800, bgcolor: '#F8FAFC' }}>Gestion des accès</DialogTitle>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, bgcolor: '#F8FAFC' }}>
                    <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                        <Tab label="Individuel" sx={{ textTransform: 'none', fontWeight: 600 }} />
                        <Tab label="Masse" sx={{ textTransform: 'none', fontWeight: 600 }} />
                        <Tab label="Modifier les comptes" sx={{ textTransform: 'none', fontWeight: 600 }} />
                    </Tabs>
                </Box>

                <DialogContent sx={{ minHeight: 420 }}>
                    {/* --- ONGLET 0 : CRÉATION INDIVIDUELLE --- */}
                    {tabValue === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={isLinkedToMember}
                                        onChange={(e) => {
                                            setIsLinkedToMember(e.target.checked);
                                            setForm({ ...form, member: null, email: '' });
                                        }}
                                    />
                                }
                                label={<Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Lier ce compte à un membre ?</Typography>}
                            />

                            <Box sx={{ display: isLinkedToMember ? 'block' : 'none' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Sélectionner le membre</Typography>
                                <Autocomplete
                                    options={members}
                                    getOptionLabel={(opt) => `${opt.matricule} - ${opt.nom} ${opt.prenom}`}
                                    onChange={(e, val) =>
                                        setForm({
                                            ...form,
                                            member: val,
                                            email: val?.email_oecfm || '',
                                            username: val ? `${val.prenom} ${val.nom}` : ''
                                        })}
                                    renderInput={(params) => <TextField {...params} size="small" placeholder="Recherche..." />}
                                />
                            </Box>

                            {/* CHAMP NOM D'UTILISATEUR */}
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Nom d'utilisateur (Pseudo)
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="..."
                                    value={form.username}
                                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                                    error={form.username === '' && !isLinkedToMember} // Optionnel: erreur si vide hors lien membre
                                    helperText={!form.username ? "Le nom d'utilisateur est requis" : ""}
                                />
                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                    Ce nom sera affiché dans l'interface si le compte n'est pas lié à un membre.
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Adresse Email</Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    disabled={isLinkedToMember}
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    error={form.email !== '' && !isEmailValid(form.email)}
                                    helperText={form.email !== '' && !isEmailValid(form.email) ? "Format email invalide" : ""}
                                />
                            </Box>

                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Rôle du compte</Typography>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    SelectProps={{ native: true }}
                                >
                                    {roles.map((option) => (
                                        <option key={option.id} value={option.id}>{option.nom}</option>
                                    ))}
                                </TextField>
                            </Box>
                        </Box>
                    )}

                    {/* --- ONGLET 1 : CRÉATION EN MASSE --- */}
                    {tabValue === 1 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', mt: 2 }}>
                            <Box sx={{ mb: 2, p: 2, bgcolor: '#F1F5F9', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Rôle à attribuer :</Typography>
                                <TextField
                                    select
                                    size="small"
                                    value={bulkRole}
                                    onChange={(e) => setBulkRole(e.target.value)}
                                    sx={{ width: 200, bgcolor: 'white' }}
                                    SelectProps={{ native: true }}
                                >
                                    {roles.map((option) => (
                                        <option key={option.id} value={option.id}>{option.nom}</option>
                                    ))}
                                </TextField>
                            </Box>
                            <Box sx={{ height: 350 }}>
                                <DataGrid
                                    rows={members}
                                    columns={columns}
                                    checkboxSelection
                                    onRowSelectionModelChange={(newSelection) => {
                                        setSelectedRowIds(newSelection);
                                    }}
                                    selectionModel={selectedRowIds}
                                    density="compact"
                                    sx={{ border: 'none' }}
                                />
                            </Box>
                        </Box>
                    )}

                    {/* --- ONGLET 2 : MODIFICATION DES RÔLES (EXISTANTS) --- */}
                    {tabValue === 2 && (
                        <Box sx={{ height: 400, mt: 2 }}>
                            <Typography variant="caption" sx={{ color: '#64748b', mb: 2, display: 'block' }}>
                                Modification directe des rôles pour les utilisateurs actifs.
                            </Typography>
                            <DataGrid
                                rows={existingUsers} // Attention : utilise ici la liste des comptes DÉJÀ CRÉÉS
                                columns={editColumns} // Utilise les colonnes avec le Select intégré
                                density="compact"
                                disableRowSelectionOnClick
                                sx={{ border: 'none' }}
                            />
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC' }}>
                    <Button onClick={onClose} sx={{ textTransform: 'none' }}>Annuler</Button>
                    {(tabValue === 0 || tabValue === 1) && (
                        <Button
                            onClick={tabValue === 0 ? handleSave : handleBulkCreate}
                            variant="contained"
                            disabled={loading || (tabValue === 1 && selectedRowIds.length === 0)}
                            sx={{ bgcolor: '#2e3d2f', borderRadius: 2, px: 3 }}
                        >
                            {loading ? "Chargement..." : (tabValue === 0 ? "Créer l'accès" : `Générer ${selectedRowIds.length} comptes`)}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* POPUP DE CONFIRMATION DE SUPPRESSION */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => !loading && setDeleteDialogOpen(false)}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <Typography>
                        Êtes-vous sûr de vouloir supprimer le compte de <strong>{userToDelete?.username}</strong> ?
                        Cette action est irréversible.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        disabled={loading}
                        sx={{ borderRadius: 2 }}
                    >
                        {loading ? "Suppression..." : "Supprimer définitivement"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CreateAccountDialog;
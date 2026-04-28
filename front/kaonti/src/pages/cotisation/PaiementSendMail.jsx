import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Autocomplete, Box, Typography, 
  CircularProgress, IconButton, 
  DialogContentText
} from '@mui/material';
import { Email as EmailIcon, Close as CloseIcon } from '@mui/icons-material';

const SendEmailModal = ({ open, handleClose, onSend }) => {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        // On n'envoie plus d'objet, juste le signal pour "tous"
        await onSend('all'); 
        setLoading(false);
        handleClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: '4px' } }}>
            <DialogTitle sx={{ color: '#0F172A', fontWeight: 'bold' }}>
                Confirmation d'envoi groupé
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Êtes-vous sûr de vouloir envoyer le ticket par email à <strong>tous les membres</strong> figurant dans la liste ?
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={handleClose} sx={{ color: '#64748B' }}>Annuler</Button>
                <Button 
                    onClick={handleConfirm} 
                    variant="contained" 
                    disabled={loading}
                    sx={{ backgroundColor: '#2563EB', '&:hover': { backgroundColor: '#1D4ED8' } }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Oui, envoyer à tous'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SendEmailModal;
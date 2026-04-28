import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, CircularProgress } from '@mui/material';

const ConfirmSingleModal = ({ open, handleClose, onConfirm, loading, name }) => {
    return (
        <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: '8px' } }}>
            <DialogTitle sx={{ fontWeight: 'bold' }}>Confirmer l'envoi</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Voulez-vous envoyer le ticket par email à <strong>{name}</strong> ?
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={handleClose} color="inherit" disabled={loading}>
                    Annuler
                </Button>
                <Button 
                    onClick={onConfirm} 
                    variant="contained" 
                    disabled={loading}
                    sx={{ backgroundColor: '#2563EB' }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Confirmer"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmSingleModal;
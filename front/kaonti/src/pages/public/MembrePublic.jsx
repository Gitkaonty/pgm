import React from 'react';
import { useParams } from 'react-router-dom';

// Page publique (sans authentification) ouverte au scan du QR code des documents.
// Pour l'instant volontairement vide : on affichera les infos du membre plus tard.
const MembrePublic = () => {
    const { id } = useParams();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Segoe UI, Tahoma, sans-serif',
            color: '#1b4332',
            padding: 24,
            textAlign: 'center'
        }}>
            <h1 style={{ margin: 0, fontWeight: 800 }}>OECFM</h1>
            <p style={{ color: '#64748b', marginTop: 8 }}>Page en construction</p>
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 16 }}>
                Référence scannée : <strong>{id}</strong>
            </p>
        </div>
    );
};

export default MembrePublic;

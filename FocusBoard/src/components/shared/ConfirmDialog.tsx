import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import Box from '@mui/material/Box';

interface ConfirmDialogProps {
    open: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    severity?: 'warning' | 'error' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    message,
    onConfirm,
    onCancel,
    title = 'Confirm Action',
    confirmLabel = 'OK',
    cancelLabel = 'Cancel',
    severity = 'warning',
}) => {
    const iconColor = severity === 'error' ? '#ef4444' : severity === 'info' ? '#3b82f6' : '#f59e0b';

    return (
        <Dialog
            open={open}
            onClose={onCancel}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    backgroundColor: '#1a1a1a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
                },
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <WarningAmberRoundedIcon sx={{ color: iconColor, fontSize: 22 }} />
                    <Typography variant="subtitle1" fontWeight={700} color="white">
                        {title}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary">
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button
                    onClick={onCancel}
                    variant="outlined"
                    color="inherit"
                    fullWidth
                    sx={{ borderColor: 'rgba(255,255,255,0.15)', color: '#a3a3a3', '&:hover': { borderColor: 'rgba(255,255,255,0.3)', color: '#fff' } }}
                >
                    {cancelLabel}
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    fullWidth
                    sx={{ backgroundColor: severity === 'error' ? '#ef4444' : '#3b82f6', '&:hover': { backgroundColor: severity === 'error' ? '#dc2626' : '#2563eb' } }}
                >
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;

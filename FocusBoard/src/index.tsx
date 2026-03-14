import React from 'react';
import ReactDOM from 'react-dom/client';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './index.css';
import App from './App';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        background: { default: '#0a0a0a', paper: '#1a1a1a' },
        primary: { main: '#3b82f6' },
        text: { primary: '#ffffff', secondary: '#a3a3a3' },
        divider: 'rgba(255,255,255,0.08)',
    },
    typography: { fontFamily: 'inherit' },
    components: {
        MuiDataGrid: {
            styleOverrides: {
                root: {
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    backgroundColor: '#111111',
                    '--DataGrid-rowBorderColor': 'rgba(255,255,255,0.05)',
                },
                columnHeaders: { backgroundColor: '#1a1a1a', borderBottom: '1px solid rgba(255,255,255,0.1)' },
                columnHeaderTitle: { color: '#a3a3a3', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
                cell: { borderColor: 'rgba(255,255,255,0.05)', color: '#e5e5e5', fontSize: '0.8125rem' },
                row: {
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' },
                    '&.Mui-selected': { backgroundColor: 'rgba(59,130,246,0.15)', '&:hover': { backgroundColor: 'rgba(59,130,246,0.2)' } },
                },
                footerContainer: { borderTop: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#1a1a1a' },
                toolbarContainer: { backgroundColor: '#1a1a1a', padding: '8px 12px' },
            },
        },
        MuiTextField: {
            defaultProps: { size: 'small', variant: 'outlined' },
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderRadius: 8,
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                        '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                    },
                    '& .MuiInputLabel-root': { color: '#737373' },
                    '& .MuiInputBase-input': { color: '#ffffff' },
                },
            },
        },
        MuiSelect: {
            defaultProps: { size: 'small' },
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderRadius: 8,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                    color: '#ffffff',
                },
            },
        },
        MuiButton: {
            defaultProps: { size: 'small' },
            styleOverrides: { root: { borderRadius: 8, textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem' } },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    color: '#737373',
                    '&.Mui-selected': { color: '#ffffff' },
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: { backgroundColor: '#3b82f6' },
                root: { borderBottom: '1px solid rgba(255,255,255,0.08)' },
            },
        },
        MuiChip: {
            styleOverrides: { root: { borderRadius: 6 } },
        },
    },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <ThemeProvider theme={darkTheme}>
            <CssBaseline enableColorScheme />
            <App />
        </ThemeProvider>
    </React.StrictMode>
);

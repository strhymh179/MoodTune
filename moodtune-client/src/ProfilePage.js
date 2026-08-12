import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    Box, Typography, CircularProgress, Alert, Paper, Grid,
    List, ListItem, ListItemText, Chip, TextField, Button,
    Divider, Avatar, LinearProgress, Card, CardContent, Stack,
    Container, Tabs, Tab
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import StarIcon from '@mui/icons-material/Star';

const API_PROFILE_URL = 'http://localhost:5000/profile';
const API_UPDATE_PROFILE_URL = 'http://localhost:5000/update_profile';
const API_CHANGE_PASSWORD_URL = 'http://localhost:5000/change_password';

const ProfilePage = ({ token, setToken, setView }) => {
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    const [activeTab, setActiveTab] = useState(0);
    const [status, setStatus] = useState({ message: '', severity: 'info' });

    // Account Form States
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    
    // Security Form States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Sync Helper: Always gets the most recent identity token
    const getActiveToken = useCallback(() => {
        return localStorage.getItem('moodtune-token') || token;
    }, [token]);

    const fetchProfile = useCallback((tokenOverride = null) => {
        const activeToken = tokenOverride || getActiveToken();
        if (!activeToken) return;

        setIsLoading(true);
        axios.get(API_PROFILE_URL, {
            headers: { Authorization: `Bearer ${activeToken}` }
        }).then(res => {
            setProfileData(res.data);
            setUsername(res.data.username || '');
            setName(res.data.name || '');
            setEmail(res.data.email || '');
            setErrorMsg(null);
        }).catch((err) => {
            console.error("Load Error:", err);
            setErrorMsg('Failed to load profile. Your session might be out of sync.');
        }).finally(() => setIsLoading(false));
    }, [getActiveToken]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // --- LOGIC: EMOTIONAL ANALYTICS ---
    const stats = useMemo(() => {
        if (!profileData?.history) return { total: 0, breakdown: {}, topMood: 'N/A' };
        const history = profileData.history;
        const total = history.length;
        const counts = {};
        history.forEach(item => {
            counts[item.emotion] = (counts[item.emotion] || 0) + 1;
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        return { total, counts, topMood: sorted.length > 0 ? sorted[0][0] : 'None' };
    }, [profileData]);

    // --- ACTIONS: UPDATES ---
    const handleUpdate = async (e) => {
        e.preventDefault();
        setStatus({ message: 'Syncing identity...', severity: 'info' });
        try {
            const res = await axios.post(API_UPDATE_PROFILE_URL, { username, name, email }, 
                { headers: { Authorization: `Bearer ${getActiveToken()}` } });
            
            if (res.data.token) {
                localStorage.setItem('moodtune-token', res.data.token);
                if (setToken) setToken(res.data.token);
            }
            setStatus({ message: "Profile updated successfully!", severity: 'success' });
            fetchProfile(res.data.token || null);
        } catch (err) {
            setStatus({ message: err.response?.data?.message || "Update failed.", severity: 'error' });
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setStatus({ message: "New passwords do not match!", severity: 'error' });
            return;
        }
        setStatus({ message: 'Updating credentials...', severity: 'info' });
        try {
            await axios.post(API_CHANGE_PASSWORD_URL, { old_password: currentPassword, new_password: newPassword }, 
                { headers: { Authorization: `Bearer ${getActiveToken()}` } });
            setStatus({ message: "Password updated!", severity: 'success' });
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (err) {
            setStatus({ message: "Failed to update password. Check current credentials.", severity: 'error' });
        }
    };

    if (isLoading && !profileData) return <Box sx={{ textAlign: 'center', mt: 10 }}><CircularProgress /></Box>;
    if (errorMsg) return <Container maxWidth="md" sx={{ mt: 4 }}><Alert severity="error">{errorMsg}</Alert></Container>;

    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 4, color: 'white' }}>
                
                {/* IDENTITY HEADER */}
                <Paper sx={{ 
                    p: 4, mb: 4, borderRadius: '50px', 
                    bgcolor: 'rgba(255,255,255,0.03)', 
                    border: '1px solid #333', 
                    display: 'flex', alignItems: 'center', gap: 3 
                }}>
                    <Avatar sx={{ 
                        width: 90, height: 90, bgcolor: '#FF00FF', 
                        fontSize: '2.2rem', fontFamily: 'Orbitron', 
                        boxShadow: '0 0 20px rgba(255,0,255,0.3)' 
                    }}>
                        {username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', fontFamily: 'Orbitron', color: '#FF00FF' }}>
                            {username}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip icon={<StarIcon style={{color: 'white'}}/>} label={`Top Mood: ${stats.topMood}`} sx={{ bgcolor: '#1DB954', color: 'white', fontWeight: 'bold' }} />
                            <Chip label={email || 'No email set'} variant="outlined" sx={{ color: '#B3B3B3', borderColor: '#444' }} />
                        </Stack>
                    </Box>
                </Paper>

                {status.message && <Alert severity={status.severity} sx={{ mb: 3, borderRadius: '15px' }}>{status.message}</Alert>}

                {/* MAIN DASHBOARD OVAL */}
                <Paper sx={{ 
                    p: { xs: 2, md: 5 }, 
                    bgcolor: '#0A0A0A', 
                    borderRadius: '60px', 
                    border: '1px solid #333', 
                    boxShadow: '0 30px 100px rgba(0,0,0,0.8)' 
                }}>
                    <Tabs 
                        value={activeTab} 
                        onChange={(e, v) => setActiveTab(v)} 
                        centered 
                        sx={{ mb: 5, '& .MuiTab-root': { fontFamily: 'Orbitron', color: '#666', fontSize: '1rem' } }}
                    >
                        <Tab icon={<AnalyticsIcon />} label="Insights" />
                        <Tab icon={<PersonIcon />} label="Settings" />
                    </Tabs>

                   {/* TAB 0: ANALYTICS INSIGHTS */}
                    {activeTab === 0 && (
                        <Grid 
                            container 
                            spacing={10} 
                            justifyContent="center" // Centering components
                            alignItems="center"     // Vertical centering
                            sx={{ animation: 'fadeIn 0.5s ease' }}
                        >
                            <Grid item xs={12} md={3}>
                                <Card sx={{ bgcolor: '#181818', borderRadius: '40px', border: '1px solid #333', textAlign: 'center', p: 4 }}>
                                    <Typography variant="h6" color="primary" sx={{ fontFamily: 'Orbitron' }}>Total Analysis</Typography>
                                    <Typography variant="h1" sx={{ fontWeight: 'bold', my: 2 }}>{stats.total}</Typography>
                                    <Typography variant="body2" color="textSecondary">Mood sessions recorded</Typography>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={7}>
                                <Typography variant="h5" sx={{ mb: 4, fontFamily: 'Orbitron', textAlign: 'center' }}>Emotional Frequency</Typography>
                                {Object.entries(stats.counts).length === 0 ? (
                                    <Typography sx={{ textAlign: 'center', opacity: 0.5 }}>Analyze your mood to see trends.</Typography>
                                ) : (
                                    Object.entries(stats.counts).map(([mood, count]) => (
                                        <Box key={mood} sx={{ mb: 3 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{mood}</Typography>
                                                <Typography variant="body2" color="primary">{Math.round((count / stats.total) * 100)}%</Typography>
                                            </Box>
                                            <LinearProgress variant="determinate" value={(count / stats.total) * 100} sx={{ height: 10, borderRadius: 5, bgcolor: '#333' }} />
                                        </Box>
                                    ))
                                )}
                            </Grid>
                        </Grid>
                    )}


                    {/* TAB 1: SETTINGS (Security & Account) */}
                    {activeTab === 1 && (
                        <Grid 
                            container 
                            spacing={6} 
                            justifyContent="center" // <-- THIS LINE CENTERS THE COMPONENT
                            sx={{ animation: 'fadeIn 0.5s ease' }}
                        >
                            <Grid item xs={12} md={5}>
                                <Typography variant="h6" sx={{ mb: 3, color: '#B3B3B3', fontFamily: 'Orbitron' }}>Account Identity</Typography>
                                <Box component="form" onSubmit={handleUpdate}>
                                    <TextField label="Username" fullWidth variant="filled" sx={{ mb: 2 }} value={username} onChange={(e)=>setUsername(e.target.value)} required />
                                    <TextField label="Display Name" fullWidth variant="filled" sx={{ mb: 2 }} value={name} onChange={(e)=>setName(e.target.value)} />
                                    <TextField label="Email Address" fullWidth variant="filled" sx={{ mb: 4 }} value={email} onChange={(e)=>setEmail(e.target.value)} />
                                    <Button type="submit" variant="contained" fullWidth sx={{ py: 2, borderRadius: '20px', fontWeight: 'bold' }}>Update Profile</Button>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={5}>
                                <Typography variant="h6" sx={{ mb: 3, color: '#B3B3B3', fontFamily: 'Orbitron' }}>Security Credentials</Typography>
                                <Box component="form" onSubmit={handlePasswordUpdate}>
                                    <TextField label="Current Password" type="password" fullWidth variant="filled" sx={{ mb: 2 }} value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} required />
                                    <TextField label="New Password" type="password" fullWidth variant="filled" sx={{ mb: 2 }} value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} required />
                                    <TextField label="Confirm New Password" type="password" fullWidth variant="filled" sx={{ mb: 4 }} value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required />
                                    <Button type="submit" variant="outlined" color="primary" fullWidth sx={{ py: 2, borderRadius: '20px', fontWeight: 'bold', borderWidth: '2px' }}>Change Password</Button>
                                </Box>
                                <Divider sx={{ my: 4, bgcolor: '#333' }} />
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="caption" sx={{ color: '#444', fontFamily: 'monospace' }}>INST_ID: {profileData?.user_id}</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                </Paper>
            </Box>
        </Container>
    );
};

export default ProfilePage;
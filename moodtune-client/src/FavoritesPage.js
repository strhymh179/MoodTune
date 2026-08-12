import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    Box, Typography, CircularProgress, Alert, Paper, Grid, 
    List, ListItem, ListItemText, Divider, Chip, Tabs, Tab, 
    IconButton, Tooltip, Container, Button, Stack
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import DeleteIcon from '@mui/icons-material/Delete';

const API_PROFILE_URL = 'http://localhost:5000/profile';
const API_DELETE_SONG_URL = 'http://localhost:5000/delete_song';

const FavoritesPage = ({ token }) => {
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [activeTab, setActiveTab] = useState('Happy'); 
    const [activeTrackUri, setActiveTrackUri] = useState(null); 
    const [status, setStatus] = useState({ message: '', severity: 'info' });

    const EMOTION_TABS = ['Happy', 'Sad', 'Angry', 'Fear', 'Neutral', 'Disgust', 'Surprise'];

    // 1. Fetch Profile Data
    const fetchProfile = async () => {
        setIsLoading(true);
        setErrorMsg(null);
        try {
            const response = await axios.get(API_PROFILE_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setProfileData(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                setErrorMsg("Session expired. Please log in again.");
            } else {
                setErrorMsg("Failed to load profile data from API.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchProfile();
    }, [token]);

    // 2. Logic: Group favorites by emotion
    const categorizedFavorites = useMemo(() => {
        if (!profileData || !profileData.history) return {};
        const categorized = {};
        EMOTION_TABS.forEach(emotion => { categorized[emotion] = []; });
        
        profileData.history.forEach(item => {
            if (item.action === 'Saved' && EMOTION_TABS.includes(item.emotion)) {
                categorized[item.emotion].push(item);
            }
        });
        return categorized;
    }, [profileData]);

    const activeFavorites = categorizedFavorites[activeTab] || [];
    const totalSaved = Object.values(categorizedFavorites).flat().length;

    // 3. Logic: Handle "Next Song" within the current category
    const handleNextTrack = () => {
        if (activeFavorites.length === 0) return;
        
        const currentIndex = activeFavorites.findIndex(item => item.uri === activeTrackUri);
        const nextIndex = (currentIndex + 1) % activeFavorites.length;
        setActiveTrackUri(activeFavorites[nextIndex].uri);
    };

    // 4. Logic: Remove song from favorites
    const handleDeleteSong = async (songUri, date) => {
        if (!window.confirm("Are you sure you want to remove this song from your favorites?")) return;
        
        try {
            await axios.post(API_DELETE_SONG_URL, {
                uri: songUri,
                date: date
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Update local state to remove the item immediately
            setProfileData(prev => ({
                ...prev,
                history: prev.history.filter(item => !(item.uri === songUri && item.date === date))
            }));
            
            if (activeTrackUri === songUri) setActiveTrackUri(null);
            
            setStatus({ message: "Song removed from favorites.", severity: 'success' });
            setTimeout(() => setStatus({ message: '', severity: 'info' }), 3000);
        } catch (err) {
            console.error("Delete Error:", err);
            setStatus({ message: "Failed to remove song.", severity: 'error' });
        }
    };

    // --- Sub-Component: Enhanced Player Area ---
    const PlayerArea = ({ uri }) => {
        if (!uri) return null;
        const parts = uri.split(':');
        if (parts.length < 3) return null;
        const embedUrl = `https://open.spotify.com/embed/${parts[1]}/${parts[2]}?utm_source=generator&theme=0&autoplay=1`;
        
        return (
            <Box sx={{ width: '100%', maxWidth: 700, mx: 'auto', mb: 5, animation: 'fadeIn 0.5s ease' }}>
                <Paper sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(255,255,255,0.05)', 
                    borderRadius: '35px', 
                    border: '1px solid #333',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2
                }}>
                    <iframe
                        src={embedUrl}
                        width="100%"
                        height="152"
                        style={{ border: 'none', borderRadius: '25px' }}
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        title="Spotify Player"
                    />
                    
                    <Stack direction="row" spacing={2} sx={{ width: '100%', justifyContent: 'center', px: 2 }}>
                        <Button 
                            variant="contained" 
                            fullWidth
                            startIcon={<SkipNextIcon />}
                            onClick={handleNextTrack}
                            sx={{ 
                                borderRadius: '15px', 
                                py: 1.5, 
                                bgcolor: '#1DB954', 
                                color: 'black',
                                fontWeight: 'bold',
                                fontFamily: 'Orbitron',
                                '&:hover': { bgcolor: '#1ed760' }
                            }}
                        >
                            Play Next in {activeTab}
                        </Button>
                    </Stack>
                </Paper>
            </Box>
        );
    };

    if (isLoading) return <Box sx={{ textAlign: 'center', mt: 10 }}><CircularProgress color="primary" /></Box>;
    if (errorMsg) return <Container maxWidth="md"><Alert severity="error" sx={{ mt: 4 }}>{errorMsg}</Alert></Container>;

    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 4, color: 'white', minHeight: '80vh' }}>
                <Typography variant="h3" sx={{ color: '#FF00FF', textAlign: 'center', fontWeight: 'bold', mb: 2, fontFamily: 'Orbitron' }}>
                    My Mood Playlists
                </Typography>
                <Typography variant="body1" sx={{ color: '#B3B3B3', textAlign: 'center', mb: 4 }}>
                 
                </Typography>

                {status.message && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <Alert severity={status.severity} sx={{ borderRadius: '15px', width: 'fit-content' }}>
                            {status.message}
                        </Alert>
                    </Box>
                )}

                {/* ACTIVE PLAYER AREA */}
                {activeTrackUri && <PlayerArea uri={activeTrackUri} />}

                <Grid container spacing={3} justifyContent="center">
                    <Grid item xs={12} md={10}>
                        <Paper sx={{ 
                            p: { xs: 2, md: 5 }, 
                            bgcolor: '#0A0A0A', 
                            borderRadius: '50px', 
                            border: '1px solid #333', 
                            boxShadow: '0 20px 80px rgba(0,0,0,0.8)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            
                            <Box sx={{ borderBottom: 1, borderColor: '#333' }}>
                                <Tabs 
                                    value={activeTab} 
                                    onChange={(e, v) => { setActiveTab(v); setActiveTrackUri(null); }} 
                                    variant="scrollable"
                                    scrollButtons="auto"
                                    sx={{ 
                                        '& .MuiTabs-indicator': { backgroundColor: '#FF00FF' },
                                        mb: 1
                                    }}
                                >
                                    {EMOTION_TABS.map(emotion => (
                                        <Tab 
                                            key={emotion} 
                                            value={emotion} 
                                            label={`${emotion} (${categorizedFavorites[emotion]?.length || 0})`} 
                                            sx={{ 
                                                color: activeTab === emotion ? '#FF00FF' : '#666', 
                                                textTransform: 'none', 
                                                fontWeight: 'bold', 
                                                fontFamily: 'Orbitron',
                                                fontSize: '0.9rem'
                                            }}
                                        />
                                    ))}
                                </Tabs>
                            </Box>
                            
                            <Box sx={{ 
                                minHeight: '400px', 
                                maxHeight: '500px', 
                                overflowY: 'auto', 
                                mt: 3, 
                                pr: 2,
                                '&::-webkit-scrollbar': { width: '6px' }, 
                                '&::-webkit-scrollbar-thumb': { background: '#FF00FF', borderRadius: '10px' } 
                            }}>
                                {activeFavorites.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 10, opacity: 0.3 }}>
                                        <SentimentSatisfiedAltIcon sx={{ fontSize: 80, mb: 2 }} />
                                        <Typography variant="h6">No "{activeTab}" songs saved yet.</Typography>
                                    </Box>
                                ) : (
                                    <List>
                                        {activeFavorites.map((item, index) => (
                                            <ListItem
                                                key={index}
                                                sx={{ 
                                                    borderBottom: '1px solid #1a1a1a', 
                                                    py: 1, 
                                                    borderRadius: '20px',
                                                    mb: 1,
                                                    bgcolor: activeTrackUri === item.uri ? 'rgba(255, 0, 255, 0.05)' : 'transparent', 
                                                    transition: '0.3s',
                                                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' } 
                                                }}
                                                secondaryAction={
                                                    <Stack direction="row" spacing={1}>
                                                        <Tooltip title="Play">
                                                            <IconButton 
                                                                onClick={() => setActiveTrackUri(item.uri)}
                                                                sx={{ color: activeTrackUri === item.uri ? '#1DB954' : '#FF00FF' }}
                                                            >
                                                                <PlayArrowIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Remove from Favorites">
                                                            <IconButton 
                                                                onClick={() => handleDeleteSong(item.uri, item.date)}
                                                                sx={{ color: '#666', '&:hover': { color: '#FF4444' } }}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                }
                                            >
                                                <ListItemText
                                                    primary={<Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 'bold' }}>{item.track_name}</Typography>}
                                                    secondary={<Typography variant="caption" sx={{ color: '#666' }}>{item.track_artist || "Saved Song"} • {item.date}</Typography>}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                            </Box>

                            {/* --- INTEGRATED COLLECTION COUNTER --- */}
                            <Divider sx={{ mt: 4, mb: 2, bgcolor: '#222' }} />
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, opacity: 0.8 }}>
                                <MusicNoteIcon sx={{ color: '#FF00FF', fontSize: '1.2rem' }} />
                                <Typography variant="body2" sx={{ color: '#B3B3B3', fontFamily: 'Orbitron', fontSize: '0.85rem' }}>
                                    Total saved: <span style={{ color: '#FF00FF', fontWeight: 'bold' }}>{totalSaved} tracks</span>
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default FavoritesPage;
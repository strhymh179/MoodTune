import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import { 
    Button, Box, Typography, CircularProgress, 
    IconButton, Paper, Alert, Container
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const API_PREDICT_URL = 'http://localhost:5000/predict_emotion';
const API_SAVE_SONG_URL = 'http://localhost:5000/save_song'; 

/* ===================== SPOTIFY PLAYER ===================== */
const SpotifyPlayer = React.memo(({ trackUri }) => {
    if (!trackUri) return null;
    const trackId = trackUri.split(':')[2];
    return (
        <iframe 
            src={`https://open.spotify.com/embed/track/${trackId}?theme=0&autoplay=1`}
            width="100%" 
            height="420"
            style={{ borderRadius: '20px', border: 'none' }}
            allow="autoplay; encrypted-media"
            title="Spotify Player"
        />
    );
});

const WebcamAnalyzer = ({ token }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const [trackList, setTrackList] = useState([]);
    const [emotion, setEmotion] = useState("Waiting...");
    const [isLoading, setIsLoading] = useState(false);
    const [trackUri, setTrackUri] = useState(null); 
    const [statusMessage, setStatusMessage] = useState(""); 
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [stream, setStream] = useState(null); 

    const currentTrack = trackList.find(t => t.uri === trackUri);

    /* ===================== CAMERA ===================== */
    const startCamera = async () => {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(newStream);
        setIsCameraActive(true);
    };

    const stopCamera = () => {
        stream?.getTracks().forEach(track => track.stop());
        setStream(null);
        setIsCameraActive(false);
    };

    useEffect(() => {
        startCamera();
        return stopCamera;
    }, []);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    /* ===================== ANALYZE ===================== */
    const captureAndAnalyze = async () => {
        if (!isCameraActive) {
            setEmotion("Waiting...");
            setTrackUri(null);
            setTrackList([]);
            await startCamera();
            return;
        }

        setIsLoading(true);

        const canvas = canvasRef.current;
        const video = videoRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);

        try {
            const res = await axios.post(
                API_PREDICT_URL,
                { image_data: canvas.toDataURL('image/jpeg') },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setEmotion(res.data.emotion);
            setTrackUri(res.data.track_uri);
            setTrackList(res.data.track_list);
            stopCamera();
        } catch {
            setEmotion("Error");
        }

        setIsLoading(false);
    };

    const saveSongToFavorites = async (track) => {
        if (!track) return;
        await axios.post(API_SAVE_SONG_URL, {
            song_uri: track.uri,
            song_title: track.title,
            current_emotion: emotion
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setStatusMessage("Song saved to favorites!");
        setTimeout(() => setStatusMessage(""), 3000);
    };

    /* ===================== SONG ITEM ===================== */
    const SongItem = ({ track, isPlaying }) => (
        <Paper
            onClick={() => setTrackUri(track.uri)}
            sx={{
                p: 2,
                mb: 1.5,
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                bgcolor: isPlaying ? 'rgba(29,185,84,0.12)' : '#282828',
                borderRadius: '12px',
                border: isPlaying ? '1px solid #1DB954' : '1px solid transparent',
                transition: '0.3s',
                '&:hover': { bgcolor: '#3a3a3a' }
            }}
        >
            <Box flexGrow={1}>
                <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>
                    {track.title}
                </Typography>
                <Typography sx={{ color: '#aaa', fontSize: '0.85rem' }}>
                    {track.artist}
                </Typography>
            </Box>

            <IconButton
                onClick={(e) => { e.stopPropagation(); saveSongToFavorites(track); }}
                sx={{ color: '#FF00FF' }}
            >
                <FavoriteBorderIcon fontSize="small" />
            </IconButton>

            <PlayArrowIcon sx={{ color: isPlaying ? '#1DB954' : '#fff' }} />
        </Paper>
    );

    /* ===================== UI ===================== */
    return (
        <Container maxWidth="xl">
            <Typography variant="h4" sx={{ textAlign: 'center',fontWeight: 'bold', fontFamily: 'Orbitron', mb: 4, color: '#FF00FF' }}>
                MoodTune Analyzer
            </Typography>

            {statusMessage && <Alert sx={{ mb: 3 }}>{statusMessage}</Alert>}

            {/* ✅ PROPORTIONAL FLEX LAYOUT */}
            <Box sx={{ 
                display: 'flex', 
                gap: 4, 
                width: '100%', 
                maxWidth: '1300px', 
                mx: 'auto' 
            }}>

                {/* LEFT PANEL */}
             
            <Paper sx={{
    flex: 1,
    p: 4,
    bgcolor: '#181818',
    borderRadius: '32px',
    display: 'flex',
    flexDirection: 'column'
}}>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', mb: 3 }}>
    <Button
        onClick={captureAndAnalyze}
        startIcon={isCameraActive ? <CameraAltIcon /> : <RefreshIcon />}
        disabled={isLoading}
        sx={{
            bgcolor: '#FF00FF',
            color: '#fff',
            borderRadius: '16px',
            px: 3,
            py: 1.5,
            '&:hover': { bgcolor: '#9C27B0' } 
        }}
    >
        {isCameraActive ? 'Start Analyze' : 'Analyze Again'}
    </Button>
</Box>


                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Typography sx={{ color: '#aaa' }}>Detected Emotion:</Typography>
                        <Typography sx={{ color: '#1DB954', fontSize: '2rem', fontWeight: 'bold' }}>
                            {emotion}
                        </Typography>
                    </Box>

                    {isCameraActive ? (
                        <Box sx={{ height: 420, bgcolor: '#000', borderRadius: '20px', overflow: 'hidden' }}>
                            <video ref={videoRef} autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </Box>
                    ) : (
                        <>
                            <SpotifyPlayer trackUri={trackUri} />
                                                <Button 
                                                    variant="contained"
                                                    startIcon={<FavoriteBorderIcon />}
                                                    onClick={() => saveSongToFavorites(currentTrack)}
                                                    sx={{ 
                                                        mt: 3, 
                                                        alignSelf: 'center', 
                                                        width: 'fit-content',
                                                        borderRadius: '15px', 
                                                        px: 4, 
                                                        py: 1.5, 
                                                        bgcolor: '#FF00FF',
                                                        fontSize: '0.8rem', 
                                                        //fontWeight: 'bold', 
                                                        textTransform: 'none',
                                                        '&:hover': { bgcolor: '#9C27B0' } 
                                                    }}
                                                >
                                                    SAVE TO FAVORITES
                                                </Button>



                        </>
                    )}

                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </Paper>

               {/* RIGHT PANEL */}
<Paper sx={{
    flex: 1,
    p: 4,
    bgcolor: '#181818',
    borderRadius: '32px'
}}>

                    <Typography sx={{ color: '#aaa', mb: 3 }}>
                        {trackList.length} Tracks Found
                    </Typography>

                    <Box sx={{ maxHeight: 650, overflowY: 'auto' }}>
                        {trackList.length
                            ? trackList.map((t, i) => (
                                <SongItem key={i} track={t} isPlaying={trackUri === t.uri} />
                            ))
                            : (
                                <Box sx={{ textAlign: 'center', opacity: 0.4 }}>
                                    <MusicNoteIcon sx={{ fontSize: 80 }} />
                                    <Typography>Awaiting Analysis</Typography>
                                </Box>
                            )
                        }
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default WebcamAnalyzer;

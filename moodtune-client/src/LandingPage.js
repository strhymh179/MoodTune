import React from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import HeadsetIcon from '@mui/icons-material/Headset';

const LandingPage = ({ onGetStarted }) => {
    return (
        <Box 
            // CRITICAL FIX: Use fixed positioning and cover the entire viewport
            sx={{ 
                position: 'fixed', 
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh', 
                zIndex: 100, // Ensure it sits above all other static content
                
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'flex-start', // PUSH CONTENT TO THE LEFT
                color: 'white',
                textAlign: { xs: 'center', md: 'left' },
                p: 8, 
                
                // --- UNIQUE BACKGROUND IMAGE CONFIGURATION ---
                backgroundImage: 'url("/landing-page.png")', 
                backgroundSize: 'cover', 
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
                
                backgroundColor: 'rgba(0, 0, 0, 0.5)', 
               
            }}
        >
            
            {/* --- ANCHORED TEXT CONTENT BOX (Moved to the far left) --- */}
            <Box sx={{ 
                // Anchor the content to the top-left section
                position: 'absolute',
                top: '50%',
                // FIX: INCREASED LEFT OFFSET TO 20% (Pushing it further left)
                left: { xs: '50%', md: '20%' }, 
                transform: { xs: 'translate(-50%, -50%)', md: 'translate(0, -50%)' }, // Center vertically
                textAlign: { xs: 'center', md: 'left' },
                // FIX: Reduced max width to 350px for a tighter column
                maxWidth: { xs: '90%', md: '350px' }, 
                zIndex: 101,
            }}>
                <Typography 
                    variant="h2" 
                    component="h1" 
                    gutterBottom 
                    sx={{ 
                        fontSize: { xs: '2.5rem', md: '3.5rem' },
                        fontFamily: 'Montserrat, sans-serif'
                    }}
                >
                    Welcome to
                </Typography>
                <Typography 
                    variant="h1" 
                    component="h2" 
                    gutterBottom 
                    sx={{ 
                        color: '#FF00FF', 
                        fontSize: { xs: '3rem', md: '5rem' },
                        fontWeight: 'bold', 
                        fontFamily: 'Orbitron',
                        lineHeight: 1
                    }}
                >
                    MoodTune
                </Typography>
                 
                <Typography variant="h6" sx={{ color: '#1DB954', mb: 3, fontFamily: 'Lobster', 
        fontWeight: 'bold',
        fontStyle: 'italic'}}>

                    Your AI-Powered Emotional Soundtrack

                </Typography>

                {/* Button matching the revised request (only GET STARTED) */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' }, mt: 4 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onGetStarted}
                        sx={{ 
                            bgcolor: '#FF00FF', // Neon Magenta
                            color: 'white', 
                            px: 5, py: 2, 
                            borderRadius: 3, 
                            fontSize: '1.1rem',
                            fontWeight: 'bold',

                            '&:hover': { bgcolor: '#9C27B0' } 
                        }}
                    >
                        GET STARTED
                    </Button>
                </Box>
            </Box>
            
        </Box>
    );
};

export default LandingPage;
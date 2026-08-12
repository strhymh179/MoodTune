import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import WebcamAnalyzer from './WebcamAnalyzer'; 
import AuthForm from './AuthForm';
import ProfilePage from './ProfilePage'; 
import FavoritesPage from './FavoritesPage'; 
import LandingPage from './LandingPage'; 
import { Container, AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import './App.css';

// --- NEON PURPLE THEME ---
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#FF00FF' },
    secondary: { main: '#9C27B0' },
    success: { main: '#1DB954' },
    error: { main: '#FF4444' },
    text: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3',
    }
  },
  typography: {
    fontFamily: 'Montserrat, sans-serif',
    h4: { color: '#FF00FF' },
    h5: { color: '#FF00FF' },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(30, 30, 30, 0.6)',
          backdropFilter: 'blur(6px)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(30, 30, 30, 0.9)',
          backdropFilter: 'blur(3px)',
          color: '#FFFFFF',
        },
      },
    }
  },
});

function App() {

  const [token, setToken] = useState(null);
  const [view, setView] = useState('landing');

  useEffect(() => {
    const savedToken = localStorage.getItem('moodtune-token');
    if (savedToken) {
      setToken(savedToken);
      setView('analyzer');
    } else {
      setView('landing');
    }
  }, []);

  const handleAuthSuccess = (newToken) => {
    setToken(newToken);
    setView('analyzer');
  };

  const handleLogout = () => {
    localStorage.removeItem('moodtune-token');
    setToken(null);
    setView('landing');
  };

  const handleGetStarted = () => {
    setView('auth');
  };

  const isAuth = !!token;

  // --- PAGE RENDERER ---
  const renderContent = () => {
    if (!isAuth) {
      if (view === 'auth') {
        return (
          <Container maxWidth="md" sx={{ mt: 4 }}>
            <AuthForm onAuthSuccess={handleAuthSuccess} />
          </Container>
        );
      }
      return <LandingPage onGetStarted={handleGetStarted} />;
    }

    // AUTHENTICATED VIEWS
    switch (view) {
      case 'profile':
        return (
          <Container maxWidth="lg" sx={{ mt: 4 }}>
            <ProfilePage token={token} setView={setView} />
          </Container>
        );

      case 'favorites':
        return (
          <Container maxWidth="lg" sx={{ mt: 4 }}>
            <FavoritesPage token={token} setView={setView} />
          </Container>
        );

      case 'analyzer':
      default:
        return (
          // ⭐ NO CONTAINER HERE → FULL WIDTH → FIXES SIDE-BY-SIDE LAYOUT
          <Box sx={{ width: "100%", px: { xs: 1, md: 4 } }}>
            <WebcamAnalyzer token={token} setView={setView} />
          </Box>
        );
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* NAVBAR */}
      {(isAuth || view === 'auth') && (
        <AppBar position="absolute" elevation={0}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, color: '#FF00FF' }}>
              MoodTune
            </Typography>

            {isAuth && (
              <Box>
                <Button
                  color="inherit"
                  onClick={() => setView('analyzer')}
                  sx={{ color: view === 'analyzer' ? '#FF00FF' : '#B3B3B3' }}
                >
                  Analyzer
                </Button>

                <Button
                  color="inherit"
                  onClick={() => setView('favorites')}
                  sx={{ color: view === 'favorites' ? '#FF00FF' : '#B3B3B3' }}
                >
                  Favorites
                </Button>

                <Button
                  color="inherit"
                  onClick={() => setView('profile')}
                  sx={{ color: view === 'profile' ? '#FF00FF' : '#B3B3B3' }}
                >
                  Profile
                </Button>

                <Button
                  onClick={handleLogout}
                  sx={{
                    ml: 2,
                    bgcolor: '#9C27B0',
                    color: '#fff',
                    px: 2,
                    '&:hover': { bgcolor: '#FF00FF' }
                  }}
                >
                  Logout
                </Button>
              </Box>
            )}
          </Toolbar>
        </AppBar>
      )}

      {/* BACKGROUND */}
      <Box
        sx={{
          backgroundImage: 'url("/bg-moodtune.jpg")',
          backgroundSize: 'cover',
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          minHeight: '100vh',
          pt: 12,
        }}
      >
        {renderContent()}
      </Box>
    </ThemeProvider>
  );
}

export default App;

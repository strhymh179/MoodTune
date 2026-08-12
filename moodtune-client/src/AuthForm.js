import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Box, Typography, Paper, Alert, Link, CircularProgress } from '@mui/material';

const API_REGISTER_URL = 'http://localhost:5000/register';
const API_LOGIN_URL = 'http://localhost:5000/login';

const AuthForm = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    // State for Login/Register fields
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // New States for Registration fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setIsError(false);

        const url = isLogin ? API_LOGIN_URL : API_REGISTER_URL;
        
        // Prepare data payload
        let dataPayload = { username, password };

        if (!isLogin) {
            // Add extra fields only for registration
            dataPayload = { ...dataPayload, name, email };
        }
        
        try {
            const response = await axios.post(url, dataPayload);

            if (response.data.success) {
                const token = response.data.token;
                localStorage.setItem('moodtune-token', token);
                
                setMessage(isLogin ? "Login successful!" : "Registration successful! Proceeding to app...");
                setIsError(false);
                
                setTimeout(() => onAuthSuccess(token), 1000); 

            } else {
                setMessage(response.data.message || "An unknown authentication error occurred.");
                setIsError(true);
            }

        } catch (error) {
            const errorMessage = error.response?.data?.message || `Failed to connect to API on port 5000.`;
            setMessage(errorMessage);
            setIsError(true);
            console.error('Auth Error:', error.response || error);
            
        } finally {
            setIsLoading(false);
        }
    };

    const title = isLogin ? "Login" : "Registration";
    const actionText = isLogin ? "Login" : "Register";

    return (
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" component="h1" gutterBottom textAlign="center">
                    MoodTune
                </Typography>
                <Typography variant="h6" gutterBottom textAlign="center" color="primary">
                    {title}
                </Typography>

                <form onSubmit={handleSubmit}>
                    
                    {/* --- Registration Fields (Conditional) --- */}
                    {!isLogin && (
                        <>
                            <TextField
                                label="Full Name"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <TextField
                                label="Email"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </>
                    )}
                    
                    {/* --- Common Fields --- */}
                    <TextField
                        label="Username"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    <TextField
                        label="Password"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        inputProps={{ maxLength: 72 }}
                    />
                    
                    {message && (
                        <Alert severity={isError ? "error" : "success"} sx={{ mt: 2, mb: 1 }}>
                            {message}
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ mt: 2, py: 1.5 }}
                        disabled={isLoading}
                    >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : actionText}
                    </Button>
                </form>

                <Box mt={2} textAlign="center">
                    <Link
                        component="button"
                        variant="body2"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setMessage('');
                            setIsError(false);
                            // Clear fields when switching view
                            setUsername('');
                            setPassword('');
                            setName('');
                            setEmail('');
                        }}
                    >
                        {isLogin ? "Need an account? Register here." : "Already have an account? Login."}
                    </Link>
                </Box>
            </Paper>
        </Box>
    );
};

export default AuthForm;
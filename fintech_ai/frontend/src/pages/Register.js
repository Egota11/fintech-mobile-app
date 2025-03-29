import React from 'react';
import { Box, Typography, Card, CardContent, TextField, Button, Container, Link } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    // Gerçek uygulamada API isteği yapılacak
    localStorage.setItem('token', 'test-token');
    navigate('/');
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Fintech AI - Kayıt
        </Typography>
        <Card>
          <CardContent>
            <Box component="form" onSubmit={handleRegister} sx={{ mt: 2 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Ad Soyad"
                name="name"
                autoFocus
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="E-posta Adresi"
                name="email"
                autoComplete="email"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Şifre"
                type="password"
                id="password"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="passwordConfirm"
                label="Şifre Tekrar"
                type="password"
                id="passwordConfirm"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Kayıt Ol
              </Button>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link component={RouterLink} to="/login" variant="body2">
                  Zaten hesabınız var mı? Giriş yapın
                </Link>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Register; 
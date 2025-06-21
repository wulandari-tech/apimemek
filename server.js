require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const settings = require('./settings');
const apiRoutes = require('./routes/api');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(settings.MONGODB_URI)
    .then(() => console.log('Terhubung ke MongoDB...'))
    .catch(err => console.error('Gagal terhubung ke MongoDB:', err));

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

app.get('/processing', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'processing.html'));
});

app.use((req, res) => {
    if (!res.headersSent) {
        res.status(404).sendFile(path.join(__dirname, 'public', '404.html')); 
    }
});

app.listen(settings.PORT, () => {
    console.log(`Server ZACX STORE berjalan di http://localhost:${settings.PORT}`);
});
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');
const { token, lolkey, git, groq, cloudflare, Api, creator } = require("./config.js");
const Func = require('./lib/functions');
const User = require('./models/user'); 
const app = express();
const PORT = process.env.PORT || 4040;
app.enable('trust proxy');
app.set("json spaces", 2);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'GeForce_Super_Secret_Key_Please_Change_Immediately!',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000, secure: process.env.NODE_ENV === 'production', httpOnly: true },
    store: new MemoryStore({ checkPeriod: 86400000 }),
}));

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

mongoose.connect(token, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log(`MongoDB connected. Server running on http://localhost:${PORT}`))
    .catch(err => console.error('MongoDB connection error:', err));

const loghandler = {
    notparam: (param) => ({ status: false, creator, code: 400, message: `Parameter "${param}" tidak boleh kosong.` }),
    fetchError: (service) => ({ status: false, creator, code: 500, message: `Terjadi kesalahan saat mengambil data dari ${service || 'sumber eksternal'}.` }),
    apiKeyMissing: { status: false, creator, code: 401, message: 'API key is missing.' },
    invalidApiKey: { status: false, creator, code: 403, message: 'Invalid API Key.' },
    limitExceeded: (limit) => ({ status: false, creator, code: 429, message: `Daily API limit of ${limit} requests reached. Upgrade to Premium or wait for reset.` }),
    serverError: (msg) => ({ status: false, creator, code: 500, message: msg || 'Internal server error.' })
};

function generateApiKey() {
    return 'Gfc-' + crypto.randomBytes(10).toString('hex').toUpperCase();
}

app.use(async (req, res, next) => {
    if (req.session.userId) {
        try {
            const userFromDb = await User.findById(req.session.userId);
            if (userFromDb) {
                await userFromDb.resetDailyLimitIfNeeded(); 
                if (userFromDb.isModified()) await userFromDb.save();
                res.locals.user = userFromDb;
                req.session.user = userFromDb.toObject();
            } else {
                req.session.destroy();
                res.locals.user = null;
            }
        } catch (error) {
            console.error("Session User Middleware Error:", error);
            res.locals.user = null;
        }
    } else {
        res.locals.user = null;
    }
    res.locals.isAuthenticated = !!res.locals.user;
    next();
});

function isAuthenticated(req, res, next) {
    if (res.locals.isAuthenticated) return next();
    res.redirect('/login');
}

function isAdmin(req, res, next) {
    if (res.locals.isAuthenticated && res.locals.user.isAdm) return next();
    res.status(403).render('error', { user: res.locals.user, message: "403 - Forbidden Access" });
}

async function apiKeyAuth(req, res, next) {
    const apiKey = req.query.apikey || req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json(loghandler.apiKeyMissing);
    try {
        const user = await User.findOne({ key: apiKey });
        if (!user) return res.status(403).json(loghandler.invalidApiKey);

        await user.resetDailyLimitIfNeeded();
        if (user.isModified()) await user.save();
        if (!user.isPremium && !user.isAdm && user.usageCount >= user.dailyLimit) {
            return res.status(429).json(loghandler.limitExceeded(user.dailyLimit));
        }
        res.locals.apiUser = user;
        res.locals.incrementApiUsage = async () => {
            if (!user.isPremium && !user.isAdm) {
                user.usageCount += 1;
                await user.save();
            }
        };
        next();
    } catch (error) {
        console.error("apiKeyAuth Middleware Error:", error);
        return res.status(500).json(loghandler.serverError('API Key Auth error.'));
    }
}

app.get('/', (req, res) => res.render('index', { user: res.locals.user }));

app.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const quantidadeRegistrados = await User.countDocuments();
        res.render('dashboard', { user: res.locals.user, quantidade: quantidadeRegistrados });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).render('error', { user: res.locals.user, message: 'Error loading dashboard.' });
    }
});

app.get('/myprofile', isAuthenticated, (req, res) => res.render('myprofil', { user: res.locals.user }));

app.post('/editarr/:username', isAuthenticated, async (req, res) => {
    const { username } = req.params;
    if (res.locals.user.username !== username) return res.status(403).send("Unauthorized");
    const { password, ft, insta, wallpaper, zap, yt } = req.body;
    try {
        const userToUpdate = await User.findById(res.locals.user._id);
        if (!userToUpdate) return res.status(404).render('error', { user: res.locals.user, message: 'User not found.'});

        if (password && password.trim().length > 0) userToUpdate.password = password.trim(); // Hashing handled by pre-save
        if (ft) userToUpdate.ft = ft;
        if (yt) userToUpdate.yt = yt;
        if (insta) userToUpdate.insta = insta;
        if (zap) userToUpdate.zap = zap;
        if (wallpaper) userToUpdate.wallpaper = wallpaper;

        await userToUpdate.save();
        req.session.user = userToUpdate.toObject(); // Update session user
        res.locals.user = userToUpdate; // Update locals for current request/response cycle
        res.redirect('/myprofile');
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).render('error', { user: res.locals.user, message: 'Error updating profile.' });
    }
});

app.get('/register', (req, res) => {
    if (res.locals.isAuthenticated) return res.redirect('/dashboard');
    res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        if (!username || !password || !email) return res.status(400).render('register', { error: 'All fields are required.' });
        if (username.includes(' ')) return res.status(400).render('register', { error: 'Username cannot contain spaces.' });

        const existingUser = await User.findOne({ $or: [{ username: username.trim() }, { email: email.trim().toLowerCase() }] });
        if (existingUser) return res.status(409).render('register', { error: 'Username or email already exists.' });

        const newUser = new User({
            username: username.trim(),
            password: password, // Password will be hashed by pre-save hook
            email: email.trim().toLowerCase(),
            key: generateApiKey()
        });
        await newUser.save();
        
        // Optionally log in the user directly
        // req.session.userId = newUser._id;
        // req.session.user = newUser.toObject();
        // return res.redirect('/dashboard');

        // Or redirect to login with a success message (if you implement flash messages)
        return res.render('login', { error: null, success: "Registration successful! Please log in." });

    } catch (error) {
        console.error('Registration error:', error);
        let errMsg = 'Error registering user.';
        if (error.name === 'ValidationError') {
            errMsg = Object.values(error.errors).map(e => e.message).join(' ');
        }
        res.status(500).render('register', { error: errMsg });
    }
});

app.get('/login', (req, res) => {
    if (res.locals.isAuthenticated) return res.redirect('/dashboard');
    res.render('login', { error: null, success: req.query.success || null }); // Pass success message from registration
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).render('login', { error: 'Username and password required.', success: null });
    try {
        const user = await User.findOne({ username: username.trim() });
        if (!user) return res.status(401).render('login', { error: 'Invalid username or password.', success: null });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).render('login', { error: 'Invalid username or password.', success: null });

        req.session.userId = user._id;
        req.session.user = user.toObject();
        if (user.isAdm) return res.redirect('/admin');
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).render('login', { error: 'Internal server error during login.', success: null });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) console.error("Session destroy error:", err);
        res.clearCookie('connect.sid'); // Default session cookie name
        res.redirect('/');
    });
});

app.get('/admin', isAdmin, async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 }).lean(); // Use lean for faster queries if not modifying
        res.render('adminDashboard', { users: users, user: res.locals.user });
    } catch (e) {
        console.error(e);
        res.status(500).render('error', { user: res.locals.user, message: 'Server error fetching admin data.'});
    }
});

app.get('/editar/:username', isAdmin, async (req, res) => {
    try {
        const userToEdit = await User.findOne({ username: req.params.username });
        if (!userToEdit) return res.status(404).render('error', { user: res.locals.user, message: 'User not found.'});
        res.render('edit', { user: userToEdit });
    } catch (e) {
        console.error(e);
        res.status(500).render('error', { user: res.locals.user, message: 'Server error fetching user for edit.'});
    }
});

app.post('/edit/:username', isAdmin, async (req, res) => {
    const { username } = req.params;
    const { password, email, key, saldo, total, ft, isAdm, isPremium } = req.body;
    try {
        const userToUpdate = await User.findOne({ username });
        if (!userToUpdate) return res.status(404).render('error', { user: res.locals.user, message: 'User not found for update.'});

        if (password && password.trim().length > 0) userToUpdate.password = password.trim(); // Hashing handled by pre-save
        if (email) userToUpdate.email = email.trim().toLowerCase();
        if (key) userToUpdate.key = key.trim();
        if (ft) userToUpdate.ft = ft;
        if (saldo !== undefined) userToUpdate.saldo = Number(saldo);
        if (total !== undefined) userToUpdate.total = Number(total);
        
        userToUpdate.isAdm = (isAdm === 'true');
        userToUpdate.isPremium = (isPremium === 'true');

        if (userToUpdate.isPremium || userToUpdate.isAdm) {
            userToUpdate.dailyLimit = Infinity;
            userToUpdate.usageCount = 0; // Reset usage for premium/admin
        } else {
            userToUpdate.dailyLimit = 50; // Default limit for free users
        }

        await userToUpdate.save();
        res.redirect('/admin');
    } catch (e) {
        console.error(e);
        let errMsg = 'Server error updating user.';
        if (e.code === 11000) errMsg = `Update failed. ${Object.keys(e.keyValue)[0]} '${Object.values(e.keyValue)[0]}' might already be in use.`;
        if (e.name === 'ValidationError') errMsg = Object.values(e.errors).map(err => err.message).join(' ');
        res.status(500).render('error', { user: res.locals.user, message: errMsg });
    }
});

app.get('/deletar/:username', isAdmin, async (req, res) => {
    try {
        const userToDelete = await User.findOne({ username: req.params.username });
        if (!userToDelete) return res.status(404).render('error', { user: res.locals.user, message: 'User not found for deletion.'});
        if (userToDelete._id.equals(res.locals.user._id)) { // Prevent self-deletion via this route
             return res.status(400).render('error', { user: res.locals.user, message: 'Admins cannot delete their own account this way.'});
        }
        await User.findOneAndDelete({ username: req.params.username });
        res.redirect('/admin');
    } catch (e) {
        console.error(e);
        res.status(500).render('error', { user: res.locals.user, message: 'Server error deleting user.'});
    }
});

app.get('/search', isAdmin, async (req, res) => {
    const searchTerm = req.query.search || '';
    try {
        const searchRegex = new RegExp(searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
        const results = await User.find({
            $or: [
                { username: searchRegex },
                { email: searchRegex },
                { key: searchRegex }
            ]
        }).lean();
        res.render('search', { searchResults: results, searchTerm: searchTerm, user: res.locals.user });
    } catch (e) {
        console.error(e);
        res.status(500).render('error', { user: res.locals.user, message: 'Server error during search.'});
    }
});

['downloader', 'islamic', 'pricing', 'ai-features', 'search-features', 'game-features'].forEach(page => {
    app.get(`/${page}`, isAuthenticated, (req, res) => res.render(page.replace('-features', '_features'), { user: res.locals.user }));
});
app.get('/ai', isAuthenticated, (req, res) => res.render('ai', { user: res.locals.user })); // Specific handler for /ai if its EJS is just 'ai.ejs'

app.get('/api/checklimit', apiKeyAuth, async (req, res) => {
    const { keytocheck } = req.query;
    if (!keytocheck) return res.status(400).json(loghandler.notparam('keytocheck'));

    try {
        const userToFind = await User.findOne({ key: keytocheck });
        if (!userToFind) return res.status(404).json({ status: false, creator, message: "API Key yang dicek tidak ditemukan." });
        
        await userToFind.resetDailyLimitIfNeeded(); // Ensure data is current
        if (userToFind.isModified()) await userToFind.save();

        res.status(200).json({
            status: true,
            creator: creator,
            data: {
                username: userToFind.username,
                usageCount: userToFind.usageCount,
                dailyLimit: userToFind.dailyLimit,
                isPremium: userToFind.isPremium,
                isAdm: userToFind.isAdm,
                key: userToFind.key
            }
        });
    } catch (error) {
        console.error("Error di /api/checklimit:", error);
        res.status(500).json(loghandler.serverError("Terjadi kesalahan internal saat memeriksa limit API Key."));
    }
});

const apiRouteModulesDir = path.join(__dirname, 'routes', 'api_modules');
if (!fs.existsSync(apiRouteModulesDir)) fs.mkdirSync(apiRouteModulesDir, { recursive: true });

const dynamicApiFiles = [
    'ai-luminai.js', 'ai-hydromind.js', 'douyin.js', 'bibli.js', 'heroml.js',
    'Instagram.js', 'jadianime.js', 'lirik.js', 'MediaFire.js', 'pinterest.js',
    'to-zombie.js', 'meta.js', 'remini.js', 'text2img.js', 'spotifydl.js',
    'twitter.js', 'tiktok.js', 'ytmp3.js', 'ytmp4.js', 'whisper.js',
    'deepseek.js', 'Gemini-image.js', 'gemini.js', 'gensinstalk.js', 'gpt4-o.js'
];

dynamicApiFiles.forEach(file => {
    try {
        const routePath = path.join(apiRouteModulesDir, file);
        if (fs.existsSync(routePath)) {
            const configObjects = { Func, git, groq, cloudflare, Api, lolkey, creator, loghandler };
            require(routePath)(app, apiKeyAuth, isAuthenticated, configObjects);
        } else { console.warn(`API module file not found, skipping: ${routePath}. Place it in ${apiRouteModulesDir}`); }
    } catch (error) { console.error(`Error loading API module ${file}:`, error); }
});

const mainApiRoutesPath = path.join(__dirname, 'routes', 'api.js');
if (fs.existsSync(mainApiRoutesPath)) {
    const mainApiRoutes = require(mainApiRoutesPath);
    app.use('/api', apiKeyAuth, mainApiRoutes); // Apply apiKeyAuth to all /api routes
} else {
    console.warn("Main API routes file (routes/api.js) not found.");
}


app.use((req, res, next) => res.status(404).render('error', { user: res.locals.user, message: "404 - Page Not Found" }));
app.use((err, req, res, next) => {
    console.error("Global error:", err.message, err.stack);
    res.status(err.status || 500).render('error', { user: res.locals.user, message: err.customMessage || "500 - Internal Server Error" });
});

app.listen(PORT, () => console.log(`GeForce API Server running on http://localhost:${PORT}`));

module.exports = app;
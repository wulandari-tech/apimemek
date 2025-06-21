const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Make sure to install: npm install bcryptjs

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }, // Will be hashed
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    key: { type: String, unique: true, required: true },
    ft: { type: String, default: 'https://files.catbox.moe/08i4iu.jpg' },
    yt: { type: String, default: 'youtube.com/-' },
    zap: { type: String, default: '628-' },
    insta: { type: String, default: '@_hiaxel' },
    wallpaper: { type: String, default: 'https://telegra.ph/file/56fa53ec05377a51311cc.jpg' },
    total: { type: Number, default: 0 },
    saldo: { type: Number, default: 0 },
    isAdm: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 },
    dailyLimit: { type: Number, default: 50 }, // This will be effectively Infinity for premium/admin
    lastReset: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now } // Added for tracking updates
});

// Pre-save hook to hash password if it's modified
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        // If user becomes premium or admin, ensure their limits reflect that
        if (this.isPremium || this.isAdm) {
            this.dailyLimit = Infinity; // Or a very large number if Infinity causes issues with DB type
            this.usageCount = 0;
        } else if (this.dailyLimit === Infinity || this.dailyLimit > 50 /* some very large number */) {
            // If they are no longer premium/admin, reset to default
             this.dailyLimit = 50;
        }
        next();
    } catch (err) {
        next(err);
    }
});

// Method to compare submitted password with hashed password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to reset daily API usage limit if needed
userSchema.methods.resetDailyLimitIfNeeded = async function() {
    if (this.isPremium || this.isAdm) {
        // For premium/admin, usageCount should always be effectively 0 for limit checks
        // and dailyLimit is Infinity. We can ensure usageCount is 0 if it's not.
        if (this.usageCount !== 0) {
            this.usageCount = 0;
            // No need to change dailyLimit here as it's handled by pre-save or admin edit
            await this.save({ validateModifiedOnly: true }); // Avoid re-hashing password if not changed
        }
        return false; // No "reset" in the traditional sense happened for limit purposes
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const lastResetDate = new Date(this.lastReset);
    lastResetDate.setHours(0, 0, 0, 0); // Start of the last reset day

    if (lastResetDate < today) {
        this.usageCount = 0;
        this.lastReset = new Date(); // Set to now
        await this.save({ validateModifiedOnly: true });
        console.log(`Daily limit reset for user: ${this.username}`);
        return true; // Limit was reset
    }
    return false; 
};
userSchema.pre('save', function(next){
    if (!this.isNew) {
      this.updatedAt = Date.now();
    }
    next();
});

module.exports = mongoose.model('Takashi', userSchema);
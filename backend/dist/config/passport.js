"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        if (!email)
            return done(new Error('Email Google non disponible'));
        // Chercher ou créer l'utilisateur
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                name: profile.displayName,
                avatar: profile.photos?.[0]?.value,
            },
            create: {
                email,
                name: profile.displayName,
                password: `google_${profile.id}`, // pas utilisé pour OAuth
                avatar: profile.photos?.[0]?.value,
                role: 'USER',
            },
        });
        return done(null, user);
    }
    catch (err) {
        return done(err);
    }
}));
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map
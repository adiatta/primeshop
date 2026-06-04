import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL!,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('Email Google non disponible'));

      // Chercher ou créer l'utilisateur
      const user = await prisma.user.upsert({
        where:  { email },
        update: {
          name:   profile.displayName,
          avatar: profile.photos?.[0]?.value,
        },
        create: {
          email,
          name:     profile.displayName,
          password: `google_${profile.id}`, // pas utilisé pour OAuth
          avatar:   profile.photos?.[0]?.value,
          role:     'USER',
        },
      });

      return done(null, user);
    } catch (err) {
      return done(err as Error);
    }
  }
));

export default passport;
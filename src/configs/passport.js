import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LineStrategy } from "passport-line";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { config } from "../../config.js";


dotenv.config();

const prisma = new PrismaClient();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {


      try {
        const email = profile.emails[0]?.value;
        if (!email) {
          return done(new Error("No email found in Google profile"), null);
        }
        let user = await prisma.users.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.users.create({
            data: {
              email,
              name: profile.displayName,
              profile_pic_url: profile.photos ? profile.photos[0].value : null,
              password: "",
              login_way: "GOOGLE",
            },
          });
        }
        if (!user || !user.id) {
          return done(new Error("User or ID is invalid"), null);
        }
        const tokenPayload = { id: user.id, email: user.email };
        const token = jwt.sign(tokenPayload, config.jwtSecretKey, {
          expiresIn: "10h",
        });
        const updatedUser = await prisma.users.update({
          where: { id: user.id },
          data: { token },
        });
        return done(null, updatedUser);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.use(
  new LineStrategy(
    {
      channelID: process.env.LINE_CHANNEL_ID,
      channelSecret: process.env.LINE_CHANNEL_SECRET,
      callbackURL: process.env.LINE_REDIRECT_URI,
      scope: ['profile', 'openid', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.email || `${profile.id}@line.com`;
        let user = await prisma.users.findUnique({ where: { email } });
        if (user) {
          user = await prisma.users.update({
            where: { email },
            data: {
              name: profile.displayName,
              profile_pic_url: profile.pictureUrl || null,
              login_way: "LINE",
            },
          });
          const tokenPayload = {
            id: user.id,
            email: user.email,
          };
            const token = jwt.sign(tokenPayload, config.jwtSecretKey, {
            expiresIn: "10h",
          });
          await prisma.users.update({
            where: { id: user.id },
            data: { token },
          });
        } else {
          user = await prisma.users.create({
            data: {
              email,
              name: profile.displayName,
              profile_pic_url: profile.pictureUrl || null,
              password: "",
              login_way: 'LINE',
            },
          });
          const tokenPayload = {
            id: user.id,
            email: user.email,
          };
            const token = jwt.sign(tokenPayload, config.jwtSecretKey, {
            expiresIn: "10h",
          });
          await prisma.users.update({
            where: { id: user.id },
            data: { token },
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.users.findUnique({ where: { id } });
    if (user) {
      done(null, user);
    } else {
      done(new Error('User not found'), null);
    }
  } catch (err) {
    done(err, null);
  }
});

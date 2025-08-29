const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GithubStrategy = require("passport-github2").Strategy;
const prisma = require("./database");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, profile, done) => {
      try {
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        if (user) {
          return done(null, user);
        }

        user = await prisma.user.findUnique({
          where: { email: profile.emails[0].value },
        });

        if (user) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId: profile.id },
          });
          return done(null, user);
        }

        user = await prisma.user.create({
          data: {
            username:
              profile.displayName || profile.emails[0].value.split("@")[0],
            email: profile.emails[0].value,
            googleId: profile.id,
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/api/auth/github/callback",
    },
    async (accessToken, profile, done) => {
      try {
        let user = await prisma.user.findUnique({
          where: { githubId: profile.id },
        });

        if (user) {
          return done(null, user);
        }

        const email =
          profile.emails?.[0]?.value || `${profile.username}@github.local`;

        user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { githubId: profile.id },
          });
          return done(null, user);
        }

        user = await prisma.user.create({
          data: {
            username:
              profile.username || profile.displayName || email.split("@")[0],
            email,
            githubId: profile.id,
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

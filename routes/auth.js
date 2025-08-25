const express = require("express");
const passport = require("passport");
const {
  register,
  login,
  logout,
  refreshTokens,
  getMe,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refreshTokens);
router.get("/me", authenticate, getMe);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate(
    "google",
    { failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed` },
    async (req, res) => {
      try {
        const { generateTokens, saveRefreshToken } = require("../utils/jwt");
        const { accessToken, refreshToken } = generateTokens(req.user.id);
        await saveRefreshToken(req.user.id, refreshToken);

        res.cookie("accessToken", accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.redirect(`${process.env.CLIENT_URL}/dashboard`);
      } catch (error) {
        console.error("OAuth callback error", error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
      }
    }
  )
);

router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate(
    "github",
    { failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed` },
    async (req, res) => {
      try {
        const { generateTokens, saveRefreshToken } = require("../utils/jwt");
        const { accessToken, refreshToken } = generateTokens(req.user.id);
        await saveRefreshToken(req.user.id, refreshToken);

        res.cookie("accessToken", accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.redirect(`${process.env.CLIENT_URL}/dashboard`);
      } catch (error) {
        console.error("OAuth callback error", error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
      }
    }
  )
);

module.exports = router;

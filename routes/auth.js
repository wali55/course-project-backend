const express = require("express");
const passport = require("passport");
const {
  register,
  login,
  logout,
  getMe,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
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
        const { generateTokens } = require("../utils/jwt");
        const { accessToken } = generateTokens(req.user.id);

        res.cookie("accessToken", accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 15 * 60 * 1000,
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
        const { generateTokens } = require("../utils/jwt");
        const { accessToken } = generateTokens(req.user.id);

        res.cookie("accessToken", accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 15 * 60 * 1000,
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

import express from 'express';
import passport from 'passport';

const router = express.Router();

const HOST_URL = process.env.HOST_URL;

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));
router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      prompt: 'consent',
    })(req, res, next);
  },
  (req, res) => {
    const token = req.user.token
    const userId = req.user.id
    res.redirect(`${HOST_URL}/planner?token=${token}&userId=${userId}`);
  }
);

router.get('/line-login', passport.authenticate('line', {
  scope: ['profile', 'openid', 'email'],
}));
router.get('/line/callback',
  passport.authenticate('line', { failureRedirect: '/' }),
  (req, res) => {
    const token = req.user.token
    const userId = req.user.id
    res.redirect(`${HOST_URL}/planner?token=${token}&userId=${userId}`);
  }
);

export default router;

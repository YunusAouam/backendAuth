const router = require('express').Router();
const { signin, signup, verify, resetPassword, reset_password_verify, changePassword } = require('../controllers/AuthController');
const { protect } = require('../Middleware/authMiddleware');
const User = require('../Models/User');

router.get('/verifyUserSession', protect, async (req, res) =>{
    return res.status(200).send({token : req.token});
});
router.post('/signin',  signin);

router.post('/signup', signup);

router.get('/:id/verify/:token', verify);

router.post('/reset-password', resetPassword);

router.get('/:userId/reset/:token', reset_password_verify);

router.post('/changePassword', changePassword);

module.exports = router;
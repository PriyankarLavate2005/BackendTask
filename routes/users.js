const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  completeRegistration
} = require('../controllers/userController');

const router = express.Router();

router.get('/', getUsers); // Now any logged-in user can access

router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id',deleteUser); 
router.post('/complete-registration', completeRegistration);

module.exports = router;
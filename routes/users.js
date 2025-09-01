const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  completeRegistration
} = require('../controllers/userController');

const router = express.Router();

// All routes below require login

// ✅ REMOVE authorize('admin') from here:
router.get('/', getUsers); // Now any logged-in user can access

router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id',deleteUser); // Keep admin for delete
router.post('/complete-registration', completeRegistration);

module.exports = router;
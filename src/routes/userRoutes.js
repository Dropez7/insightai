

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/', userController.createUser);        // cadastro
router.post('/login', userController.login);        // login
router.get('/', userController.listUsers);          // listar todos
router.get('/:id', userController.getUser);         // buscar um
router.put('/:id', userController.updateUser);      // atualizar
router.delete('/:id', userController.deleteUser);   // remover

module.exports = router;

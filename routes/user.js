'use strict'
//modulos
var express = require('express');
var multipart = require('connect-multiparty');
//declaramos el middleware de multiparty
var md_upload = multipart({uploadDir: './uploads/users'})
//aqui se define que se requiere los metodos de Router de express como GET PUT DELETE POST
var api = express.Router();
//aqui definimos el middleware para que haga la autenticacion con tokens
var md_auth = require('../middlewares/authenticated');
//aqui declaramos nuestro controlador del que exportaremos
// nuestras funciones que ejecutarn los paths
var UserControler = require('../controllers/user');

api.get('/home', UserControler.home);

api.get('/pruebas',md_auth.ensureAuth, UserControler.pruebas);

api.post('/register', UserControler.saveUser);

api.post('/login', UserControler.loginUser);

api.get('/user/:id', md_auth.ensureAuth, UserControler.getUser);

api.get('/users/:page?', md_auth.ensureAuth, UserControler.getUsers);

api.put('/update-user/:id', md_auth.ensureAuth, UserControler.updateUser);

api.post('/upload-image-user/:id', [md_auth.ensureAuth, md_upload], UserControler.uploadImage)

api.get('/get-image-user/:imageFile', UserControler.getImageFile);


module.exports = api;


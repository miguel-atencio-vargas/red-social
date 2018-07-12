/*este modulo es el fichero que lleva toda la configuaracion de express 
carga de ficheros configuracion etc*/
'use strict'

var express = require('express');
var bodyParser = require('body-parser');

var app = express();


//cargar rutas
var user_routes = require('./routes/user');
var follow_routes = require('./routes/follow');

//middlewares
//app.use nos permite hacer uso de middlewares
//es decir en cada peticion que hagamos el middleware se ejecutaran antes
//de llegar a la accion del controlador
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

//cors

//rutas
app.use('/api', user_routes);
app.use('/api', follow_routes);

//exportar
module.exports = app;
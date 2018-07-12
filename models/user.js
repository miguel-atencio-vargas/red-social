'use strict'

var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var UserSchema = Schema({
    
    name: String,
    surname: String,
    nick: String,
    email: String,
    password: String,
    role: String,
    image: String
});
//el primer parametro es que el que coje mongo le hace un lower case y lo plurariza para 
//por fin nombrar la coleccion con ese nombre
module.exports = mongoose.model('User', UserSchema);



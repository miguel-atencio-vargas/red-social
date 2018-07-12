'use strict'


var jwt = require('jwt-simple');
var moment = require('moment');


var secret ='clave_secreta_curso_nodejs'

exports.ensureAuth = (req, res, next) =>{
    if(!req.headers.authorization) return res.status(403).send({
        message: 'La cabecera no tiene la cabecera de autenticacion'
    });

    var token = req.headers.authorization.replace(/['"]+/g, '');

    try{
        var payload = jwt.decode(token, secret);
        if (payload.exp <= moment().unix){
            return res.status(401).send(
                {message: 'el token ha expirado'}
            )
        }

    }catch(e){
        return res.status(404).send(
            {message: 'Error: Token no es valido '}
        );
    }
    //con esto adjuntamos el payload a la request
    //para tener siempre dentro de los controladores
    //el objeto del usuario loggueado
    req.user  = payload;
    next();
}


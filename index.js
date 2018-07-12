/*Este modulo es para hacer las conexiones y la creacion del servidor*/

'use strict'
var mongoose = require ('mongoose');
var app = require ('./app');
var port = 8000;
var uri = 'mongodb://localhost:27017/curso_mean_social';

mongoose.Promise = global.Promise;

mongoose.connect(uri, {useNewUrlParser: true})

    .then(() => {
        console.log('La conexion a la base de datos se ha realizado correctamente');
        //crear el servidor
        app.listen(port, () => {
            console.log('Servidor corriendo: http://localhost:8000');
        });
    })
    .catch((e)=>{
        console.log('Error: ',e);
    })


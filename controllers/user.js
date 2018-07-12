'use strict'


//modulos necesarios
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');


//cargamos nuestro modelo de usuario
// la primera letra de un modelo se la pone en mayuscula para indicar que es un modelo
var User = require('../models/user');


function home(req, res) {
    res.status(200).send({
        message: 'Home  de node js'
    });
}
//Metodos de prueba
function pruebas(req, res) {
    console.log(req.body);
    res.status(200).send({
        message: 'Accion de pruebas en el servidor de node js'
    });
}
//Registro *modificated
function saveUser(req, res) {
    //utiliazmos body para los metodos post o put
    var params = req.body;
    var user = new User();

    if (params.name && params.surname &&
        params.nick && params.email && params.password) {

        user.name = params.name;
        user.surname = params.surname;
        user.nick = params.nick;
        user.email = params.email;
        user.role = 'ROLE_USER';
        user.image = null;
        //controlar usuarios duplicados
        User.find({
            $or: [{
                    email: user.email.toLowerCase()
                },
                {
                    nick: user.nick.toLowerCase()
                }
            ]
        }).exec((err, users) => {
            if (err) return res.status(500).send({
                message: 'Error en la peticion de usuarios'
            });

            if (users && users.length >= 1) {
                return res.status(200).send({
                    messge: 'El usuario que intentas registrar ya esta registrado'
                })
            } else {
                //en este paso el parametro de la contraseña la ciframos
                //utilizando el modulo bcrypt
                bcrypt.hash(params.password, null, null, (err, hash) => {
                    user.password = hash;
                    //el metodo save es de mogoose
                    user.save((err, userStored) => {
                        //clausulas de guarda
                        if (err) return res.status(500).send({
                            message: 'Error al guardar el usuario'
                        });

                        if (!userStored) return res.status(404).send({
                            message: 'No se ha registrado el usuario'
                        });

                        return res.status(200).send({
                            user: userStored
                        });
                    });
                });
            }
        })

    } else {
        res.status(200).send({
            message: 'Envia todos los campos necesarios'
        });
    }
}
//Login
function loginUser(req, res) {
    var params = req.body;

    var email = params.email;
    var password = params.password;

    User.findOne({
        email: email
    }, (err, user) => {
        if (err) return res.status(500).send({
            message: 'Error en la peticion'
        });

        if (user) {
            bcrypt.compare(password, user.password, (err, check) => {
                if (check) {
                    //si gettoken es true que ojo esta definido en la cabecera
                    if (params.gettoken) {
                        //devolvera y generara el token
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        })
                    } else {
                        //devolver datos de usuario
                        console.log('Solo estamos devolviendo los datos del usuario \n Si quieres obtener el token en el body dale al gettoken: true')
                        user.password = undefined;
                        return res.status(200).send({
                            user
                        })
                    }
                } else {
                    return res.status(404).send({
                        message: 'Error el usuario no se ha podido identificar *password incorrecto'
                    });
                }
            })
        } else {
            return res.status(404).send({
                message: 'El usuario no se ha podido identificar!! *usuario incorrecto'
            });
        }
    });
}

//Conseguir datos de un usuario
function getUser(req, res) {
    //utilizamos params para obtener los datos de la url
    var userId = req.params.id;

    User.findById(userId, (err, user) => {
        if (err) return res.status(500).send({
            message: 'Error en la peticion. getUserId()'
        });

        if (!user) return res.status(404).send({
            message: 'Usuario no existente'
        });

        return res.status(200).send({
            user
        });
    });
}

//devolver un listado de usuarios paginados
function getUsers(req, res) {
    // console.log('soy el:req.user.sub= '+req.user.sub);
    var identity_user_id = req.user.sub;

    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemPerPage = 5;

    User.find().sort('_id').paginate(page, itemPerPage, (err, users, total) => {
        if (err) return res.status(500).send({
            message: 'Error en la peticion *getUsers()'
        });
        if (!users) return res.status(404).send({
            message: 'No hay usuarios disponibles *getUsers()'
        });

        return res.status(200).send({
            users,
            total,
            pages: Math.ceil(total / itemPerPage)
        })
    })
}
//edicion de datos de usuario
function updateUser(req, res) {
    var userId = req.params.id;
    var update = req.body;

    //borrar la propiedad password
    delete update.password;

    if (userId != req.user.sub) return res.status(500).send({
        message: 'NO tienes permiso para actualizar los datos del usuario'
    });

    User.findByIdAndUpdate(userId, update, {
            new: true
        },
        (err, userUpdate) => {
            if (err) return res.status(500).send({
                message: 'Error en la peticion *updateUser()'
            });

            if (!userUpdate) return res.status(404).send({
                message: 'No se ha podido actualizar el usuario'
            });

            return res.status(200).send({
                user: userUpdate
            });
        });

}

//Subir archivos de imagen/avatar de usuario
function uploadImage(req, res) {
    var userId = req.params.id;


    if (req.files) {
        var file_path = req.files.image.path;
        console.log(file_path);

        var file_split = file_path.split('\\');
        console.log(file_split);

        var file_name = file_split[2];
        console.log(file_name);
        //aqui lo que hacemos con el split es cortar desde que caracter deseeamos obtener su
        //continuacion para ello utilizamos primero '\' y seguido de eso escribimos el caracter 
        //  que nosotros hayamos escogido todo ese proceso cortara el string en un array para despues
        // nosotros escojamos en que posicion del array este ese string que necesitemos
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];
        //aqui verificamos si el usuario que esta tratando de subir la imagen es igual al usuario logeueado
        //el userId es el que llega por el url
        if (userId != req.user.sub) {
            return removeFilesOfUpload(res, file_path, 'NO tienes permiso para actualizar los datos del usuario');
        }

        //aqui comprobamos si las extensiones son correctas
        if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif') {
            //actualizar documento de usuario logueado
            User.findByIdAndUpdate(userId, {
                    image: file_name
                }, {
                    new: true
                },
                (err, userUpdate) => {
                    if (err) return res.status(500).send({
                        message: 'Error en la peticion *uploadImage()'
                    });

                    if (!userUpdate) return res.status(404).send({
                        message: 'No se ha podido actualizar el usuario *uploadImage'
                    });

                    return res.status(200).send({
                        user: userUpdate
                    });
                })
        } else {
            //borrado del fichero que se ha subido aparte de mostrar el error
            return removeFilesOfUpload(res, file_path, 'Extension no valida');
        }
    } else {
        res.status(200).send({
            message: 'No se han subido archivos o imagenes'
        });
    }
}

function removeFilesOfUpload(res, file_path, message) {
    fs.unlink(file_path, (err) => {
        return res.status(200).send({
            message: message
        })
    });
}

//funcion para obtener una imagen que este en el servidor
function getImageFile(req, res) {
    var image_file = req.params.imageFile;
    var path_file = './uploads/users/' + image_file;

    fs.exists(path_file, (exists) => {
        if (exists) {
            res.sendFile(path.resolve(path_file));
        } else {
            res.status(200).send({
                message: 'No existe la imagen'
            });
        }
    });


}
module.exports = {
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    updateUser,
    uploadImage,
    getImageFile
}
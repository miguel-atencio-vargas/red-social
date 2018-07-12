'use strict'

var mongoosePaginate = require('mongoose-pagination');

//cargamos nuestro modelo de follow
var Follow = require('../models/follow');
var User = require('../models/user');



//funcion para hacer el sistema de seguimiento de usuarios
function saveFollow(req, res) {
    var params = req.body;

    var follow = new Follow();
    follow.user = req.user.sub;
    follow.followed = params.followed;

    follow.save((err, followStored) => {
        if (err) return res.status(500).send({
            message: 'Error al guardar el seguimiento * saveFollow()'
        });
        if (!followStored) return res.status(404).send({
            message: 'El seguimiento no se ha guardado * saveFollow()'
        });

        return res.status(200).send({
            follow: followStored
        });
    });
}

// funcion para dejar de seguir a un usuario
function deleteFollow(req, res) {
    var userId = req.user.sub;
    var name = req.user.name;

    var followId = req.params.id;
    User.findById(followId, (err, user) => {
        if (err) return res.status(500).send({
            message: 'Error al conectarse'
        });
        if (!user) return res.status(404).send({
            message: 'No se encuentra al usuario en la DB'
        });
        console.log(`El usuario: ${name} ha dejado de segui a: ${user.name}`);
    });

    Follow.find({
        'user': userId,
        'followed': followId
    }).remove((err) => {
        if (err) return res.status(500).send({
            message: 'Error al dejar de seguir el usuario *daleteFollow()'
        });

        return res.status(200).send({
            message: 'El follow se ha borrado exitosamente',
        });
    });
}

//funcion para listar un listado paginado de los usuarios que estamos siguiendo
function getFollowingUsers(req, res) {

    var userId = req.user.sub;
    var page = 1;

    if (req.params.id && req.params.page) {
        userId = req.params.id;
    }

    if (req.params.page) {
        page = req.params.page;
    }

    var itemsPerPage = 4;
    /* aqui debemos popular la informacion que hay en  campo followers 
    y cambiar el objectId por el documento correspondiente a ese objectId*/
    Follow.find({
        user: userId
    }).populate({
        path: 'followed'
    }).paginate(page, itemsPerPage, (err, follows, total) => {
        if (err) return res.status(500).send({
            message: 'Error en el servidor *getFollowingUsers()'
        });
        if (!follows) return res.status(404).send({
            message: 'NO esta siguiendo ningun usuario'
        });

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total / itemsPerPage),
            follows
        });
    });

}

//funcion para listar los usuarios que siguen al usuario loggueado
function getFollowedUsers(req, res) {
    var userId = req.user.sub;
    var page = 1;

    if (req.params.id && req.params.page) {
        userId = req.params.id;
    }

    if (req.params.page) {
        page = req.params.page;
    } else {
        page = req.params.id;
    }

    var itemsPerPage = 4;

    Follow.find({
        followed: userId
    }).populate('user followed').paginate(page, itemsPerPage, (err, follows, total) => {
        if (err) return res.status(500).send({
            message: 'Error en el servidor *getFollowingUsers()'
        });
        if (!follows) return res.status(404).send({
            message: 'NO te esta siguiendo ningun usuario!'
        });

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total / itemsPerPage),
            follows
        });
    });

}

//funcion para devolver usuarios
function getMyFollows(req, res) {
    var userId = req.user.sub;

    var find = Follow.find({user: userId});

    if(req.params.followed){
        find = Follow.find({followed : userId});
    }

    find.populate('user followed').exec((err, follows) => {
        if (err) return res.status(500).send({
            message: 'Error en el servidor *getMyFollows()'});
        if (!follows) return res.status(404).send({
            message: 'NO te esta siguiendo ningun usuario! getMyFollows()'});

        return res.status(200).send({follows});
    });
}

module.exports = {
    saveFollow,
    deleteFollow,
    getFollowingUsers,
    getFollowedUsers,
    getMyFollows
}
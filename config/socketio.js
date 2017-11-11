'use strict';
const config = require('../config');
const Users = require('../app/models/users.js');
const Dialogs = require('../app/models/dialogs.js');
const Messages = require('../app/models/messages.js');
const socketioJwt  = require("socketio-jwt");

module.exports = function (io) {

    io.sockets.on('connection', socketioJwt.authorize({
      secret: config.session.secret,
      timeout: 15000 // 15 seconds to send the authentication message
    })).on('authenticated', function(socket) {

        let user = socket.decoded_token;
        
        socket.emit('me', user);

        Dialogs.getDialogs(user.id)
            .then(function(data){
                socket.emit('isdialogs', data.dialogs);
                socket.emit('last_messages', data.messages);
            });

        Users.getContacts(user.id)
            .then(function(contacts){
                socket.emit('contacts',contacts);
            });
        
        // *************************************//
        socket.on('new_message', function(data, cb){
           Object.assign(data,{from:user.id})

            Messages.addMessage(data)
                .then(function(res){
                    cb(res);
                })
                .catch(function(err){
                    console.log(err);
                });
        });

        socket.on('dialog_messages', function(data, cb){
            Messages.getLastMessages(data.did)
                .then(function(messages){
                    cb(messages);
                })
                .catch(function (err) {
                    console.log(err);
                });
        });

        socket.on('add_contact', function(cid, cb){
            Users.addContact(cid, user.id)
                .then(function(){
                    Users.getUserInfo(cid)
                        .then(function(user){
                            cb(user)
                        });
                })
        });

        socket.on('remove_contact', function(cid, cb){
            Users.removeContact(cid, user.id)
                .then(function(){
                    cb(cid)
                });
        });
        
        socket.on('new_dialog', function(uid, cb){
            Dialogs.searchByUserId(uid, user.id)
                .then(function(res){
                    console.log(res);
                    if(res){
                        if(res instanceof Array){
                            Dialogs.addDialogsIdToUser(res[0], user.id).then(function(did){
                                cb(did)
                            })
                        }else{
                            cb(res)
                        }
                    }else{
                       Dialogs.addDialog(uid, user.id).then(function(did){
                            cb(did)
                        });
                    }
                });
        });

        socket.on('profile', function(id, cb){
            Users.getUserInfo(id)
                .then(function(user){
                    cb(user)
                });
        });

        socket.on('find', function(data, cb){
            Users.findByNameOrLastName(data)
                .then(function(users){
                    console.log(users);
                    cb(users);
                });
        });

        socket.on('disconnect', function () {
            io.emit('user disconnected');
        });
    });

};
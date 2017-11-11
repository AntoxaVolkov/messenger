const r = require('rethinkdb')
, config = require('../../config')
, path = require('path')
, bcrypt  = require('bcrypt')
, logdebug = require('debug')('rdb:debug')
, logerror = require('debug')('rdb:error')
, onConnect = require(path.join(config.root,'config','db'));


const Dialog = function(users, title){
    let usersObj = new Array();

    for(let i =0; i < users.length; i++){
        usersObj.push({
            userId: users[i],
            ts: new Date().getTime(),
            unread:0,
            unreadStart: null
        });
    }

    if(title){
        return {
            type: 'public',
            users: usersObj,
            last: null,
            title: title
        }
    }else{
        return {
            type: 'private',
            users: usersObj,
            last: null
        }
    }
    
}

const Dialogs = {
    addDialog(uid, from){
        let connection, did, dialog = new Dialog([uid, from]);

        return onConnect()
            .then(function(conn){
                connection = conn;
                logdebug("[INFO ][%s][addDialog] {user: %s}", connection['_id'], from);
                return r.table('dialogs')
                    .insert(dialog)
                    .run(connection)
            })
            .then(function(res){
                did = res.generated_keys[0];

                return r.table('users')
                    .get(from)
                    .update({dialogs: r.row('dialogs').append(did)})
                    .run(connection)
            })
            .then(function(res){
                return did;
            })
    },
    addDialogsIdToUser(did,uid){
        let connection;
        return onConnect()
        .then(function(conn){
            connection = conn;
            logdebug("[INFO ][%s][addDialogsIdToUser] {user: %s}", connection['_id'], uid);
            return r.table('users')
                .get(uid)
                .update({dialogs: r.row('dialogs').append(did)})
                .run(connection)
        })
        .then(function(res){
            return did;
        })
    },
    searchByUserId(uid, from){
        let connection, dialogs, did;
        return onConnect()
        .then(function(conn){
            connection = conn;
            logdebug("[INFO ][%s][searchByUserId] {user: %s}", connection['_id'], uid);
            return r.table('dialogs')
                .filter(function(dialog){
                    return dialog('type')
                            .eq('private')
                            .and(dialog('users')(0)('userId')
                                .eq(uid).and(dialog('users')(1)('userId')
                                    .eq(from)))
                            .or(dialog('type')
                                .eq('private')
                                .and(dialog('users')(0)('userId')
                                    .eq(from).and(dialog('users')(1)('userId')
                                        .eq(uid))))
                })
                .run(connection)
        })
        .then(function(cursor){
            return cursor.toArray();
        })
        .then(function(res){
            console.log(res);
            if(res.length > 0){
                did = res[0].id
                logdebug("[INFO ][%s][searchByUserId][2] {user: %s}", connection['_id'], uid);
                return r.table('users').get(from)('dialogs').filter(function(uid){
                    return uid.eq(did)
                    }).run(connection)
            }else{
                return false
            }
                
        })
        .then(function(res){
            console.log(res,did);
            if(res instanceof Array && res.length > 0){
                return did;
            }else if (res instanceof Array && res.length == 0){
                return [did];
            }else{
                return false;
            }
        })
    },
    getDialogs(uid){
        let connection, dialogs, dlist = new Array();
        
        return onConnect()
            .then(function(conn){
                connection = conn;
                logdebug("[INFO ][%s][getDialogs] {user: %s}", connection['_id'], uid);
                return r.table('dialogs')
                    .getAll( r.args( r.table('users')
                        .get(uid)('dialogs')))
                    .merge(function(dialog){
                        return { users: dialog('users')
                            .merge(function(user){
                                return {
                                    user: r.table('users')
                                        .get(user('userId'))
                                        .pluck('id','name', 'lastname', 'email', 'photo')
                                }
                            })
                        }
                    })
                    .run(connection)
            })
            .then(function(cursor){
                return cursor.toArray();
            })
            .then(function(result){
                logdebug("[INFO ][%s][getDialogs][2] {user: %s}", connection['_id'], uid);
                dialogs = result;
                return r.table('messages')
                    .getAll( r.args( r.table('users')
                        .get(uid)('dialogs') ) )
                    .run(connection)
            })
            .then(function(cursor){
                return cursor.toArray();
            })
            .then(function(result){
                return {
                 dialogs: dialogs,
                 messages: result 
                }
            })
    }
}

module.exports = Dialogs;
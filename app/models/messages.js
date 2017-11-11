const r = require('rethinkdb')
    , config = require('../../config')
    , path = require('path')
    , bcrypt = require('bcrypt')
    , logdebug = require('debug')('rdb:debug')
    , logerror = require('debug')('rdb:error')
    , onConnect = require(path.join(config.root, 'config', 'db'));


const Message = function (data) {
    let message = {
        text: null,
        dialog_id: null,
        from: null,
        remove: new Array(),
        ready: false,
        ts: new Date().getTime()
    }

    Object.assign(message, data);

    return message;
}

const Messages = {
    addMessage(data) {
        let connection;
        return onConnect()
            .then(function (conn) {
                connection = conn;
                
                console.log(data)
                logdebug("[INFO ][%s][addMessage] {user: %s, dialog: %s}", connection['_id'], data.from, data.dialog_id);
                let message = new Message(data);
                console.log(data)
                return r.table('messages')
                    .insert(message)
                    .do(function (doc) {
                        return r.branch(doc('inserted').ne(0),
                            r.table('dialogs')
                            .get(data.dialog_id)
                            .update(function(row){
                                return {
                                    users: row('users')
                                        .merge(function (user) {
                                            return r.branch(user('userId')
                                                .ne(data.from),
                                                {
                                                    unreadStart: r.branch(user('unread').eq(0),
                                                        doc('generated_keys')(0),
                                                        user('unreadStart')
                                                    ),
                                                    unread: user('unread').add(1)

                                                },
                                                {}
                                            )
                                        }),
                                    last: doc('generated_keys')(0)
                                }
                            }, {returnChanges:true}).do(function(doc2){
                                return r.table('users').getAll(r.args(doc2('changes')(0)('new_val')('users').map(function(user){return user('userId');})))
                                        .filter(function(user){
                                            return user('dialogs').contains(data.dialog_id).not();
                                        })
                                        .update(function (user) {
                                            return { dialogs: user('dialogs').append(data.dialog_id) };
                                        });   
                            }),
                            r.table('messages').get(doc('generated_keys')(0)).delete()
                        )
                    })
                    .run(connection)
            })
            .then(function (res) {
                res = res.updated;
                return res
            })
    },
    getLastMessages(did){
        let connection;
        return onConnect()
            .then(function (conn) {
                connection = conn;

                logdebug("[INFO ][%s][getLastMessages] { dialog: %s }", connection['_id'], did);
                return r.table('messages').filter({ dialog_id: did }).orderBy(r.desc('ts')).limit(20).orderBy(r.asc('ts')).run(connection)
            })
    }

}

module.exports = Messages;
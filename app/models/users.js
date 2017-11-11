const r = require('rethinkdb')
, config = require('../../config')
, path = require('path')
, bcrypt  = require('bcrypt')
, logdebug = require('debug')('rdb:debug')
, logerror = require('debug')('rdb:error')
, onConnect = require(path.join(config.root,'config','db'))
, mail = require(path.join(config.root, 'app', 'lib', 'mail'))
, passwordHash = require('bcrypt')
, nodemailer = require('nodemailer');


const NewUser = function(data){
  let user = { 'name' : null,
    'lastname' : null,
    'email' : null,
    'photo' : null,
    'password' : null,
    'dialogs' : new Array(),
    'e_verified': false,
    'e_token' : null,
    'r_token' : null,
    'e_timestamp' : null,
    'r_timestamp' : null,
    'o_timestamp' : null,
    'contacts' : new Array()
  }

  user.name = data.name;
  user.lastname = data.lastname;
  user.email = data.email;
  user.photo = data.photo;

  return bcrypt.hash(data.password, 10)
    .then(function(hash){
      user.password = hash;
      logdebug("[INFO][User][bcrypt.hash] %s:%s\n%s", user.name, user.email, hash);
      return user;
    }).catch(function(err){
      logerror("[ERROR][User][bcrypt.hash] %s:%s\n%s", err.name, err.msg, err.message);
      throw err;
    });
}

//////////////////////////////////
function RegistrationError(msg) {
  this.name = "RegistrationError";
  this.message = msg || 'Error registration';
  this.code = "ERROR_REGISTRATION";
}

RegistrationError.prototype = Object.create(Error.prototype);
RegistrationError.prototype.constructor = RegistrationError;
//////////////////////////////////
function EmailError(msg) {
  this.name = "EmailError";
  this.message = msg || 'Email address is already registered';
  this.code = "EMAIL_CONFLICT";
}

RegistrationError.prototype = Object.create(Error.prototype);
RegistrationError.prototype.constructor = RegistrationError;
//////////////////////////////////
function TokenError(msg) {
  this.name = "TokenError";
  this.message = msg || 'Token error';
  this.code = "TOKEN_WRONG";
}

TokenError.prototype = Object.create(Error.prototype);
TokenError.prototype.constructor = TokenError;
//////////////////////////////////
function LoginError(msg) {
  this.name = "LoginError";
  this.message = msg || 'Email or password wrong';
  this.code = "EMAIL_OR_PASSWORD_WRONG";
}

TokenError.prototype = Object.create(Error.prototype);
TokenError.prototype.constructor = TokenError;
//////////////////////////////////

function rand(n){ 
  var s ='', abd ='abcdefghijklmnopqrstuvwxyz0123456789', aL = abd.length;
  while(s.length < n)
    s += abd[Math.random() * aL|0];
  return s;
}

const User = {
  identification(email){
    let connection;
    return onConnect()
      .then( // Ищем совпадение по email
        function(conn){
            connection = conn;
            logdebug("[INFO ][%s][identification] Id {user: %s}", connection['_id'], email);
            return r.table('users').filter({'email': email}).limit(1).run(connection)
        },
        function(err){ // Ошибка onConnect
          throw err;
        })
      .then( //
        function(cursor){ // 
          logdebug("[INFO ][%s][identification][cursor.next] Id {user: %s}", connection['_id'], email);
          return cursor.next()
        },
        function(err){ // Ошибка при попытке найти совпадение по email
          if(err.code != 'ERROR_DB_CONN'){
            logerror("[ERROR][%s][identification][filter] %s:%s\n%s", connection['_id'], err.name, err.msg, err.message);
          }
          throw err;
        }
      )
      .then( // Возращаем обект пользователя и закрываем соединение с БД
        function(user){
          logdebug("[INFO ][%s][identification][get user] Id {user: %s}", connection['_id'], email);
          connection.close(); // Возможно после закрытия объект юзер пропадет, проверить
          return user;
        },
        function(err){ // Нет совпадений
          if(err.code != 'ERROR_DB_CONN'){
            logerror("[ERROR][%s][identification][cursor.next] %s:%s\n%s", connection['_id'], err.name, err.msg, err.message);
            if(connection) connection.close();
          }
          return null;
        }
      );
  },
  findById(id){
    let connection;
    return onConnect()
      .then( // Ищем совпадение по id
        function(conn){
            connection = conn;
            logdebug("[INFO ][%s][findById] fbId {user: %s}", connection['_id'], id);
            return r.table('users').get(id).pluck('id','name', 'lastname', 'email', 'photo', 'e_verified').run(connection)
        },
        function(err){ // Ошибка onConnect
          throw err;
        }
      )
      .then(  // Возращаем обект пользователя и закрываем соединение с БД
        function(user){
          if(connection) connection.close();
          return user;

        },
        function(err){ // Возращаем обект пользователя и закрываем соединение с БД
          if(err.code != 'ERROR_DB_CONN'){
            logerror("[ERROR][%s][findById][collect] %s:%s\n%s", connection['_id'], err.name, err.msg, err.message);
          }
          throw err;
        }
      );

  },
  getUserInfo(id){
    let connection;
    return onConnect()
      .then( // Ищем совпадение по id
        function(conn){
            connection = conn;
            logdebug("[INFO ][%s][findById] fbId {user: %s}", connection['_id'], id);
            return r.table('users').get(id).pluck('id','name', 'lastname', 'email', 'photo').run(connection)
        }
      )
      .then( 
        function(user){
          if(connection) connection.close();
          return user;

        },
        function(err){
          if(err.code != 'ERROR_DB_CONN'){
            logerror("[ERROR][%s][findById][collect] %s:%s\n%s", connection['_id'], err.name, err.msg, err.message);
          }
          throw err;
        }
      );

  },
  verify(id, token){
    let connection, user;
    return onConnect()
      .then( // Ищем совпадение по id
        function(conn){
            connection = conn;
            logdebug("[INFO ][%s][findById] fbId {user: %s}", connection['_id'], id);
            return r.table('users').get(id).pluck('e_token', 'e_timestamp').run(connection)
        }
      )
      .then(
        function(user){
          if(new Date().getTime() < new Date(user.e_timestamp).getTime()){
            return bcrypt.compare(token, user.e_token);
          } 
          throw new TokenError('Token expired');

        },
        function(err){ 
          if(err.code != 'ERROR_DB_CONN'){
            logerror("[ERROR][%s][findById][collect] %s:%s\n%s", connection['_id'], err.name, err.msg, err.message);
          }
          if(connection) connection.close();
          throw err;
        }
      )
      .then(
        function(){
          return r.table('users').get(id).update({e_token: null, e_timestamp:null, e_verified: true}).run(connection);
        },
        function(err){
          throw err;
        }
      )
      .then(
        function(res){
          console.log(res.replaced);
          if(res.replaced) return true;
          throw new TokenError('Error server');
        },
        function(err){
          throw err;
        }
      );

  },
  newPass(id, token, pass){
    let connection, user;
    return onConnect()
      .then( 
        function(conn){
            connection = conn;
            logdebug("[INFO ][%s][findById] fbId {user: %s}", connection['_id'], id);
            return r.table('users').get(id).pluck('r_token', 'r_timestamp').run(connection)
        }
      )
      .then(  
        function(user){
          if(new Date().getTime() < new Date(user.r_timestamp).getTime()){
            return bcrypt.compare(token, user.r_token);
          } 
          throw new TokenError('Token expired');

        }
      )
      .then(
        function (){
          return bcrypt.hash(pass, 10);
        }
      )
      .then(
        function(hash){
          return r.table('users').get(id).update({r_token: null, r_timestamp:null, password: hash}).run(connection);
        }
      )
      .then(
        function(res){
          console.log(res.replaced);
          if(res.replaced) return true;
          throw new TokenError('Error server');
        }
      )
      .catch(function (err){
        throw err;
      });

  },
  reset(email){
    let uid, r_token, r_timestamp,connection;
    return this.identification(email)
      .then(function(u){
        uid = u.id;
        user = u;
        r_token = rand(32);
        return onConnect();
      }).then(function(conn){
        connection = conn;
        return bcrypt.hash(r_token, 10);
      }).then(function(hashToken){
        r_timestamp = new Date(new Date().getTime() + 1000 * 60 * 60 *24);
        return r.table('users').get(uid).update({r_token: hashToken, r_timestamp:r_timestamp}).run(connection);
      }).then(function(res){
        if(res.replaced){
          let link = config.server.protocol + config.server.host + ':' + config.server.port + '/reset/' + uid + '/' + r_token;
          let msg = {
            to: user.email,
            subject: 'Подтверждение сброса пароля ✔',
            html: '<p>Доброго времени суток, ' +  user.name + '!</p>'
                + '<p>Ваша ссылка для подтверждения сброса пароля в AVMesseger:</p>'
                + '<p><a href="'+link+'">'+link+'</a></p>'
                + '<p>Если вы не сбрасывали пароль, то удалите данное письмо.</p>'
          }
          return mail.sendMail(msg);
        }
        throw new TokenError('Error creted password token reset');
      }).then(function(){
        return true;
      }).catch(function (err){
        console.log(err);
        throw err;
      });
  },
  authentication(password, user){
    return bcrypt.compare(password, user.password)
      .then(function(res){
        logdebug("[INFO ][authentication] User {id: %s}", user.id);
        if(res) return true;
        throw new LoginError();
      })
      .catch(function(err){
        logerror("[ERROR][authentication][compare] %s:$s\n%s", err.name );
        throw err;
      });
  },
  saveUser(data){
    let connection, newuser, e_token, link, msg, uid;

    return this.identification(data.email)
      .then(
        function(user){
          if(user){
            throw new EmailError;
          }
          return NewUser(data);
        },
        function(err){
          logerror("[ERROR][saveUser][identification] %s:%s\n%s", err.name, err.msg, err.message);
          throw err;
        }
      )
      .then(
        function(user){
          newuser = user;
          e_token = rand(32);
          
          return bcrypt.hash(e_token, 10);
        },
        function(err){
          logerror("[ERROR][saveUser][NewUser] %s:%s\n%s", err.name, err.msg, err.message);
          throw err;
        }
      )
      .then(
        function(hashToken){
          newuser.e_token = hashToken;
          newuser.e_timestamp = new Date(new Date().getTime() + 1000 * 60 * 60 *24);

          return onConnect();
        },
        function(err){
          logerror("[ERROR][saveUser][hashToken][bcrypt] %s:%s\n%s", err.name, err.msg, err.message);
          throw err;
        }
      )
      .then(
        function(conn){
          connection = conn;
          logdebug("[INFO][%s][saveUser] Save {user: %s}", connection['_id'], data.name);
          return r.table('users').insert(newuser).run(connection);
        },
        function(err){
          throw err;
        }
      )
      .then(
        function(res){
          uid = res.generated_keys[0]
          connection.close();
          let link = config.server.protocol + config.server.host + ':' + config.server.port + '/verify/' + uid + '/' + e_token;
          let msg = {
            to: newuser.email,
            subject: 'Подтверждение почты ✔',
            html: '<p>Доброго времени суток, ' +  newuser.name + '!</p>'
                + '<p>Ваша ссылка для подтверждения регистрации в AVMesseger:</p>'
                + '<p><a href="'+link+'">'+link+'</a></p>'
                + '<p>Если вы не регистрировались в нашем сервисе, то просто удалите данное письмо.</p>'
          }
          return mail.sendMail(msg);
        },
        function(err){
          if(err.code != 'ERROR_DB_CONN', err.code != 'EMAIL_CONFLICT'){
            //logerror("[ERROR][%s][saveUser][insert] %s:$s\n%s", connection['_id'], err.name, err.msg, err.message );
          }
          if(connection) connection.close();
          throw err;
        }
      )
      .then(
        function(info){
          logdebug("[INFO][saveUser][sendemail]");
          return uid;
        },
        function(err){
          logerror("[ERROR][saveUser][sandMail] %s:$s\n%s", err.name, err.msg, err.message );
          throw err;
        }
      );
  },
  generatedEmailVerifyCode(user){

    let e_token = rand(32);
    let connection;
    return onConnect()
      .then(function(conn){
        connection = conn;
        return bcrypt.hash(e_token, 10);
      })
      .then(function(hashToken){
        return r.table('users').get(user.id).update({
          e_token: hashToken,
          e_timestamp: new Date(new Date().getTime() + 1000 * 60 * 60 *24)
        }).run(connection);
      }).then(function(res){
        uid = user.id
        connection.close();
        let link = config.server.protocol + config.server.host + ':' + config.server.port + '/verify/' + uid + '/' + e_token;
        let msg = {
          to: user.email,
          subject: 'Подтверждение почты ✔',
          html: '<p>Доброго времени суток, ' +  user.name + '!</p>'
              + '<p>Ваша ссылка для подтверждения регистрации в AVMesseger:</p>'
              + '<p><a href="'+link+'">'+link+'</a></p>'
              + '<p>Если вы не регистрировались в нашем сервисе, то просто удалите данное письмо.</p>'
        }
        return mail.sendMail(msg);
      })
      .then(function(){
        return true;
      })
      .catch(function(err){
        if(connection) connection.close();
        throw err;
      });
  },
  findByNameOrLastName(data){
    let connection, found = data.found, query = data.query.split(' ');
    return onConnect()
      .then(function(conn){
        connection = conn;
        logdebug("[INFO ][%s][findByNameOrLastName] {str: %s}", connection['_id'], query);
        return r.table('users').filter(function(doc){
            //Доделать поиск по нескольким словам
            if(query.length == 1){
                return doc('name')
                  .match('(?i)'+query[0])
                  .or(doc('lastname')
                    .match('(?i)'+query[0]))
                  .or(doc('email')
                    .match('(?i)'+query[0]))
                  .and(r.expr(found).filter(function(row){
                    return row.eq(doc('id'))
                  }).count().eq(0))
            }else{
                let result = true;
                for(let i = 0; i < query.length; i++ ){
                    result = result && (doc('name')
                      .match('(?i)'+query[i])
                      .or(doc('lastname')
                        .match('(?i)'+query[i])))
                        .and(r.expr(found).filter(function(row){
                          return row.eq(doc('id'))
                        }).count().eq(0))
                }
                return result;
            }
            //return doc('name').match('(?i)'+str).or(doc('lastname').match('(?i)'+str)).or(doc('email').match('(?i)'+str))
        })
        .limit(10)
        .pluck('id','name', 'lastname', 'email', 'photo', 'e_verified').run(connection)
      })
      .then(
        function(cursor){
          if(connection) connection.close();
          return cursor.toArray();

        },
        function(err){
          if(err.code != 'ERROR_DB_CONN'){
            logerror("[ERROR][%s][findByNameOrLastName][collect] %s:%s\n%s", connection['_id'], err.name, err.msg, err.message);
          }
          throw err;
        }
      )
      .then(function(users){
         if(connection) connection.close();
         return users;
      });

  },
  getContacts(uid){
    let connection;
    return onConnect()
      .then(
        function(conn){
            connection = conn;
            logdebug("[INFO ][%s][getContacts] {user: %s}", connection['_id'], uid);
            return r.table('users').get(uid)('contacts').map(function(contact){
              return r.table('users').get(contact).pluck('id','name', 'lastname', 'email', 'photo');
            }).run(connection)
        }
      )
      .then(
        function(contacts){
          if(connection) connection.close();
          return contacts;

        },
        function(err){ 
          if(err.code != 'ERROR_DB_CONN'){
            logerror("[ERROR][%s][getContacts][collect] %s:%s\n%s", connection['_id'], err.name, err.msg, err.message);
          }
          throw err;
        }
      );
  },
  addContact(cid,uid){
    let connection;
    return onConnect()
      .then(function(conn){
        connection = conn;
        logdebug("[INFO ][%s][addContact] {user: %s}", connection['_id'], uid);
        return r.table('users')
          .get(uid)
          .update({contacts:r.row('contacts').prepend(cid)})
          .run(connection)
      })
  },
  removeContact(cid,uid){
    let connection;
    return onConnect()
      .then(function(conn){
        connection = conn;
        logdebug("[INFO ][%s][removeContact] {user: %s}", connection['_id'], uid);
        return r.table('users')
          .get(uid)
          .update({contacts:r.row('contacts').deleteAt(r.row('contacts').offsetsOf(cid)(0))})
          .run(connection)
      })
      .then(function(res){
        console.log(res);
        return true;
      })
  }

}

module.exports = User;
  
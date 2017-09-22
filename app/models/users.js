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
    'o_timestamp' : null
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
  authentication(password, user){
    return bcrypt.compare(password, user.password)
      .then(function(res){
        // Поправить логер, не от дб
        logdebug("[INFO ][authentication] User {id: %s}", user.id);
        return true;
      })
      .catch(function(err){
        // Поправить логер, не от дб
        logerror("[ERROR][authentication][compare] %s:$s\n%s", err.name );
        return false;
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
  }

}

module.exports = User;
  
let r = require('rethinkdb')
    , logdebug = require('debug')('rdb:debug')
    , logerror = require('debug')('rdb:error')
    , confDB =   require('./../config').db;

let dbConfig = {
    host: confDB.host ,
    port: confDB.port  || 28015,
    db  : confDB.db || 'messenger'
  };

//////////////////////////////////
function DBError(msg) {
  this.name = "DatabaseError";
  this.message = msg || 'Error connecting to database';
  this.code = "ERROR_DB_CONN";
}

DBError.prototype = Object.create(Error.prototype);
DBError.prototype.constructor = DBError;
//////////////////////////////////

module.exports = function () {

  // Нужно ли создавать промис? Или функция возращает результат с промисам?
  return r.connect({host: dbConfig.host, port: dbConfig.port, db: dbConfig.db }).then(function(connection){
      connection['_id'] = Math.floor(Math.random()*10001);
      logdebug("[INFO ][%s][DB_CONN] Connected to RethinkDB", connection['_id']);
      return connection;
    }).catch(function(err){
      logerror("[ERROR][ERROR_DB_CONN] %s:%s\n%s", err.name, err.msg, err.message);
      throw new DBError();
    });
}
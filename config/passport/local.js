'use strict';

const LocalStrategy = require('passport-local').Strategy;
const Users = require('../../app/models/users.js');

module.exports = new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  function(email, password, done) {
    return Users.identification(email)
      .then(
        function(user){
          if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
          }
          return done(null, user);
        },
        function(err){
          return done(err);
        }
      )

    /*Users.identification(email, function (err, user) {
      console.log('<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>',user,err);
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!Users.authentication(password, user)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      
      return done(null, user.id);
    });*/
  }
);
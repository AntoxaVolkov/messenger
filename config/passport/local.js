'use strict';

const LocalStrategy = require('passport-local').Strategy;
const Users = require('../../app/models/users.js');

module.exports = new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  function(email, password, done) {
    let user;
    return Users.identification(email)
      .then(
        function(u){
          if (!u) {
            done(null, false, { message: 'Incorrect username.' });
          }
          user = u;
          console.log(user)
          return Users.authentication(password, u);
        },
        function(){
          done(err);
        }
      )
      .then(
        function(){
          console.log('auth true')
          return Users.findById(user.id)
        },
        function(err){
          done(err);
        }
      )
      .then(
        function(u){
          console.log(u)
           done(null, u);
        },
        function(err){
            done(err);
        }
      );

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
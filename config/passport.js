'use strict';
const Users = require('../app/models/users.js');
const local = require('./passport/local');

module.exports = function (passport) {

  // serialize sessions
  /*
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser((id, done) => {
    console.log('deserializeUser');
    Users.findById(id)
      .then(function(user){
        done(null,user)
      },
      function(err){
        done(err);
      });
  });
*/
  // use these strategies
  passport.use(local);
};
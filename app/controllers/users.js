'use strict';

const { wrap: async } = require('co');
const User = require('../models/users');
const v = require('../lib/validation');


exports.create = async(function* (req, res){
    let errors = v.createUserValidation(req.query);

    if(errors){
        res.json(errors);
    }

    try{
        let uid = yield User.saveUser(req.query);
        let user = yield User.findById(uid);
        // Заменить на промис
        yield new Promise(function(resolve, reject){
            req.logIn(user, function(err) {
                if (err) { reject(err); }
                resolve(true)
            });
        });

        return res.json({auth:req.isAuthenticated(), verified: user.e_verified, user: user});
        
        
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
    

    
});

exports.logout = function (req, res) {
    req.logout();
    res.json({auth:false});
  };
  
exports.login = function (req, res) {
    res.json({auth:true});
}
  
exports.test = function (req, res) {
    res.json({auth:true, pages: 'test'});
}
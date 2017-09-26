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

exports.verify = async(function* (req, res) {
    try{
        let id = req.params.id;
        let token = req.params.token;
        yield User.verify(id, token);
        res.send('Почта подтверждена!');
    } catch(err){
        res.status(401).json(err)
    }
    
    
});

exports.reset = async(function* (req, res) {
    try{
        if(req.query.id && req.query.token && req.query.pass){
            let id = req.params.id;
            let token = req.params.token;
            let pass = req.params.pass;
            yield User.newPass(id, token, pass);
            res.send('Пароль изменён!');
        }else if(req.query.email){
             yield User.reset(req.query.email);
            res.json({reset:true});
        }else{
           res.render("reset.hbs",req.params);
        }
        
    }catch(err){
        res.status(401).json(err);
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
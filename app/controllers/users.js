'use strict';

const config = require('../../config');
const { wrap: async } = require('co');
const User = require('../models/users');
const v = require('../lib/validation');
const jwt = require('jsonwebtoken')


exports.create = async(function* (req, res){
    let errors = v.createUserValidation(req.body);
    console.log(errors);
    if(errors){
        res.status(400).json(errors);
    }else{

        try{
            let uid = yield User.saveUser(req.body);
            let user = yield User.findById(uid);
            // Заменить на промис
            let token = yield new Promise(function(resolve, reject){
                jwt.sign(user, config.session.secret, function(err, token){
                    if (err) { reject(err);}
                    resolve(token)
                });
            });

            return res.json({token: token, not_verified: !user.e_verified, user: user});
            
            
        }catch(err){
            console.log(err);
            res.status(500).json(err);
        }
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

exports.verifyReset = async(function* (req, res) {
    try{
        yield User.generatedEmailVerifyCode(req.user);
        res.json({status:'ok'});
    } catch(err){
        res.status(401).json(err)
    }
    
    
});

exports.reset = async(function* (req, res) {
    try{
        if(req.body.id && req.body.token && req.body.pass){
            let id = req.body.id;
            let token = req.body.token;
            let pass = req.body.pass;
            yield User.newPass(id, token, pass);
            res.json({status:'ok'});
        }else if(req.body.email){
            if(!v.checkEmail(req.body.email)){
                yield User.reset(req.body.email);
                res.json({status:'ok'});
            }else{
                res.status(400).json({error:true});
            }
            
        }else{
            res.status(404).json({error:true});
        }
        
    }catch(err){
        res.status(400).json(err);
    }
    
    
});


exports.resetStart = async(function* (req, res) {
    try{
        res.render("reset.hbs",req.params);
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

exports.me= async(function* (req, res){
    try{

        return res.json(req.user);
        
        
    }catch(err){
        res.status(500).json(err);
    }
    

    
});
'use strict';
const logdebug = require('debug')('auth:debug')
const logerror = require('debug')('auth:error')
/*
exports.requiresLogin = function (req, res, next) {
    if (req.isAuthenticated()) return next();
    // сделать проверку подтверждённого адреса почты
    /*
    if(!req.user.e_verified) res.status(401).json({auth:true, verified:false})
    *//*
    res.status(401).json({auth:false});
};

exports.authenticate = function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        console.log('Я тут',err,user,info);
        if (err) { return res.json(err); }
        if (!user) { return res.json({auth:false}); }
        if (!user.e_verified){return res.json({auth:true, verified: false});}
        return next();
    })(req, res, next);
};
*/
module.exports = function(passport){
    return {
        requiresLogin(req, res, next) {
            logdebug("[INFO][Auth][requiresLogin] is %s",req.isAuthenticated() );
            if (req.isAuthenticated()){
                if(!req.user.e_verified) return res.status(401).json({auth:req.isAuthenticated(), verified:req.user.e_verified});
                return next();
            }
            res.status(401).json({auth:false});
        },
        authenticate(req, res, next) {
            passport.authenticate('local', function(err, user, info) {
                if (err) { return res.json(err); }
                if (!user) { return res.json({auth:false}); }
                req.logIn(user, function(err) {
                    if (err) { return res.json(err); }
                    return res.json({auth:req.isAuthenticated(), verified: user.e_verified});
                });
                //return next();
            })(req, res, next);
        }
    };
}
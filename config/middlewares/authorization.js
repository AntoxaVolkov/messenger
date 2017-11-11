'use strict';
const config = require('../../config');
const logdebug = require('debug')('auth:debug')
const logerror = require('debug')('auth:error')
const User = require('../../app/models/users')
const jwt = require('jsonwebtoken')
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

            let token = req.body.token || req.query.token || req.headers['x-access-token'];

            logdebug("[INFO][Auth][requiresLogin] is %s",token );
            if (token){
                jwt.verify(token, config.session.secret, function(err, currentUser) {  
                    if (err) {
                      return res.status(403).json({ success: false, message: 'Failed to authenticate token.' });    
                    } else {
                        User.findById(currentUser.id)
                            .then(function(user){
                                if(user.e_verified){
                                    req.user = user;    
                                    next();
                                }else{
                                    res.json(user);
                                }

                            })
                            .catch(function(err){
                                return res.status(404).json({ success: false, message: 'User not found.' });
                            });
                      
                    }
                });
            }else{
                return res.status(403).json({ 
                    success: false, 
                    message: 'No token provided.' 
                });
            }
            
        },
        requiresLoginWithoutVerify(req, res, next) {

            let token = req.body.token || req.query.token || req.headers['x-access-token'];

            logdebug("[INFO][Auth][requiresLogin] is %s",token );
            if (token){
                jwt.verify(token, config.session.secret, function(err, currentUser) {  
                    if (err) {
                      return res.status(403).json({ success: false, message: 'Failed to authenticate token.' });    
                    } else {
                        req.user = currentUser;
                        next();
                    }
                });
            }else{
                return res.status(403).json({ 
                    success: false, 
                    message: 'No token provided.' 
                });
            }
            
        },
        authenticate(req, res, next) {
            passport.authenticate('local', { session: false }, function(err, user, info) {
                if (err) { return res.status(401).json(err); }
                if (!user) { return res.status(401).json({auth:false}); }
                jwt.sign(user,config.session.secret, function(err, token){
                    console.log(err);
                    logdebug("[INFO][JWT][Singn] callback function start");
                    if (err) { return res.json(err); }
                    logdebug("[INFO][Auth][requiresLogin] is %s",token );
                    res.json({token: token, verified: user.e_verified});
                });
                //return next();
            })(req, res, next);
        }
    };
}
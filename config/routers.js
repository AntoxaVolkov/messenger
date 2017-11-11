'use strict';

const express = require('express');
const users = require('../app/controllers/users');
const files = require('../app/controllers/files');



module.exports = function (app, passport) {

    const auth = require('./middlewares/authorization')(passport);
    const apiRouter = express.Router();

    apiRouter.post('/photo', files.uploadPhoto);

    apiRouter.post('/reg', users.create);
    apiRouter.post('/reset', users.reset);
    apiRouter.post('/ereset', auth.requiresLoginWithoutVerify, users.verifyReset);
    //apiRouter.post('/reset/:id/:token/:pass', users.reset);
    apiRouter.post('/login',auth.authenticate, users.login);
    apiRouter.get('/logout', users.logout);
    apiRouter.get('/me', auth.requiresLogin, users.me);
    apiRouter.get('/test', auth.requiresLogin, users.test);
    

    apiRouter.get('*', function(req,res){
        res.status(404).json({massege:'Not found'});
    });
    app.use("/api", apiRouter);

    app.get("/verify/:id/:token",users.verify);
    app.get('/reset/:id/:token', users.resetStart);
    app.get('/reset', users.resetStart);

}
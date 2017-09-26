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
    apiRouter.post('/reset/:id/:token/:pass', users.reset);
    apiRouter.post('/login',auth.authenticate, users.login);
    apiRouter.get('/logout', users.logout);
    apiRouter.get('/test', auth.requiresLogin, users.test);


    app.use("/api", apiRouter);

    app.get("/verify/:id/:token",users.verify);
    app.get('/reset/:id/:token', users.reset);
    app.get('/reset', users.reset);

}
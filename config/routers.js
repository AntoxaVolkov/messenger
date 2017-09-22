'use strict';

const express = require('express');
const users = require('../app/controllers/users');
const files = require('../app/controllers/files');



module.exports = function (app, passport) {

    const auth = require('./middlewares/authorization')(passport);
    const apiRouter = express.Router();

    apiRouter.post('/photo', files.uploadPhoto);

    apiRouter.post('/reg', users.create);
    apiRouter.post('/login',auth.authenticate, users.login);

    apiRouter.get('/logout', users.logout);
    apiRouter.get('/test', auth.requiresLogin, users.test);


    app.use("/api", apiRouter);

}
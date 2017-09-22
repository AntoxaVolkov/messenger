'use strict';

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('../config');


module.exports = function (app, passport) {
    app.use('photos', express.static(path.join(config.root, 'upload', 'photos')));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(cookieParser());
    app.use(session({ secret: config.session.secret, resave: true, saveUninitialized: true }));
    app.use(passport.initialize());
    app.use(passport.session());
}
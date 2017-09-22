'use strict';

require('dotenv').config();

const express = require('express');
const passport = require('passport');
const config = require('./config');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const path = require('path');


require('./config/passport')(passport);
require('./config/express')(app, passport);
require('./config/routers')(app, passport);



app.get('*', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});


server.listen(config.server.port, function() {
    console.log('Listening on port %d', server.address().port);
});
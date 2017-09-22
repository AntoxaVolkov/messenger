const nodemailer = require('nodemailer');
const {email} = require('../../config');
let transport = {
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true, // use TLS
    auth: {
        user: email.username,
        pass: email.password
    }
};

let defaults = {
    from: 'Antoxa Volkov <antoxa.vol@yandex.ru>'
}

let transporter = nodemailer.createTransport(transport, defaults);

module.exports = transporter;
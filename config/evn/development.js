module.exports = {
    db: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        db: process.env.DB_DATABASE
    },
    server: {
        protocol: 'http://',
        host:'localhost',
        port:8081
    },
    email: {
        username: process.env.MAIL_USERNAME,
        password: process.env.MAIL_PASSWORD
    },
    session: {
        secret: process.env.SESSION_SECRET
    }
};
require('dotenv').config();
const mail = require('../app/lib/mail');

let msg = {
    to: 'm-a-r-v-i-n@mail.ru',
    subject: 'Тест ✔',
    html: '<p>Доброго времени суток</p>'
  }

  mail.sendMail(msg).then(function(info){
    console.log(info);
}).catch(function(err){
    console.log(err);
})
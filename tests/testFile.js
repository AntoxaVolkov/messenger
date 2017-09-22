const fs = require('fs');
const path = require('path');

fs.unlink('qwerty').then(function(){
    console.log('Ok');
}).catch(function(){
    console.log('Error');
    console.log(err);
});
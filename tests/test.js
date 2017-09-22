const User = require('../app/models/users');
console.log(User)
console.log(User.findById('49de8610-67aa-4514-95a3-a523c273ed9d').then(
    function(user){
        console.log(user);
        return user;
    },
    function(err){
        throw err;
    }
));


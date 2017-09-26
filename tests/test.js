const User = require('../app/models/users');
User.authentication('23424','$2a$10$5An4XsifBrduC7Wcbtr.lOM7I.Aq8k2gZMRjIB2L5nVxGqEZVdMO.').then(
    function(user){
        console.log(true);
    },
    function(err){
        throw err;
    }
);


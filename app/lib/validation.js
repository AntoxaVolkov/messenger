'use strict';


const v = require('validator');
exports.validator = v;
exports.createUserValidation = function (user) {
      let error = false;
      let errorFields = [];
      if(typeof user.name == 'undefined' || typeof user.lastname == 'undefined' || typeof user.email == 'undefined' || typeof user.password == 'undefined' || typeof user.photo == 'undefined'){
            error = true;
      }else{
            if(v.isEmpty(user.name) || (!v.isAlpha(user.name, 'ru-RU') && !v.isAlpha(user.name))){
                  error = true;
                  errorFields.push('name');
            }
            
            if(v.isEmpty(user.lastname) || (!v.isAlpha(user.lastname, 'ru-RU') && !v.isAlpha(user.lastname))){
                  error = true;
                  errorFields.push('lastname');
            }
            
            
            if(v.isEmpty(user.email) || !v.isEmail(user.email)){
                  error = true;
                  errorFields.push('email');
            }
            
            if(v.isEmpty(user.password) || !v.isLength(user.password, {min:6,max:32})){
                  error = true;
                  errorFields.push('password');
            }
            
            if(v.isEmpty(user.photo) || !v.matches(user.photo, /(^[a-zA-Z0-9]+([a-zA-Z\_0-9\.-]*))$/)){
                  error = true;
                  errorFields.push('photo');
            }
      }

    
    if(error){
        return {error: true, fields: errorFields};
    }else{
        return false;
    }
};

exports.checkEmail = function(email){
      let error = false;
      if(typeof email == 'undefined'){
            error = true;
      }else{
            if(v.isEmpty(email) || !v.isEmail(email)){
                  error = true;
            }
      }
      return error;
}
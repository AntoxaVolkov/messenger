'use strict';

const { wrap: async } = require('co');
const Files = require('../models/files');
//const v = require('../lib/validation');


exports.uploadPhoto = async(function* (req, res){
   
   try{
      let url = yield Files.uploadPhoto(req,res);
      res.json(url);
   }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
    
});
/* УДАЛИТЬ
exports.create = async(function* (req, res){
    let errors = v.createUserValidation(req.query);

    if(errors){
        res.json(errors);
    }

    
});

exports.logout = function (req, res) {
    req.logout();
    res.json({auth:false});
  };
  
  exports.login = function (req, res) {
    res.json({auth:true});
  }
  */
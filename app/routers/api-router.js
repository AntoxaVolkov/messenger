const express = require('express');

const path = require('path');
const gm = require('gm');
const multer = require('multer');
const v = require('validator');
const wf = require('../lib/wf');
const users = require('../models/users');
const passport = require('passport');

let authenticate = function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    console.log('Я тут',err,user,info);
    if (err) { return res.json(err); }
    if (!user) { return res.json({auth:false}); }
    if (!user.e_verified){return res.json({auth:true, verified: false});}
    return next();
  })(req, res, next);
}

let ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.json({auth:false});
}


//////////////////////////////////
function FileFormatError(file) {
    this.name = "FileFormatError";
    this.message = 'Unavailable file format';
    this.file = file;
    this.code = "UNAVAILABLE_FILE_FORMAT";
}

FileFormatError.prototype = Object.create(Error.prototype);
FileFormatError.prototype.constructor = FileFormatError;
//////////////////////////////////

const uploading = multer({
    dest: path.join(__dirname, 'temp'),
    limits: {fileSize: 10000000, files:10},
    fileFilter: function(req, file, callback){
        let expansion = wf.getExpansion(file.originalname);

        if(file.fieldname == "photo"){
        if(!wf.checkImgExp(expansion)){
            callback(new FileFormatError(file.originalname));
            return;
        }
        }else{
        if(!wf.checkExp(expansion)){
            callback(new FileFormatError(file.originalname));
            return;
        }
        }
        
        callback(null, true);
        return;
    }
});

let photoUpload = uploading.fields([{ name: 'photo', maxCount: 1 }])

/////////////////////////////////

var apiRouter = express.Router();

apiRouter.route("/").get(function(req, res){res.json({"Список товаров":"Тут нет"});});

apiRouter.post('/photo', function(req, res){
          
  photoUpload(req,res, function(err){
    if(err){
      res.status(500).json(err);
    }else{

      console.log(req.files);

      let exp = wf.getExpansion(req.files.photo[0].originalname);
      let uniqName = path.basename(req.files.photo[0].path) + new Date().getTime() + '.' + exp ;

      let newPath = path.join('.', 'upload', 'photos',uniqName);
      let miniPath = path.join('.', 'upload', 'photos','mini', uniqName);

      wf.move(req.files.photo[0].path, newPath, function(err){
        if(err){
          res.status(500).json(err);
        }else{
          gm(newPath).thumb(150, 150, miniPath, 70, function (err) {
            if (err){
              res.json(err);
            } else {
              res.json({url:'/photo/mini/'+uniqName});
            }
          });
        }
      });

    }
  });

});

apiRouter.post('/registration', function(req, res){
  
  let vError = false;
  let errorFields = [];

  if(v.isEmpty(req.query.name) || !v.isAlpha(req.query.name, 'ru-RU')){
        vError = true;
        errorFields.push('name');
  }

  if(v.isEmpty(req.query.lastname) || !v.isAlpha(req.query.lastname, 'ru-RU')){
        vError = true;
        errorFields.push('lastname');
  }
  

  if(v.isEmpty(req.query.email) || !v.isEmail(req.query.email)){
        vError = true;
        errorFields.push('email');
  }

  if(v.isEmpty(req.query.password) || !v.isLength(req.query.password, {min:6,max:32})){
        vError = true;
        errorFields.push('password');
  }

  if(v.isEmpty(req.query.photo) || !v.matches(req.query.photo, /(^[a-zA-Z0-9]+([a-zA-Z\_0-9\.-]*))$/)){
        vError = true;
        errorFields.push('photo');
  }
  
  if(vError){
      res.json({error: true, fields: errorFields});
  }else{

    users.saveUser(req.query, (err, uid) => {
      if(err){
        res.json(err);
      }else{
        users.findById(uid, function (err, user) {
          console.log(uid, err, user)
          if(err){
            res.json(err);
          }else{   
            req.login(user, function(err) {
              if (err) { return res.json(err); }
              return res.json(user);
            });
          }
        });
      }
      
    });
    
  }

});

apiRouter.get('/logout', function(req, res){
  req.logout();
  res.json({status:'ok'});
});

apiRouter.get('/login', authenticate);

apiRouter.get('/test', ensureAuthenticated, function(req, res){
  res.json({auth:true, verified: true});
});

module.exports = apiRouter;
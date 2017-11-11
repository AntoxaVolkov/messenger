'use strict';

const path = require('path');
const gm = require('gm');
const multer = require('multer');
const wf = require('../lib/wf');

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
    dest: path.join('.', 'temp'),
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
// uploading.fields([{ name: 'photo', maxCount: 1 }])(req, res) - что возращает?
const Files = {
    uploadPhoto(req, res){
        let exp, uniqName, newPath, miniPath;
        let middleware = uploading.fields([{ name: 'photo', maxCount: 1 }]);

        return new Promise(function(resolve,reject){
            middleware(req,res, function(err){
                if(err) reject(err);
                resolve();
            });
        }).
        then(
            function(){
                console.log(req.files);
                exp = wf.getExpansion(req.files.photo[0].originalname);
                uniqName = path.basename(req.files.photo[0].path) + new Date().getTime() + '.' + exp ;
          
                newPath = path.join('.', 'upload', 'photos',uniqName);
                miniPath = path.join('.', 'upload', 'photos','mini', uniqName);

                return wf.move(req.files.photo[0].path, newPath);
            },
            function(err){
                throw err;
            }
        )
        .then(
            function(){
                return new Promise(function(resolve, reject){
                    gm(newPath).thumb(150, 150, miniPath, 70, function (err) {
                        if (err){
                            reject(err);
                        } else {
                            resolve({url:'/photos/mini/'+uniqName, file:uniqName});
                        }
                    });
                }) 
            },
            function(err){
                throw err;
            }
        );
    }
}

module.exports = Files;
const fs = require('fs');
const path = require('path');

const validExp = {
    img : ["bmp","gif","jfif","jpg", "png"],
    doc : ["doc","docx","ppt","pps","pot","ppz","pwz","xls","xlsx","pdf","rtf","txt"],
    audio : ["mp3","wav"],
    video : ["mp4","mpeg"],
    other : ["psd"],
    all : [].concat(this.img,this.doc,this.audio,this.video,this.other),
}


const wf = {

    exp: validExp,

    move(oldPath, newPath) {
        
        return new Promise(function(resolve, reject){

            try{
                fs.rename(oldPath, newPath, function (err) {
                    if (err) {
                        if (err.code === 'EXDEV') {
                            copy();
                        } else {
                            reject(err);
                        }
                    }
                    resolve();
                });
            } catch(err){
                reject(err);
            }
            
        
            function copy() {
                var readStream = fs.createReadStream(oldPath);
                var writeStream = fs.createWriteStream(newPath);
        
                readStream.on('error', callback);
                writeStream.on('error', callback);
        
                readStream.on('close', function () {
                    try{
                        fs.unlink(oldPath, function(err){
                            if(err) reject(err);
                            resolve();
                        });
                    } catch(err){
                        reject(err);
                    }
                });
        
                readStream.pipe(writeStream);
            }
        });
    },
    getExpansion(file){
        let arr = file.split('.')
        return arr[arr.length - 1];
    },
    
    checkExp(exp){
        return this.exp.all.indexOf(exp) != -1;
    },

    checkImgExp(exp){
        return this.exp.img.indexOf(exp) != -1;
    }

}



module.exports = wf;

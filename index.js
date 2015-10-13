var es = require('event-stream');
var RcLoader = require('rcloader');
var mkdirp = require('mkdirp');
var exec = require('child_process').exec,
    fs = require('fs');
var fsReaddir = require('fs-readdir');
var im = require('imagemagick');
var folderContents = require('folder-contents');
var jsonfile = require('jsonfile');
var del = require('delete');

var pptpng = function(input, dest, callback) {
    console.log("pptpng", input)
    var output = input;
    var input = output + '.pptx';
    exec('unoconv -f pdf -o ' + output + '.pdf ' + input,
        function(error, stdout, stderr) {
            if (error) {
                callback(error);
                return;
            } else {
                pdf2png(output, dest, function(err) {
                    fs.unlink(output + '.pdf', function(err) {
                        if (err) {
                            console.log(err);
                        }

                    });

                    callback(err);
                });
            }


        });
};


var pdf2png = function(input, dest, callback) {
    console.log("pdf2png", input);
    exec('convert -resize 1024 -density 200 ' + input + '.pdf ' + dest + input + '/' + input + '.png',
        function(error, stdout, stderr) {
            if (error) {
                callback(error);
            } else {
                callback(null);
            }
        });
};

var cresateJSON = function(dest, folderName, format) {
    var options = {
        "path": dest + folderName,
        "separator": ".",
        "recursively": false,
        "method": "simple",
        "useBasePath": true,
        "filter": {
            "extensionIgnore": ["json"],
            "extensionAccept": [],
            "folderIgnore": [],
            "fileIgnore": []
        },
        "date": true, // See doc for patterns and i18n
        "size": true, // See doc for patterns and i18n
        "useFullPath": false
    };
    if(format == 'jpg') options.filter.extensionIgnore = ["png", "json"];
    var jsonResult = folderContents(options);
    var fileDif = dest + folderName + '/' + folderName + '.json'
    var obj = [];
    var reqJSON = {};
    for (var i = 0; i < jsonResult[".files"].length; i++)
        obj.push({
            "name": folderName + '-' + i + '.' + format
        });
    reqJSON.images = obj;

    jsonfile.writeFile(fileDif, reqJSON, function(err) {
        console.error(err)
    })
}


module.exports = function(opts) {
    var format = opts.format;
    if (opts.dest == null) var dest = 'dist/'
    else var dest = opts.dest + '/'
    var rcLoader = new RcLoader('.jsonrc', opts, {
        loader: 'async'
    });

    function modifyFile(file, cb) {
        console.log("file", file.relative);
        if (file.isNull()) return cb(null, file); // pass along
        rcLoader.for(file.path, function(err, opts) {
            if (err) return cb(err);
            if(format == 'jpg') del.sync(dest + file.relative.split(".")[0]);
            mkdirp(dest + file.relative.split(".")[0], function(err) {
                if (err) return cb(err);
                else if (file.relative.split(".")[1] == 'pptx') {
                    pptpng(file.relative.split(".")[0], dest, function(err) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('ppt to image conversion successful');
                            var folderName = file.relative.split(".")[0];

                            console.log("pptx loop");
                            fsReaddir(dest + folderName)
                                .on('file', function(file) {
                                    if (format == "jpg" && file.split(".")[1] == 'png') {
                                        im.resize({
                                            srcPath: file,
                                            dstPath: file.split(".")[0] + '.jpg',
                                            width: 1024
                                        }, function(err, stdout, stderr) {
                                            if (err) throw err;
                                            del.sync(file.split(".")[0] + '.png');
                                            cresateJSON(dest, folderName, format);
                                        });
                                    } else {
                                        cresateJSON(dest, folderName, format);
                                    }
                                })
                        }
                    });
                } else if (file.relative.split(".")[1] == 'pdf') {
                    pdf2png(file.relative.split(".")[0], dest, function(err) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('pdf to image conversion successful.');
                            var folderName = file.relative.split(".")[0];

                            console.log("pdf loop");
                            fsReaddir(dest + folderName)
                                .on('file', function(file) {
                                    console.log("file", file, file.split(".")[0]);
                                    if (format == "jpg" && file.split(".")[1] == 'png') {
                                        console.log("converting to jpg");
                                        im.resize({
                                            srcPath: file,
                                            dstPath: file.split(".")[0] + '.jpg',
                                            width: 1024
                                        }, function(err, stdout, stderr) {
                                            if (err) throw err;
                                            del.sync(file.split(".")[0] + '.png');
                                            cresateJSON(dest, folderName, format);

                                        });
                                    } else {
                                        cresateJSON(dest, folderName, format);
                                    }
                                })


                        }
                    });
                }
            });

        });
    }

    return es.map(modifyFile);
};

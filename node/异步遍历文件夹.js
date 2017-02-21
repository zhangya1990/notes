function travel(dir, callback, finish) {
    fs.readdir(dir, function (err, files) {
        (function next(i) {
            if (i < files.length) {
                var pathname = path.join(dir, files[i]);

                fs.stat(pathname, function (err, stats) {
                    if (stats.isDirectory()) {
                        travel(pathname, callback, function () {
                            finish && finish(pathname);
                            next(i + 1);
                        });
                    } else {
                        callback(pathname, function () {
                            next(i + 1);
                        });
                    }
                });
            } else {
                finish && finish(dir);
            }
        }(0));
    });
}

var dirpath = path.join(__dirname,arg);

travel(dirpath,function(pathname,cb){
    fs.unlink(pathname,cb)
},function(pathname){
    fs.rmdir(pathname)
})
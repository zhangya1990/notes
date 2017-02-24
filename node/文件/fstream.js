//https://github.com/npm/fstream

const fstream = require('fstream');
fstream.Reader('path/to/dir')
    .pipe(fstream.Writer({path:'path/to/other/dir',filter:valid}));

function valid(){
    return this.path[this.path.length-1] !== '~';
}
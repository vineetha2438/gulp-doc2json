# doc2json
Converts ppt/pdf to images in png/jpg format in a folder with same name as document and creates a json of those images in same folder

## Requirements

PPT2PNG requires the following software to be installed:

* OpenOffice (http://www.openoffice.org/porting/mac/faq/installing/ooo.html)
* ImageMagick (using Homebrew)
* Ghostscript (unsing npm)


## Installation

    npm install doc2json
    

## Example to convert test.pdf to png and store folder with images and json in dist folder in GULP

    var doc2json = require('gulp-doc2json');
    
    gulp.task('doc2json', function(callback) {
    gulp.src('test.pdf')
        .pipe(doc2json({
            format: 'png',
            dest: 'dist'
        }))
    });





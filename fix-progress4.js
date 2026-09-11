const fs = require('fs');
const files = ['index.html'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove "|| classData[key].nama"
    content = content.replace("classData[key].quotes || classData[key].nama", "classData[key].quotes");
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed ' + file);
});

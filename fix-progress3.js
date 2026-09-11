const fs = require('fs');
const files = ['index.html', 'xii-1.html', 'xii-2.html', 'xii-3.html', 'xii-4.html', 'xii-5.html', 'xii-6.html', 'xii-7.html', 'xii-8.html', 'xii-9.html'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Pattern to replace in index.html and xii-*.html
    const oldCodeIndex = "let filled = Object.keys(classData).filter(key => !isNaN(key) && parseInt(key) > 0 && parseInt(key) <= total).length;";
    const newCodeIndex = "let filled = Object.keys(classData).filter(key => !isNaN(key) && parseInt(key) > 0 && parseInt(key) <= total && classData[key] && (classData[key].noHp || classData[key].quotes || classData[key].nama)).length;";
    
    const oldCodeXii = "let filled = Object.keys(currentClassData).filter(key => !isNaN(key) && parseInt(key) > 0 && parseInt(key) <= total).length;";
    const newCodeXii = "let filled = Object.keys(currentClassData).filter(key => !isNaN(key) && parseInt(key) > 0 && parseInt(key) <= total && currentClassData[key] && (currentClassData[key].noHp || currentClassData[key].quotes)).length;";
    
    if (content.includes(oldCodeIndex)) {
        content = content.replace(oldCodeIndex, newCodeIndex);
        console.log('Fixed index in ' + file);
    }
    if (content.includes(oldCodeXii)) {
        content = content.replace(oldCodeXii, newCodeXii);
        console.log('Fixed xii in ' + file);
    }
    
    fs.writeFileSync(file, content, 'utf8');
});

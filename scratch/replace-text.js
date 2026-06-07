const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory()
        ? walkSync(dirFile, filelist)
        : filelist.concat(dirFile);
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'EACCES') return;
      throw err;
    }
  });
  return filelist;
}

const files = walkSync('C:/Users/noamh/psy-math-web/src');
let changedFiles = 0;

files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // We will use a regex to match className strings: className="..." or className={`...`}
    // But since it's hard to parse perfectly, we'll just replace the utility classes globally in the file.
    // It's safe enough because these strings are highly specific.

    // First, let's find all instances of text-(slate|gray)-(300|400|500|600|700|800)
    // and dark:text-(slate|gray)-(300|400|500|600|700|800)

    // 1. If it has dark: prefix, replace with dark:text-white
    content = content.replace(/dark:text-(?:slate|gray)-(?:300|400|500|600|700|800)\b/g, 'dark:text-white');
    
    // 2. If it's just text-slate-* (without dark: or hover: etc), we replace with text-black dark:text-white 
    //    BUT wait, if it already had a dark:text-white from step 1, we don't want to duplicate it.
    //    So let's replace text-slate-* with text-black, and if there's a missing dark:text-white, we hope 
    //    it's covered, or we just rely on text-black. 
    //    Actually, let's do a smart replace:
    
    content = content.replace(/(?<![a-z-]:)text-(?:slate|gray)-(?:300|400|500|600|700|800)\b/g, 'text-black dark:text-white');

    // 3. Now we might have duplicates like "text-black dark:text-white dark:text-white"
    // Let's clean up duplicate classes (simple cleanup)
    content = content.replace(/dark:text-white\s+dark:text-white/g, 'dark:text-white');
    content = content.replace(/text-black\s+text-black/g, 'text-black');

    // 4. Handle hover states
    content = content.replace(/hover:text-(?:slate|gray)-(?:300|400|500|600|700|800)\b/g, 'hover:text-black dark:hover:text-white');
    content = content.replace(/dark:hover:text-(?:slate|gray)-(?:300|400|500|600|700|800)\b/g, 'dark:hover:text-white');
    content = content.replace(/dark:hover:text-white\s+dark:hover:text-white/g, 'dark:hover:text-white');

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      changedFiles++;
    }
  } else if (file.endsWith('globals.css')) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/--color-text-primary:\s*#[a-fA-F0-9]+;/g, '--color-text-primary: #000000;');
    content = content.replace(/--color-text-secondary:\s*#[a-fA-F0-9]+;/g, '--color-text-secondary: #000000;');
    content = content.replace(/--color-text-muted:\s*#[a-fA-F0-9]+;/g, '--color-text-muted: #000000;');

    content = content.replace(/\.dark\s*\{([^}]+)\}/g, (match, inner) => {
        let newInner = inner;
        newInner = newInner.replace(/--color-text-primary:\s*#[a-fA-F0-9]+;/g, '--color-text-primary: #ffffff;');
        newInner = newInner.replace(/--color-text-secondary:\s*#[a-fA-F0-9]+;/g, '--color-text-secondary: #ffffff;');
        newInner = newInner.replace(/--color-text-muted:\s*#[a-fA-F0-9]+;/g, '--color-text-muted: #ffffff;');
        return `.dark {${newInner}}`;
    });

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      changedFiles++;
    }
  }
});

console.log(`Changed ${changedFiles} files.`);

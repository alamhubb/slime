import { SlimeParser, SlimeCstToAst } from 'slime-parser';
import * as fs from 'fs';

const code = `class Point {
    x: number
}`;
console.log('Input:', code);

try {
    const parser = new SlimeParser(code);
    const cst = parser.Program('module');
    
    // 写入文件
    fs.writeFileSync('debug-cst.json', JSON.stringify(cst, null, 2));
    console.log('CST written to debug-cst.json');
} catch (e) {
    console.error('Error:', e);
}

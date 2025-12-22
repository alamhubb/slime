import SlimeJavascriptParser from './packages/slime-parser/src/deprecated/SlimeJavascriptParser';

const code = `class Foo {
  #x = 1;
  test() {
    class X extends (#x in {}) {};
  }
}`;

console.log('=== Debug 测试 ===\n');
console.log('代码:', code);
console.log();

try {
    const parser = new SlimeJavascriptParser(code);
    parser.debug();
    const cst = parser.Program('script');
    console.log('解析成功');
} catch (error: any) {
    console.log('解析失败:', error.message);
}

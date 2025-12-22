/**
 * SlimeTokenCreateUtils.ts - Token 节点创建工厂
 *
 * 为每个 Token 类型提供创建方法
 * 与 SlimeAstNode.ts 中的 Token 类型一一对应
 */
import {SlimeJavascriptTokenFactory} from "./deprecated/SlimeJavascript/SlimeJavascriptTokenCreateUtils.ts";

export class SlimeTokenFactory extends SlimeJavascriptTokenFactory {
}

const SlimeTokenCreateUtils = new SlimeTokenFactory();
export default SlimeTokenCreateUtils;


/**
 * CST to AST 转换工具类
 */
import { SubhutiCst } from "subhuti";

export class SlimeAstUtils {
    /**
     * 将 Unicode 转义序列解码为实际字符
     * 支持 \uXXXX 和 \u{XXXXX} 格式
     *
     * @param str 可能包含 Unicode 转义的字符串
     * @returns 解码后的字符串
     */
    static decodeUnicodeEscapes(str: string | undefined): string {
        // 如果为空或不包含转义序列，直接返回（性能优化�?
        if (!str || !str.includes('\\u')) {
            return str || ''
        }

        return str.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g,
            (match, braceCode, fourDigitCode) => {
                const codePoint = parseInt(braceCode || fourDigitCode, 16)
                return String.fromCodePoint(codePoint)
            }
        )
    }

    /**
     * 检查 CST 节点名称是否匹配
     */
    static checkCstName(cst: SubhutiCst, cstName: string) {
        if (cst.name !== cstName) {
            SlimeAstUtils.throwNewError(cst.name)
        }
        return cstName
    }

    /**
     * 抛出错误
     */
    static throwNewError(errorMsg: string = 'syntax error') {
        throw new Error(errorMsg)
    }
}

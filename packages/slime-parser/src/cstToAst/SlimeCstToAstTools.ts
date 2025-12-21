import { SubhutiCst } from "subhuti";

/**
 * CST to AST 转换工具类
 * 包含共享的静态工具方法
 */
export class SlimeCstToAstTools {
    /**
     * 将 Unicode 转义序列解码为实际字符
     * 支持 \uXXXX 和 \u{XXXXX} 格式
     *
     * @param str 可能包含 Unicode 转义的字符串
     * @returns 解码后的字符串
     */
    static decodeUnicodeEscapes(str: string | undefined): string {
        // 如果为空或不包含转义序列，直接返回（性能优化）
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
     * 
     * @param cst CST 节点
     * @param cstName 期望的节点名称
     * @returns 节点名称
     * @throws 如果名称不匹配则抛出错误
     */
    static checkCstName(cst: SubhutiCst, cstName: string): string {
        if (cst.name !== cstName) {
            SlimeCstToAstTools.throwNewError(cst.name)
        }
        return cstName
    }

    /**
     * 抛出错误的辅助函数
     * 
     * @param errorMsg 错误消息
     * @throws 总是抛出 Error
     */
    static throwNewError(errorMsg: string = 'syntax error'): never {
        throw new Error(errorMsg)
    }
}

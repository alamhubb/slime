/**
 * CST to AST 转换工具函数
 */
import { SubhutiCst } from "subhuti";

/**
 * 将 Unicode 转义序列解码为实际字符
 * 支持 \uXXXX 和 \u{XXXXX} 格式
 *
 * @param str 可能包含 Unicode 转义的字符串
 * @returns 解码后的字符串
 */
export function decodeUnicodeEscapes(str: string | undefined): string {
    if (!str || !str.includes('\\u')) {
        return str || '';
    }

    return str.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g,
        (match, braceCode, fourDigitCode) => {
            const codePoint = parseInt(braceCode || fourDigitCode, 16);
            return String.fromCodePoint(codePoint);
        }
    );
}

/**
 * 检查 CST 节点名称是否匹配
 */
export function checkCstName(cst: SubhutiCst, cstName: string): string {
    if (cst.name !== cstName) {
        throwNewError(cst.name);
    }
    return cstName;
}

/**
 * 抛出错误
 */
export function throwNewError(errorMsg: string = 'syntax error'): never {
    throw new Error(errorMsg);
}

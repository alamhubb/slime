import type { SubhutiCst } from "subhuti";

/**
 * CST to AST 转换统一上下文管理器
 * 替代分散在各文件中的 _slimeCstToAstUtil 全局变量
 */
export class CstToAstContext {
    private static _util: any = null;

    /**
     * 初始化上下文
     */
    static setUtil(util: any): void {
        this._util = util;
    }

    /**
     * 获取工具实例
     */
    static getUtil(): any {
        if (!this._util) {
            throw new Error('CstToAstContext not initialized. Call setUtil() first.');
        }
        return this._util;
    }

    /**
     * 检查是否已初始化
     */
    static isInitialized(): boolean {
        return this._util !== null;
    }

    /**
     * 重置上下文（用于测试）
     */
    static reset(): void {
        this._util = null;
    }

    // ==================== 通用工具方法 ====================

    /**
     * 将 Unicode 转义序列解码为实际字符
     * 支持 \uXXXX 和 \u{XXXXX} 格式
     */
    static decodeUnicodeEscapes(str: string | undefined): string {
        if (!str || !str.includes('\\u')) {
            return str || '';
        }

        return str.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g,
            (_, braceCode, fourDigitCode) => {
                const codePoint = parseInt(braceCode || fourDigitCode, 16);
                return String.fromCodePoint(codePoint);
            }
        );
    }

    /**
     * 检查 CST 节点名称是否匹配
     */
    static checkCstName(cst: SubhutiCst, cstName: string): string {
        if (cst.name !== cstName) {
            this.throwError(`Expected CST node '${cstName}', but got '${cst.name}'`);
        }
        return cstName;
    }

    /**
     * 抛出语法错误
     */
    static throwError(msg: string = 'syntax error'): never {
        throw new Error(msg);
    }

    /**
     * 检查是否是计算属性名
     */
    static isComputedPropertyName(cst: SubhutiCst): boolean {
        // ComputedPropertyName -> [LBracket, AssignmentExpression, RBracket]
        // 或者 cst 节点本身就是 ComputedPropertyName
        if (cst.name === 'ComputedPropertyName' || cst.name === 'ComputedPropertyName') {
            return true;
        }
        return !!(cst.children && cst.children[0] &&
            (cst.children[0].name === 'ComputedPropertyName' ||
                cst.children[0].name === 'ComputedPropertyName'));
    }

    /**
     * 检查是否是 static 修饰符
     */
    static isStaticModifier(cst: SubhutiCst | null): boolean {
        return !!(cst && (cst.name === 'Static' || cst.value === 'static'));
    }
}

// 便捷导出
export const getUtil = CstToAstContext.getUtil.bind(CstToAstContext);
export const decodeUnicodeEscapes = CstToAstContext.decodeUnicodeEscapes.bind(CstToAstContext);
export const checkCstName = CstToAstContext.checkCstName.bind(CstToAstContext);
export const throwError = CstToAstContext.throwError.bind(CstToAstContext);
export const isComputedPropertyName = CstToAstContext.isComputedPropertyName.bind(CstToAstContext);
export const isStaticModifier = CstToAstContext.isStaticModifier.bind(CstToAstContext);

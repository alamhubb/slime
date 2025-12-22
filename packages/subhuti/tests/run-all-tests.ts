/**
 * Subhuti 测试运行器
 * 运行 tests/cases 目录下的所有测试
 */
import { readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const casesDir = join(__dirname, 'cases')

async function runTest(testFile: string): Promise<boolean> {
    return new Promise((resolve) => {
        const child = spawn('npx', ['tsx', join(casesDir, testFile)], {
            stdio: 'inherit',
            shell: true
        })
        
        child.on('close', (code) => {
            resolve(code === 0)
        })
        
        child.on('error', () => {
            resolve(false)
        })
    })
}

async function main() {
    console.log('='.repeat(70))
    console.log('Subhuti 测试套件')
    console.log('='.repeat(70))
    
    const files = readdirSync(casesDir)
        .filter(f => f.endsWith('.ts'))
        .sort()
    
    console.log(`\n扫描目录: ${casesDir}`)
    console.log(`共 ${files.length} 个测试用例\n`)
    
    const results: { file: string; passed: boolean }[] = []
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        console.log(`\n[${i + 1}/${files.length}] 运行: ${file}`)
        console.log('-'.repeat(70))
        
        const passed = await runTest(file)
        results.push({ file, passed })
        
        if (passed) {
            console.log(`\n✅ 测试 ${i + 1} 通过`)
        } else {
            console.log(`\n❌ 测试 ${i + 1} 失败`)
        }
    }
    
    // 汇总
    console.log('\n' + '='.repeat(70))
    console.log('测试总结')
    console.log('='.repeat(70))
    
    for (let i = 0; i < results.length; i++) {
        const { file, passed } = results[i]
        console.log(`${passed ? '✅' : '❌'} [${i + 1}] ${file}`)
    }
    
    const passedCount = results.filter(r => r.passed).length
    const failedCount = results.length - passedCount
    
    console.log('\n' + '='.repeat(70))
    console.log(`总计: ${results.length} 个测试`)
    console.log(`通过: ${passedCount}`)
    console.log(`失败: ${failedCount}`)
    console.log('='.repeat(70))
    
    if (failedCount > 0) {
        console.log('\n⚠️  有测试失败，请检查')
        process.exit(1)
    } else {
        console.log('\n🎉 所有测试通过！')
        process.exit(0)
    }
}

main()

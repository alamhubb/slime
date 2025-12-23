// Phase 4: 枚举声明
// 测试 enum 语法

// 13.1 数字枚举
enum Direction {
    Up,
    Down,
    Left,
    Right
}

// 13.2 带初始值的数字枚举
enum Status {
    Pending = 1,
    Active = 2,
    Completed = 3
}

// 13.3 字符串枚举
enum Color {
    Red = "RED",
    Green = "GREEN",
    Blue = "BLUE"
}

// 13.4 const 枚举
const enum HttpStatus {
    OK = 200,
    NotFound = 404,
    ServerError = 500
}

// 13.5 混合枚举
enum Mixed {
    No = 0,
    Yes = "YES"
}

// 13.6 计算成员
enum Computed {
    A = 1,
    B = 2,
    C = A + B
}

// 使用枚举
let dir: Direction = Direction.Up
let status: Status = Status.Active
let color: Color = Color.Red

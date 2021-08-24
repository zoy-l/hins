# hins

[![codecov](https://codecov.io/gh/l-zoy/hins/branch/main/graph/badge.svg)](https://codecov.io/gh/l-zoy/hins) [![GitHub license](https://img.shields.io/github/license/l-zoy/hins)](https://github.com/l-zoy/hins/blob/master/LICENSE) ![node-current](https://img.shields.io/node/v/zmi) [![<ORG_NAME>](https://circleci.com/gh/l-zoy/hins.svg?style=svg)](https://app.circleci.com/pipelines/github/l-zoy/hins)

中间插件程序, 可以快速创建定制化 cli 工具

## 安装

```bash
npm install hins
```

## 用法

暴露一个核心类 `Core`

```js
const { Core } = require('hins')
const core = new Core({
  // ...arguments
})

// 需要执行的命令
core.start({ ...arguments })
```

### Core.start()

参数: object

```
{
  args?: object
  command: string
  reloadCommand?: boolean
}
```

- args 接受任何参数, 类型是一个对象, 最后会传入命令插件
- command 启动命令
- reloadCommand 重新运行命令

```js
// 这里先执行了 dev 命令,进入到 dev 插件,
core.start({ command: 'dev' })
// 有的时候需要做命令派发, 在dev插件命令内 做了一些计算,
// 最后得出执行webDev命令. 但是又不需要重新注册插件等前置步奏
core.start({ command: 'webDev', reloadCommand: true })
```

## 接受参数:

### cwd

- 工作区路径
- Type: string
- Default: `process.cwd()`

### babelRegister

- config 和 plugin 的运行时, 使其支持 ts 或 ESNext
- Type: function
- Default: `() => {}`

### possibleConfigName

- 读取配置文件的路径及文件名
- Type: string[]
- Default: `[]`

```js
{
  possibleConfigName: ['config.js']
}
```

运行时就会去传入 **cwd** 根目录下找 **config.js** 文件并读取

### plugins

- plugins 配置路径
- Type: string[]
- Default: `[]`

可以是 **绝对路径** 或者 **相对路径**. 相对路径是相对传入的 **cwd** 参数

### watchConfig

- 是否监听配置文件, 如果发现更改则重新运行命令
- Type: object
- Default:

```js
  // IChangeTypes:'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir'
  {
    changeLog: (type: IChangeTypes, path: string) => void
    reloadLog: (type: IChangeTypes, path: string) => void
  }
```

## 核心方法:

每个 plugin 都会接受一个 api 实例参数

### describe 注册阶段执行，用于描述插件或插件集的 key、配置信息、启用方式等

参数: object

```
{
  key: string,
  config: {
    default: any,
    schema: (joi) => {
      return joi.string()
    }
  }
}
```

```js
api.describe({
  key: 'history',
  config: {
    default: 'browser',
    schema(joi) {
      return joi.string()
    }
  }
})
```

```js
// config
export default {
  history: 'node'
}
```

注：

- config.default 为配置的默认值，用户没有配置时取这个
- config.schema 用于声明配置的类型，基于 joi，如果你希望用户进行配置，这个是必须的，否则用户的配置无效

### register 为 api.applyHooks 注册可供其使用的 hook

参数: object

```
{
  key: string,
  fn: Function,
  pluginId?: string,
  before?: string,
  stage?: number
}
```

```js
// 可同步
api.register({
  key: 'foo',
  fn() {
    return 'a';
  },
});

// 可异步
api.register({
  key: 'foo',
  async fn() {
    await delay(100);
    return 'b';
  },
});

然后通过 api.applyHooks 即可拿到 ['a', 'b']，


const foo = await api.applyHooks({
  key: 'foo',
  type: api.ApplyHookType.add,
  initialValue: [],
});
console.log(foo); // ['a', 'b']
```

- fn 支持同步和异步，异步通过 Promise，返回值为 Promise 即为异步
- fn 里的内容需结合 api.applyHooks 的 type 参数来看
  - 如果是 api.ApplyHookType.add，需有返回值，这些返回值最终会被合成一个数组
  - 如果是 api.ApplyHookType.modify，需对第一个参数做修改，并返回
  - 如果是 api.ApplyHookType.event，无需返回值
- stage 和 before 都是用于调整执行顺序的
- stage 默认是 0，设为 -1 或更少会提前执行，设为 1 或更多会后置执行

提供三个便捷调用:

```js
api.applyAddHooks({
  key: 'foo',
  initialValue: []
})

api.applyModifyHooks({
  key: 'modify',
  initialValue: 'bar'
})

api.applyEventHooks({
  key: 'event'
})
```

### applyHooks 取得 register 注册的 hooks 执行后的数据

参数: object

```
{
  key: string,
  type:api.ApplyHookType,
  initialValue?: any,
  args?: any
}
```

相同 key 可能有多个 hook, api.ApplyHookType.add 会返回所有 hook 的数组合值

```js
const foo = await api.applyHooks({
  key: 'foo',
  type: api.ApplyHookType.add,
  initialValue: []
})
console.log(foo) // ['a', 'b']
```

### registerPlugins(plugins: string[]) 注册插件，参数为路径数组

```js
api.registerPlugins([
  { key: 'preset2', apply: (api) => {} },
  require.resolve('./preset_3')
])
```

这里内联插件不会进行处理, 直接添加至待执行的插件列表, 因为插件的键名是依照文件路径生成的, 这里的 key 需要填写唯一值

### registerCommand 注册命令

参数: object

```
{
  command: string,
  alias?: string,
  fn: function
}
```

```js
api.registerCommand({
  command: 'generate',
  alias: 'g',
  fn: ({ args }) => {
    return `hello ${api.args.projectName}`
  }
})
```

alias 为别名，比如 generate 的别名 g fn 的参数为 { args }

### registerMethod

参数: object

```
{
  name: string,
  fn?: Function,
}
```

往 api 上注册方法。可以是 api.register() 的快捷使用方式，便于调用；也可以不是，如果有提供 fn，则执行 fn 定义的函数。

```js
api.registerMethod({
  name: 'foo',
  fn() {
    return 'foo'
  }
})

api.foo()
// 'foo'
```

### configInstance

```js
    watchConfig(): void;
    // 开启监听config文件

    在插件里使用api.configInstance.watchConfig开启监听配置文件, 当修改时会重启

```

## 周期钩子

<!-- 'onPluginReady', 'modifyConfig', 'onStart' -->

### onStart()

在执行命令函数前触发。可以使用 config

```js
api.onStart(() => {
  // do something
})
```

### onPluginReady()

在插件初始化完成触发。在 onStart 之前，此时 config 尚未解析好。

```js
api.onPluginReady(() => {
  // do something
})
```

### modifyConfig

修改最终配置,参数为最终 config 配置

```js
api.modifyConfig((memo) => {
  return {
    ...memo,
    ...defaultOptions
  }
})
```

修改后的值不会再做 schema 校验

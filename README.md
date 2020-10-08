# titbit-loader

针对titbit框架的自动加载工具，用于自动创建并加载controller以及middleware的场景。也可以自动加载model。

基于此可实现MVC或类MVC的结构，并可以快速开发接口，生成RESTFul风格的API，路由映射文件等操作。

默认情况，会在当前目录创建controller、middleware目录。之后就可以在controller中编写class。

使用titbit-loader需要先安装titbit框架：

``` JavaScript
const titbit = require('titbit');
const tbloader = require('titbit-loader');

var app = new titbit({
  debug: true        
});

var tbl = new tbloader();

tbl.init(app);

app.run(2022);

```

controller目录中class示例：

``` JavaScript
//假设存在文件test.js，那么路径就是/test开头。

'use strict';

class test {
  
  constructor () {
    //默认参数是this.param = '/:id'。
    //可以通过设置this.param来指定参数。
    //this.param = '/:name/:key';

    //this.param = '';表示不带参数。
  }

  /*
    对应HTTP请求类型，有同名小写的方法名称处理请求，可以不写，需要哪些请求就写哪些。
    这里只使用了GET、POST、DELETE请求。
  */

  async get(c) {
    c.res.body = 'test ok:' + c.param.id;
  }

  //注意POST请求表示创建资源，默认加载时是不带参数的，也就是发起POST请求对应的路由是/test。
  async post(c) {
    c.res.body = c.body;
  }

  async delete(c) {
    c.res.body = 'delete ok';
  }

}

module.exports = test;

```


## 加载model

``` JavaScript
const titbit = require('titbit');
const tbloader = require('titbit-loader');
const dbconfig = require('./dbconfig');

//postgresql数据库的扩展
const pg = require('pg');

var app = new titbit({
  debug: true        
});

var tbl = new tbloader({
  //默认就是true
  loadModel: true, 
  mdb: new pg.Pool(dbconfig);
});

tbl.init(app);

app.run(2022);

```

## 指定加载目录

``` JavaScript
const titbit = require('titbit');
const tbloader = require('titbit-loader');

var app = new titbit({
  debug: true
});

var tbl = new tbloader({
  //相对于程序所在目录，相对路径会自动计算转换为绝对路径。
  //如果指定目录下没有对应目录，会自动创建controller、model、middleware
  appPath : 'app1'
});

tbl.init(app);

app.run(2022);

```

## POST请求的路由参数

默认在处理路由映射时，POST请求不会带有参数，如果需要传递参数，可以通过选项postArgs开启。

``` JavaScript
const titbit = require('titbit');
const tbloader = require('titbit-loader');

var app = new titbit({
  debug: true
});

var tbl = new tbloader({
  postArgs: true
});

tbl.init(app);

app.run(2022);

```

## 加载中间件

middleware目录存放的是中间件模块，但是不会每个都加载，需要你在controller中进行设置，配置文件为__mid.js。注意controller中的__mid.js表示对全局开启中间件，controller中的子目录中存在__mid.js表示只对当前目录分组启用，所见即所得，简洁直观高效。

之所以能够按照分组加载执行，其本质不在于titbit-loader本身，而是titbit提供的中间件分组执行机制。因为titbit提供了路由分组功能，并且可以指定中间件严格匹配请求方法和路由名称，所以基于此开发扩展就变得很方便。

``` JavaScript
controller/:
    __mid.js    //对全局开启
    
    test.js

    api/:
      __mid.js  //只对/api分组启用
      ...

    user/:
      __mid.js  //只对/user分组启用
      ...

    ...

```

__mid.js示例：

``` JavaScript
//导出的必须是数组，数组中的顺序就是执行顺序，name是middleware目录中文件的名字，不需要带.js
module.exports = [
  {
    name : 'cors',
    //表示要在接收body数据之前执行
    pre: true
  },
  {
    name : 'apilimit'
  }
];

```

#### 加载中间件类

如果你的中间件模块是需要new操作的，不是一个直接执行的中间件函数，则可以使用@指定，同时要提供一个middleware函数。

``` JavaScript
module.exports = [
  {
    //@开头表示模块是类，需要初始化，并且要提供middleware方法，
    //这时候加载时会自动初始化并加载middleware函数作为中间件，
    //并且会绑定this，你可以在中间件模块的middleware函数中比较放心的使用this。
    name : '@apilimit'
  }

];

```

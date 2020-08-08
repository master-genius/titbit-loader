# titbit-loader

针对titbit和doio框架的自动加载工具，用于自动创建并加载controller以及middleware的场景。也可以自动加载model。

基于此可实现MVC或类MVC的结构，并可以快速开发接口，生成RESTFul风格的API，路由映射文件等操作。

默认情况，会在当前目录创建controller、middleware目录。之后就可以在controller中编写class。

使用titbit-loader需要先安装titbit框架：

```
const titbit = require('titbit');
const tbloader = require('titbit-loader');

var app = new titbit({
  debug: true        
});

var tbl = new tbloader();

tbl.init(app);

app.run(2022);

```

## 加载model



```
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

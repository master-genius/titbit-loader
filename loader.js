/**
    titbit-loader Copyright (C) 2019.08 BraveWang
    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 3 of the License , or
    (at your option) any later version.
 */

'use strict';

const fs = require('fs');


/**
 * 路由映射方式：
 *  文件名就是路由，支持目录作为分组或者说是模块的名称，目录中的子目录则不会再加载。
 *  这样如果目录api中存在文件content.js，则路由为/api/content。
 * RESTFul模式：
 *  如果要使用RESTFul模式，则文件中必须存在以下一些方法：
 *      get
 *      list
 *      create
 *      update
 *      delete
 *  对应的路由就是：
 *      GET     /api/content/id
 *      GET     /api/content（不带id表示获取列表）
 *      POST    /api/content
 *      UPDATE  /api/content/id
 *      DELETE  /api/content/id
 * 一个控制器可以是一个function或 => 函数，也可以是一个class形式的闭包。
 * 总之，一个路由对应一个控制器，就是回调函数，而class需要实例化。
 * 因为class本质上也是function，并且即使function声明的函数，也是有可能需要实例化的，
 * 并且有可能会有使用prototype，而不是class，所以需要在类中声明类型，如果文件中仅仅是
 * 一个需要引入的函数文件，则只需要在文件最开头加上_
 * 规则：
 *  mode='callback' 需要实例化，并且实例化以后默认使用callback作为回调函数，
 *  mode='restful' RESTFul模式，这种情况，实例化以后使用RESTFul模式对应的方法加载。
 * 
 * 不导出模块或类： 
 *  如果不想导出目录或者某一个文件，则需要在文件名称开头加上!。
 * 
 * 路由分组名称：
 *  默认情况，如果是在目录中的文件，则表示全部属于按照目录名称作为分组，
 *  而如果在类中提供了groupName属性，则使用groupName的值。
 * 
 * 路由命名：
 *  默认情况，路由的名称是[目录-文件-方法名称]。
 */

/**
 * 关于模型：model有时候并不是必须的，可能只是想做一些前端应用，
 * 或者通过其他机制，也可能是每个人使用model的习惯不太一样，
 * 无论如何，loader提供了是否加载model的选项，并且
 * 
 */

class loader {

    constructor (options = {}) {
        this.config = {
            controllerPath : './controller',
            modelPath : './model',
            midwarePath : './middleware',
            loadModel : true,
            midwareDesc: './midware.js',
        };

        this.globalMidTable = {};
        this.groupMidTable = {};
        this.fileMidTable = {};

        if (typeof options !== 'object') {
            options = {};
        }
        for (var k in options) {
            switch (k) {
                case 'controllerPath':
                case 'modelPath':
                case 'midwarePath':
                case 'loadModel':
                    this.config[k] = options[k];
                default:;
            }
        }

        try {
            fs.accessSync(this.config.controllerPath, fs.constants.F_OK);
        } catch (err) {
            if (this.config.controllerPath.length > 0) {
                fs.mkdirSync(this.config.controllerPath);
            }
        }

        try {
            fs.accessSync(this.config.midwarePath, fs.constants.F_OK);
        } catch (err) {
            if (this.config.midwarePath.length > 0) {
                fs.mkdirSync(this.config.midwarePath);
            }
        }

        try {
            fs.accessSync(this.config.modelPath, fs.constants.F_OK);
        } catch (err) {
            if (this.config.modelPath.length > 0) {
                fs.mkdirSync(this.config.modelPath);
            }
        }
        
    }

    init (app) {
        this.loadController(app);
        this.loadMidware(app);
        if (this.config.loadModel) {
            this.loadModel(app);
        }
    }


    loadController (app) {
        var cfiles = {};
        this.readControllers(this.config.controllerPath, cfiles);
        let cob = null;
        for (let k in cfiles) {
            cob = require(k);
            cob = new cob();
            this.setRouter(app, cob, cfiles[k]);
            cob = null;
        }

        return cfiles;
    }

    setRouter (app, cob, cf) {
        if (cob.mode === undefined || cob.mode !== 'callback') {
            cob.mode = 'restful';
        }
        var group = cf.dirgroup;
        var npre = cf.filegroup;
        if (cob.mode === 'restful') {
            if (cob.create !== undefined && typeof cob.create === 'function') {
                app.router.post(`${cf.filegroup}/:id`, cob.create.bind(cob),{
                    name: cob.name_create || `${npre}/create`,
                    group: group
                });
            }
            if (cob.delete !== undefined && typeof cob.delete === 'function') {
                app.router.delete(`${cf.filegroup}/:id`, cob.delete.bind(cob),{
                    name: cob.name_delete || `${npre}/delete`,
                    group: group
                });
            }
            if (cob.update !== undefined && typeof cob.update === 'function') {
                app.router.put(`${cf.filegroup}/:id`, cob.update.bind(cob),{
                    name: cob.name_update || `${npre}/update`,
                    group: group
                });
            }
            if (cob.get !== undefined && typeof cob.get === 'function') {
                app.router.get(`${cf.filegroup}/:id`, cob.get.bind(cob),{
                    name: cob.name_get || `${npre}/get`,
                    group: group
                });
            }
            if (cob.list !== undefined && typeof cob.list === 'function') {
                app.router.get(`${cf.filegroup}`, cob.list.bind(cob),{
                    name: cob.name_list || `${npre}/list`,
                    group: group
                });
            }
        } else {
            if (cob.method === undefined) {
                cob.method = 'GET';
            }
            let cname = `${npre}/callback`;
            switch (cob.method) {
                case 'GET':
                    app.router.get(cf.filegroup, cob.callback.bind(cob), {
                        name: cname,
                        group: group
                    });
                    break;
                case 'POST':
                    app.router.post(cf.filegroup, cob.callback.bind(cob), {
                        name: cname,
                        group: group
                    });
                    break;
                case 'DELETE':
                    app.router.get(cf.filegroup, cob.callback.bind(cob), {
                        name: cname,
                        group: group
                    });
                    break;
                case 'PUT':
                    app.router.put(cf.filegroup, cob.callback.bind(cob), {
                        name: cname,
                        group: group
                    });
                    break;
                case 'OPTIONS':
                    app.router.options(cf.filegroup, cob.callback.bind(cob), {
                        name: cname,
                        group: group
                    });
                    break;
                default:;
            }
        }
        if (cob.__mid && typeof cob.__mid === 'function') {
            var mid = cob.__mid();
            if (mid) {
                this.fileMidTable[cf.filegroup] = {
                    group:group,
                    mid:mid
                };
            }
        }
    }

    /**
     * 加载中间件，仅仅是通过一个js文件，
     * 中间件不宜过度使用，否则容易混乱。
     */
    loadMidware (app) {
        for (let i=0; i<this.globalMidTable.length; i++) {
            this.loadGlobalMidware(app, this.globalMidTable[i]);
        }
        //加载组，此时组已经确定
        for (var k in this.groupMidTable) {
            for (let i=0; i<this.groupMidTable[k].length; i++) {
                this.loadGroupMidware(app, this.groupMidTable[k][i], k);
            }
        }

        for(var k in this.fileMidTable) {
            for (let i=0; i<this.fileMidTable[k].mid.length; i++) {
                this.loadFileMidware(app, 
                    this.fileMidTable[k].mid[i], k, 
                    this.fileMidTable[k].group
                );
            }
        }

    }

    getMidwareInstance(m) {
        var mt = null;
        let tmp = null;
        if (m.name[0] == '@') {
            tmp = require(this.config.midwarePath+'/'+m.name.substring(1));
            if (m.args === undefined) {
                mt = new tmp();
            } else {
                mt = new tmp(m.args);
            }
            //bind this
            mt = mt.middleware.bind(mt);
        } else {
            mt = require(this.config.midwarePath+'/'+m.name);
        }
        return mt;
    }

    loadGlobalMidware (app, m) {
        if (!m.name || m.name == '') {
            return;
        }
        let opts = {};
        if (m.method !== undefined) {
            opts.method = m.method;
        }
        if (m.group !== undefined) {
            opts.group = m.group;
        }
        
        app.use(this.getMidwareInstance(m), opts);
    }

    loadGroupMidware(app, m, group) {
        if (!m.name || m.name == '') {
            return;
        }
        var opts = {
            group: group,
        };
        if (m.method !== undefined) {
            opts.method = m.method;
        }
        app.use(this.getMidwareInstance(m), opts);
    }

    loadFileMidware (app, m, f, group) {
        var opts = {
            group: group,
            name:[],
        };

        if (m.path === undefined) {
            opts.name = [`${f}/create`, `${f}/update`,
                `${f}/delete`,`${f}/get`,`${f}/list`,`${f}/callback`
            ];
        } else {
            if (typeof m.path === 'string') {
                m.path = [ m.path ];
            }
            for(let i=0; i<m.path.length; i++) {
                opts.name.push(`${f}/${m.path[i]}`);
            }
            
        }
        console.log(opts);
        app.use(this.getMidwareInstance(m), opts);
    }

    /**
     * 加载数据库操作接口，一个表要对应一个js文件，
     * 默认没有模型关联的支持，这需要自己编写SQL语句。
     */
    loadModel () {

    }

    stripExtName (filename) {
        let sf = filename.split('.js');
        return `${sf[0]}`;
    }

    /**
     * 读取控制器目录中的文件
     * @param {string} cdir 
     * @param {object} cfiles 
     * @param {number} deep 
     * @param {string} dirgroup 
     */
    readControllers (cdir, cfiles, deep = 0, dirgroup = '') {
        let files = fs.readdirSync(cdir, {withFileTypes:true});
        let tmp = '';
        for (let i=0; i<files.length; i++) {
            if (files[i].isDirectory() && deep < 1) {
                if (files[i].name[0] == '!') { continue; }
                this.readControllers(cdir+'/'+files[i].name, 
                    cfiles, deep+1,
                    `${dirgroup}/${files[i].name}`
                );
            } else if (files[i].isFile()) {
                if (files[i].name.length < 4) { continue; }
                if (files[i].name.indexOf('.js') !== files[i].name.length - 3) {
                    continue;
                }
                if (files[i].name == '__mid.js') {
                    if (deep == 0) {
                        this.globalMidTable = require(cdir+'/'+files[i].name);
                    } else {
                        this.groupMidTable[dirgroup] = require(cdir+'/'+files[i].name);
                    }
                    continue;
                }
                tmp = this.stripExtName(files[i].name);
                cfiles[cdir+'/'+files[i].name] = {
                    filegroup: dirgroup + '/' + tmp,
                    dirgroup: dirgroup || '/',
                    name: files[i].name,
                    modname: tmp
                };
            }
        }
        
    }

}

module.exports = loader;

var SQLite3 = require('sqlite3').verbose();
var db = new SQLite3.Database('c:/db/znkk_manager.db');

// 增
function addTest(obj, callback) {
    if (!obj) {
        callback && callback('params error');
        return ;
    }
    db.run("insert into CardType(cardId, cardName, vouchNo, vouchLab, createTime, updateTime, status) values(?, ?, ?, ?, ?, ?, ?)",
        [obj.cardId, obj.cardName, obj.vouchNo, obj.vouchLab, obj.createTime, obj.updateTime, obj.status],
        function(err) {
            if (err) {
                console.log('fail on add ' + err);
                callback && callback(err);
            } else {
                callback && callback();
            }
        });
}
var obj = {'cardId':'07', 'cardName':'测试卡', 'vouchNo':'9', 'vouchLab':'card9', 'createTime':'2016-03-31 13:30:00', 'updateTime':'2016-03-31 13:30:00', 'status':'Y'};
//addTest(obj);

// 改
function updateTest(obj, callback) {
    if (!obj) {
        callback && callback('params error');
        return ;
    }
    db.run("update CardType set cardName = ?, updateTime = ? where cardId = ?",
        [obj.cardName, obj.updateTime, obj.cardId],
        function(err){
            if (err){
                console.log('fail on updating table ' + err);
                callback && callback(err);
            } else {
                callback && callback(null);
            }
        });
}
obj = {'cardName':'测试卡X', 'updateTime':'2016-03-31 13:30:01', 'cardId':'07'};
//updateTest(obj);

// 查询（只获取第一条记录）
function getTest(id, callback) {
    if (!obj) {
        callback && callback('params error');
        return ;
    }
    db.get("select * from CardType where cardId = ?",
        [id],
        function(err, obj) {
            if (err) {
                console.log('fail on get ' + err);
                callback && callback(err);
            } else {
                callback && callback(obj);
            }
        });
}

// 查询全部记录
function allTest(callback) {
    db.all("select * from CardType",
        function(err, rows) {
            if (err) {
                console.log('fail on all ' + err);
                callback && callback(err);
            } else {
                callback && callback(rows);
            }
        });
}

// 查询部分记录
function listTest(obj, callback) {
    var sql = "select * from CardType";
    var whereSql = "";
    var params = [];
    if (obj) {
        if (obj.cardId) {
            whereSql += ' cardId=?';
            params.push(obj.cardId);
        }
        if (obj.vouchLab) {
            whereSql += (whereSql) ? ' and ' : ' ' + "vouchLab like '%'||?||'%'";
            params.push(obj.vouchLab);
        }
        if (obj.cardName) {
            whereSql += (whereSql) ? ' and ' : ' ' + "cardName like '%'||?||'%'";
            params.push(obj.cardName);
        }
    }
    if (whereSql) {
        sql += (" where " + whereSql);
    }
    console.log("sql> " + sql);
    db.all(sql, params,
        function(err, rows) {
            if (err) {
                console.log('fail on list ' + err);
                callback && callback(err);
            } else {
                callback && callback(rows);
            }
        });
}

// 删
function delTest(id, callback) {
    if (!obj) {
        callback && callback('params error');
        return ;
    }
    db.run("delete from CardType where cardId = ?",
        [id],
        function(err) {
            if (err) {
                console.log('fail on add ' + err);
                callback && callback(err);
            } else {
                callback && callback();
            }
        });
}
//delTest('07');

// 事务（不行）
function batchInsertTest() {
    var sql = "insert into CardType(cardId, cardName, vouchNo, vouchLab, createTime, updateTime, status) values(?, ?, ?, ?, ?, ?, ?);";
    var stmt = db.prepare(sql);
    try {
        console.log('begin transaction');
        db.run("begin;");
        for (i=0; i<3; ++i) {
            if (i == 1) {
                a.test(); // 过意抛出异常，测试是否回滚；
            }
            console.log("i=" + i);
            var params = ['1' + i,
                '测试卡' + i,
                '9',
                'card9',
                '2016-03-31 13:30:00',
                '2016-03-31 13:30:00',
                'Y'];
            stmt.run(params); // TODO:这里直接将事务提交了，控制不了事务！！！stmt对象并没看见能否设置自动提交！
            // 在sql执行工具中，使用“begin; commit; rollback;”是可以控制事务的；
        }
        console.log('commit transaction');
        db.run("commit;");
    } catch (err) {
        console.log('batchInsert error: ' + err);
        console.log('rollback transaction');
        db.run("rollback;"); // 回滚无效！
    } finally {
        console.log('batchInsert finalize.');
        stmt.finalize();
    }
}
//batchInsertTest();
// 事务2
function batchInsertTest2() {
    var insertSql = "insert into CardType(cardId, cardName, vouchNo, vouchLab, createTime, updateTime, status)";
    var valSql = "";
    var sql = "";
    for (i=0; i<3; ++i) {
        if (i == 1) {
            a.test(); // 过意抛出异常，测试是否回滚；
        }
        console.log("i=" + i);
        valSql = " values('1" + i + "','测试卡" + i + "', '9', 'card9', '2016-03-31 13:30:00', '2016-03-31 13:30:00', 'Y');";
        sql += insertSql + valSql;
    }
//console.log(sql);
//db.run(sql); // run方法只执行第一条SQL语句！！！
    db.exec(sql); // 事实证明，事务可以这样实现！！！exec方法是执行所有语句！
}
//batchInsertTest2();

// 记录条数查询
function countTest(callback) {
    db.get("select count(*) as cnt from CardType",
        function(err, obj) {
            if (err) {
                console.log('fail on count ' + err);
                callback && callback(err);
            } else {
                callback && callback(obj);
            }
        });
}
countTest(function(obj) {
    console.log("count=" + obj.cnt);
});
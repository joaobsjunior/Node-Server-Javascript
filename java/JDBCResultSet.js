let java;
let path = require('path');
let _ = require('lodash');
let appUtil = require('../common/app-util');
let numRows = 5000;

class JDBCResultSet {
    constructor(rs, _java) {
        this.rs = rs;
        java = _java;
    }
    getObject() {
        let sqlTypes = java.import('java.sql.Types');
        let rsmd = this.rs.getMetaDataSync();
        let numColumns = rsmd.getColumnCountSync();
        let columnNames = new Array(numColumns);
        let columnTypes = new Array(numColumns);
        let arrayObjects = [];
        for (let i = 0; i < columnNames.length; i++) {
            columnNames[i] = rsmd.getColumnLabelSync(i + 1);
            columnTypes[i] = rsmd.getColumnTypeSync(i + 1);
        }
        this.rs.setFetchSizeSync(numRows);
        while (this.rs.nextSync()) {
            let obj = {};
            for (let i = 0; i < numColumns; i++) {
                switch (columnTypes[i]) {
                    case sqlTypes.ARRAY:
                        obj[columnNames[i]] = this.rs.getArraySync(columnNames[i]);
                        break;
                    case sqlTypes.BIGINT:
                        obj[columnNames[i]] = this.rs.getIntSync(columnNames[i]);
                        break;
                    case sqlTypes.BOOLEAN:
                        obj[columnNames[i]] = this.rs.getBooleanSync(columnNames[i]);
                        break;
                    case sqlTypes.BLOB:
                        obj[columnNames[i]] = this.rs.getBlobSync(columnNames[i]);
                        break;
                    case sqlTypes.DOUBLE:
                        obj[columnNames[i]] = this.rs.getDoubleSync(columnNames[i]);
                        break;
                    case sqlTypes.FLOAT:
                        obj[columnNames[i]] = this.rs.getFloatSync(columnNames[i]);
                        break;
                    case sqlTypes.INTEGER:
                        obj[columnNames[i]] = this.rs.getIntSync(columnNames[i]);
                        break;
                    case sqlTypes.NVARCHAR:
                        obj[columnNames[i]] = this.rs.getNStringSync(columnNames[i]);
                        break;
                    case sqlTypes.VARCHAR:
                        obj[columnNames[i]] = this.rs.getStringSync(columnNames[i]);
                        break;
                    case sqlTypes.TINYINT:
                        obj[columnNames[i]] = this.rs.getIntSync(columnNames[i]);
                        break;
                    case sqlTypes.SMALLINT:
                        obj[columnNames[i]] = this.rs.getIntSync(columnNames[i]);
                        break;
                    case sqlTypes.DATE:
                        obj[columnNames[i]] = this.rs.getDateSync(columnNames[i]);
                        break;
                    case sqlTypes.TIMESTAMP:
                        obj[columnNames[i]] = this.rs.getTimestampSync(columnNames[i]);
                        break;
                    default:
                        obj[columnNames[i]] = this.rs.getObjectSync(columnNames[i]);
                        break;
                }
            }
            arrayObjects.push(obj);
        }
        _.each(arrayObjects, o => _.each(o, (v, k) => {
            let value = _.trim(v);
            o[k] = appUtil.infereType(value);
        }));
        return arrayObjects;
    }
}
try {
    module.exports = exports = JDBCResultSet;
} catch (error) {
    exports = JDBCResultSet;
}
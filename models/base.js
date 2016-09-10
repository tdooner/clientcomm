const Promise = require("bluebird");
const db = require("../server/db");

class BaseModel {
  constructor(info) {
    
    this._info = info

    info.columns.map(name => {
      this[name] = info.data[name]
    })
  }

  static _checkModelValidity() {
    this._checkForTableName()
    this._checkForPrimaryId()
  }

  static _checkForTableName() {
      if(!this.tableName) {
        throw new Error("This model needs a tableName!")
      }    
  }

  static _checkForPrimaryId() {
      if(!this.primaryId) {
        throw new Error("This model needs a primaryId!")
      }    
  }

  static _getSingleResponse(objects, fulfill, reject) {
    if (!objects || objects.length === 0) {
      reject(new Error("nothing returned from db"))
    } else {
      // return class instance
      let instance = new this(objects[0])
      fulfill(instance)
    }
  }

  static findByID (id) {
    this._checkModelValidity()
    return new Promise((fulfill, reject) => {
      db(this.tableName)
      .where(this.primaryId, id)
      .limit(1)
      .then((objects) => {
        return this._getSingleResponse(objects, fulfill, reject)
      }).catch(reject)
    })
  }

  static findByEmail (email) {
    this._checkForTableName()
    return new Promise((fulfill, reject) => {
      db(this.tableName)
        .where("email", email)
        .limit(1)
      .then((objects) => {
        return this._getSingleResponse(objects, fulfill, reject)
      }).catch(reject);
    })
  }

}

module.exports = {BaseModel: BaseModel}
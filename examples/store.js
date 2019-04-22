const levelup = require('levelup');
const leveldown = require('leveldown');

class Store {
  /**
   * @param {string} dbName
   */
  constructor(dbName) {
    this.db = levelup(leveldown(dbName));
  }

  /**
   * @param {string} key
   * @param {string} value
   * @returns {Promise}
   */
  async put(key, value) {
    return new Promise((resolve, reject) => {
      this.db.put(key, value, (err) => {
        if(err) {
          return reject(err);
        }
        return resolve();
      })
    });
  }

  /**
   * @param {string} key
   * @returns {Promise<Buffer>}
   */
  async get(key) {
    return new Promise((resolve, reject) => {
      this.db.get(key, (err, value) => {
        if(err) {
          return reject(err);
        }
        return resolve(value);
      })
    });
  }

  /**
   * @param {string} userId
   * @returns {Promise<string[]>}
   */
  async getUserTransitions(userId) {
    let data;
    try {
      data = await this.get(`${userId}:transitions`);
    } catch (e) {
      if (!(e instanceof levelup.errors.NotFoundError)) {
        throw e;
      }
    }
    if (!data) {
      return [];
    }
    return data.toString().split(',');
  }

  /**
   * @param userId
   * @param transition
   * @returns {Promise<void>}
   */
  async addTransitionToUser(userId, transition) {
    const transitions = await this.getUserTransitions(userId);
    transitions.push(transition);
    await this.put(`${userId}:transitions`, transitions.join(','));
  }
}

/**
 * @param {string} name
 * @returns {Store}
 */
module.exports = function createStore(name) {
  return new Store(name);
};

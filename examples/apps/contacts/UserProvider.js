class UserProvider {
  /**
   * @param dapiClient
   * @param {Store} store
   */
  constructor(dapiClient, store) {
    this.api = dapiClient;
    this.store = store;
  }

  /**
   * @param {string} userId
   * @returns {Promise<string[]>}
   */
  async getTransitions(userId) {
    const { store, api } = this;
    const user = await api.getUserById(userId);
    console.log(user);

    const storedTransitions = await store.getUserTransitions(userId);
    if (user.subtx.length > storedTransitions.length) {
      await store.put(`${userId}:transitions`, user.subtx.join(','));
    } else if (user.subtx.length === storedTransitions.length) {
      storedTransitions.forEach((transition, index) => {
        if (transition !== user.subtx[index]) {
          throw new Error('Storage corrupted or reorg happened');
        }
      });
    }
    const transitions = await store.getUserTransitions(userId);
    console.log(transitions);
    return transitions;
  }

  /**
   * @param {string} userId
   * @param {string} transition
   * @returns {Promise<void>}
   */
  async addTransition(userId, transition) {
    return this.store.addTransitionToUser(userId, transition);
  }
}

module.exports = UserProvider;

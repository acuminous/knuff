class StubDriver {

  #name;
  #repositories = {};

  constructor(name) {
    this.#name = name;
  }

  repositories(id) {
    return this.#repositories[id] || this.#initRepository();
  }

  async findReminder(repository, reminder) {
    const key = this.#getRepositoryKey(repository.owner, repository.name);
    const { reminders } = this.#repositories[key] || this.#initRepository();
    return reminders.find((candidate) => candidate.labels.find((label) => label === reminder.id));
  }

  async createReminder(repository, reminder) {
    const key = this.#getRepositoryKey(repository.owner, repository.name);
    this.#repositories[key] = this.#repositories[key] || this.#initRepository();
    const labels = [].concat(reminder.labels || [], reminder.id);
    this.#repositories[key].reminders.push({ ...reminder, labels });
  }

  #getRepositoryKey(owner, name) {
    return `${owner}/${name}`;
  }

  #initRepository() {
    return { reminders: [] };
  }
}

module.exports = StubDriver;

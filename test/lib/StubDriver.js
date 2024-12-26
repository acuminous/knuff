const { DateTime } = require('luxon');

class StubDriver {

  #name;
  #repositories = {};

  constructor(name) {
    this.#name = name;
  }

  repositories(id) {
    return this.#repositories[id] || this.#initRepository();
  }

  async hasReminder(repository, reminder) {
    const key = this.#getRepositoryKey(repository.owner, repository.name);
    const { reminders } = this.#repositories[key] || this.#initRepository();
    return reminders.find((candidate) => {
      return candidate.labels.find((label) => label === this.#getKnuffIdLabel(reminder))
        && candidate.labels.find((label) => label === this.#getKnuffDateLabel(reminder));
    });
  }

  async createReminder(repository, reminder) {
    const key = this.#getRepositoryKey(repository.owner, repository.name);
    this.#repositories[key] = this.#repositories[key] || this.#initRepository();
    const labels = [].concat(reminder.labels || [], this.#getKnuffIdLabel(reminder), this.#getKnuffDateLabel(reminder));
    this.#repositories[key].reminders.push({ ...reminder, labels });
  }

  #getRepositoryKey(owner, name) {
    return `${owner}/${name}`;
  }

  #getKnuffIdLabel(reminder) {
    return `knuff:${reminder.id}`;
  }

  #getKnuffDateLabel(reminder) {
    return `knuff:${DateTime.fromJSDate(reminder.date).setZone(reminder.timezone).toFormat('yyyy-MM-dd')}`;
  }

  #initRepository() {
    return { reminders: [] };
  }
}

module.exports = StubDriver;

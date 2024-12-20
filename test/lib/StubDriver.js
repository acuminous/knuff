class StubDriver {

  #name;
  #repositories = {};

  constructor(name) {
    this.#name = name;
  }

  repositories(id) {
    return this.#repositories[id] || this.#initRepository();
  }

  async findIssue(repository, reminderId) {
    const key = this.#getRepositoryKey(repository.owner, repository.name);
    const { issues } = this.#repositories[key] || this.#initRepository();
    return issues.find((issue) => issue.labels.find((label) => label === reminderId));
  }

  async createIssue(repository, reminderId, issue) {
    const key = this.#getRepositoryKey(repository.owner, repository.name);
    this.#repositories[key] = this.#repositories[key] || this.#initRepository();
    const labels = [].concat(issue.labels || [], reminderId);
    this.#repositories[key].issues.push({ ...issue, labels });
  }

  #getRepositoryKey(owner, name) {
    return `${owner}/${name}`;
  }

  #initRepository() {
    return { issues: [] };
  }
}

module.exports = StubDriver;

const { RRule } = require('rrule');
const { real } = require('groundhog-day');

class Knuff {

  #config;
  #drivers;
  #clock;

  constructor(config, drivers, clock = real) {
    this.#config = config;
    this.#drivers = drivers;
    this.#clock = clock;
  }

  async process(reminders) {
    for (let i = 0; i < reminders.length; i++) {
      const reminder = reminders[i];
      const today = this.#getToday();
      const next = this.#getNextOccurence(reminder.schedule, today);
      if (this.#isSameDay(today, next)) await this.#ensureIssue(reminder);
    }
  }

  #getToday() {
    return new Date(new Date(this.#clock.now()).setHours(0, 0, 0, 0));
  }

  #getNextOccurence(schedule, today) {
    const rule = RRule.fromString(schedule);
    return rule.after(today, true);
  }

  #isSameDay(date1, date2) {
    return (
      date1?.getFullYear() === date2?.getFullYear()
      && date1?.getMonth() === date2?.getMonth()
      && date1?.getDate() === date2?.getDate()
    );
  }

  async #ensureIssue(reminder) {
    for (let j = 0; j < reminder.repositories.length; j++) {
      const repositoryId = reminder.repositories[j];
      const repository = this.#config.repositories[repositoryId];
      const driver = this.#drivers[repository.driver];
      const isDuplicate = await driver.findIssue(repository, reminder.id);
      if (!isDuplicate) await driver.createIssue(repository, reminder.id, reminder.issue);
    }
  }
}

module.exports = Knuff;

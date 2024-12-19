const EventEmitter = require('node:events');
const { RRule } = require('rrule');
const { real } = require('groundhog-day');
const Ajv = require('ajv');
const schema = require('./schema.json');

class Knuff extends EventEmitter {

  #config;
  #drivers;
  #clock;
  #ajvValidate;

  constructor(config, drivers, clock = real) {
    super();
    this.#config = config;
    this.#drivers = drivers;
    this.#clock = clock;
    this.#ajvValidate = new Ajv({ allErrors: true }).compile(schema);
  }

  async process(reminders) {
    const stats = { reminders: 0, errors: 0 };
    for (let i = 0; i < reminders.length; i++) {
      try {
        stats.reminders++;
        await this.#processReminder(reminders[i]);
      } catch (error) {
        stats.errors++;
        this.emit('error', error);
      }
    }
    if (stats.errors > 0) throw new Error(`${stats.errors} of ${stats.reminders} reminders could not be processed`);
    return { stats };
  }

  async #processReminder(reminder) {
    this.#validate(reminder);
    const today = this.#getToday();
    const next = this.#getNextOccurence(reminder, today);
    if (!this.#isSameDay(today, next)) return;
    await this.#ensureIssue(reminder);
  }

  #validate(reminder) {
    if (this.#ajvValidate(reminder)) return;
    const error = new Error(`Reminder '${reminder.id}' is invalid. See error.details for more information`);
    Object.assign(error, { details: this.#ajvValidate.errors });
    throw error;
  }

  #getToday() {
    return new Date(new Date(this.#clock.now()).setHours(0, 0, 0, 0));
  }

  #getNextOccurence(reminder, today) {
    try {
      const rule = RRule.fromString(reminder.schedule);
      return rule.after(today, true);
    } catch (cause) {
      throw new Error(`Reminder '${reminder.id}' has an invalid schedule '${reminder.schedule}'`, { cause });
    }
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
      if (!repository) throw new Error(`Reminder '${reminder.id}' has an unknown repository '${repositoryId}'`);
      const driver = this.#drivers[repository.driver];
      const isDuplicate = await driver.findIssue(repository, reminder.id);
      if (!isDuplicate) await driver.createIssue(repository, reminder.id, reminder.issue);
    }
  }
}

module.exports = Knuff;

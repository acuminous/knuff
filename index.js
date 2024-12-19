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
  #stats;

  constructor(config, drivers, clock = real) {
    super();
    this.#config = config;
    this.#drivers = drivers;
    this.#clock = clock;
    this.#ajvValidate = new Ajv({ allErrors: true }).compile(schema);
  }

  async process(reminders) {
    this.#stats = { reminders: 0, due: 0, duplicates: 0, created: 0, errors: 0 };
    for (let i = 0; i < reminders.length; i++) {
      try {
        this.#stats.reminders++;
        await this.#processReminder(reminders[i]);
      } catch (error) {
        this.#stats.errors++;
        this.emit('error', error);
      }
    }
    if (this.#stats.errors > 0) throw new Error(`${this.#stats.errors} of ${this.#stats.reminders} reminders could not be processed`);
    return this.#stats;
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
    this.#stats.due++;
    for (let j = 0; j < reminder.repositories.length; j++) {
      const repositoryId = reminder.repositories[j];
      const repository = this.#config.repositories[repositoryId];
      if (!repository) throw new Error(`Reminder '${reminder.id}' has an unknown repository '${repositoryId}'`);
      const driver = this.#drivers[repository.driver];
      const isDuplicate = await driver.findIssue(repository, reminder.id);
      if (isDuplicate) {
        this.#stats.duplicates++;
      } else {
        await driver.createIssue(repository, reminder.id, reminder.issue);
        this.#stats.created++;
      }
    }
  }
}

module.exports = Knuff;

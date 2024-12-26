const EventEmitter = require('node:events');
const { RRule } = require('rrule');
const { real } = require('groundhog-day');
const { DateTime } = require('luxon');
const Ajv = require('ajv');
const slugify = require('unique-slug');
const schema = require('./schema.json');

const defaults = {
  pretend: false,
  progress: 10,
  repositories: {},
};

class Knuff extends EventEmitter {

  #config;
  #drivers;
  #clock;
  #ajvValidate;
  #stats;

  constructor(config, drivers, clock = real) {
    super();
    this.#config = { ...defaults, ...config };
    this.#drivers = drivers;
    this.#clock = clock;
    this.#ajvValidate = new Ajv({ allErrors: true }).compile(schema);
  }

  async process(reminders) {
    this.#stats = { reminders: reminders.length, due: 0, duplicates: 0, created: 0, errors: 0 };
    for (let i = 0; i < reminders.length; i++) {
      try {
        await this.#processReminder({ ...reminders[i] });
        if ((i + 1) % this.#config.progress === 0) this.emit('progress', { ...this.#stats });
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
    this.#ensureId(reminder);
    this.#setDate(reminder);
    if (!reminder.date) return;
    await this.#ensureReminder(reminder);
  }

  #validate(reminder) {
    if (this.#ajvValidate(reminder)) return;
    const error = new Error(`Reminder '${reminder.id}' is invalid. See error.details for more information`);
    Object.assign(error, { details: this.#ajvValidate.errors });
    throw error;
  }

  #ensureId(reminder) {
    reminder.id = reminder.id || slugify(reminder.title, { lower: true });
  }

  #setDate(reminder) {
    const entry = this.#getReminderDate(reminder);
    Object.assign(reminder, entry);
  }

  #getReminderDate(reminder) {
    const before = new Date(this.#clock.now());
    return [].concat(reminder.schedule)
      .reduce(toOccurrences(reminder, before), [])
      .sort(inAscendingOrder)[0];
  }

  async #ensureReminder(reminder) {
    this.#stats.due++;
    for (let i = 0; i < reminder.repositories.length; i++) {
      const repository = this.#getRepository(reminder, reminder.repositories[i]);
      const driver = this.#drivers[repository.driver];
      const isDuplicate = await driver.hasReminder(repository, reminder);
      if (isDuplicate) {
        this.#stats.duplicates++;
      } else {
        if (!this.#config.pretend) await driver.createReminder(repository, reminder);
        this.#stats.created++;
      }
    }
  }

  #getRepository(reminder, repositoryId) {
    const repository = this.#config.repositories[repositoryId];
    if (!repository) throw new Error(`Reminder '${reminder.id}' has an unknown repository '${repositoryId}'`);
    return repository;
  }
}

function toOccurrences(reminder, before) {
  return (occurrences, schedule) => {
    try {
      const rule = RRule.fromString(schedule);
      const timezone = rule.options.tzid || 'UTC';
      const after = getStartOfDay(before, timezone);
      const dates = rule.between(after, before, true).map((date) => ({ date, timezone }));
      return occurrences.concat(dates);
    } catch (cause) {
      throw new Error(`Reminder '${reminder.id}' has an invalid schedule '${schedule}'`, { cause });
    }
  };
}

function getStartOfDay(date, tzid) {
  return DateTime.fromJSDate(date).setZone(tzid).startOf('day').toJSDate();
}

function inAscendingOrder(a, b) {
  return a.date - b.date;
}

module.exports = Knuff;

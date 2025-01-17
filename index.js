const debug = require('debug')('knuff');
const EventEmitter = require('node:events');
const { AsyncLocalStorage } = require('node:async_hooks');
const { RRule } = require('rrule');
const { DateTime, Settings } = require('luxon');
const Ajv = require('ajv');
const slugify = require('unique-slug');
const schema = require('./schema.json');

const als = new AsyncLocalStorage();

const defaults = {
  pretend: false,
  progress: 10,
  repositories: {},
};

class Knuff extends EventEmitter {

  #config;
  #drivers;
  #ajvValidate;
  #stats;

  constructor(config, drivers, now) {
    super();
    this.#config = { ...defaults, ...config };
    this.#drivers = drivers;
    this.#ajvValidate = new Ajv({ allErrors: true }).compile(schema);
    Settings.now = now || Settings.now;
  }

  async process(reminders) {
    this.#stats = { reminders: reminders.length, due: 0, duplicates: 0, created: 0, errors: 0 };
    for (let i = 0; i < reminders.length; i++) {
      try {
        await als.run({}, async () => {
          await this.#processReminder({ ...reminders[i] });
        });
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
    als.getStore().debug("Processing reminder with title='%s'", reminder.title);
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
    als.getStore().debug = debug.extend(reminder.id);
  }

  #setDate(reminder) {
    const occurrence = this.#getOccurrence(reminder);
    if (occurrence) {
      als.getStore().debug("Assigning reminder date '%s' and timezone '%s'", occurrence.date.toISOString(), occurrence.timezone);
      Object.assign(reminder, occurrence);
    }
  }

  #getOccurrence(reminder) {
    const now = DateTime.now().toJSDate();
    return [].concat(reminder.schedule)
      .reduce(toOccurrences(reminder, now), [])
      .sort(inAscendingOrder)[0];
  }

  async #ensureReminder(reminder) {
    this.#stats.due++;
    for (let i = 0; i < reminder.repositories.length; i++) {
      const repository = this.#getRepository(reminder, reminder.repositories[i]);
      const driver = this.#drivers[repository.driver];
      const isDuplicate = !this.#config.pretend && await driver.hasReminder(repository, reminder);
      if (isDuplicate) {
        als.getStore().debug("Found duplicate in repository '%s'", reminder.id, reminder.title, reminder.repositories[i]);
        this.#stats.duplicates++;
      } else {
        als.getStore().debug("Creating reminder in repository '%s'", reminder.repositories[i]);
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

function toOccurrences(reminder, now) {
  return (occurrences, schedule) => {
    const rule = parseRule(reminder, schedule);
    als.getStore().debug("Schedule is '%s'", schedule.replace(/\n/g, '\\n'));
    const timezone = rule.options.tzid;
    const startOfDay = getStartOfDay(now, timezone);
    als.getStore().debug('Getting occurrences between %s and %s inclusive', DateTime.fromJSDate(startOfDay).toLocaleString(DateTime.DATETIME_HUGE_WITH_SECONDS), DateTime.fromJSDate(now).toLocaleString(DateTime.DATETIME_HUGE_WITH_SECONDS));
    const dates = rule.between(startOfDay, now, true);
    als.getStore().debug('Found %d occurrences: [%s]', dates.length, dates.map((date) => date.toISOString()).join(', '));
    return occurrences.concat(dates.map((date) => ({ date, timezone })));
  };
}

function parseRule(reminder, schedule) {
  try {
    const options = RRule.parseString(schedule);
    // RRule dtstart defaults to the current time. Instead use Luxon to create the default so it can be stubbed
    const dtstart = DateTime.now().startOf('day').toJSDate();
    return new RRule({ dtstart, tzid: 'UTC', ...options });
  } catch (cause) {
    throw new Error(`Reminder '${reminder.id}' has an invalid schedule '${schedule}'`, { cause });
  }
}

function getStartOfDay(date, tzid) {
  return DateTime.fromJSDate(date).setZone(tzid).startOf('day').toJSDate();
}

function inAscendingOrder(a, b) {
  return a.date - b.date;
}

module.exports = Knuff;

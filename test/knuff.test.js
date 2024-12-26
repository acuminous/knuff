const { strictEqual: eq, rejects } = require('node:assert');
const { describe, it } = require('zunit');
const { fake: clock } = require('groundhog-day');
const opi = require('object-path-immutable');

const StubDriver = require('./lib/StubDriver');
const Knuff = require('..');

describe('knuff', () => {

  const repositories = {
    'acuminous/foo': {
      owner: 'acuminous',
      name: 'foo',
      driver: 'github',
    },
    'acuminous/bar': {
      owner: 'acuminous',
      name: 'bar',
      driver: 'github',
    },
    'acuminous/baz': {
      owner: 'acuminous',
      name: 'baz',
      driver: 'gitlab',
    },
  };

  const bumpDependencies = {
    id: 'bump-dependencies',
    schedule: 'DTSTART;TZID=Europe/London:20241219T080000;\nRRULE:FREQ=DAILY;COUNT=1',
    title: 'Bump Dependencies',
    body: 'Bump dependencies for all projects',
    repositories: [
      'acuminous/foo',
    ],
  };

  const auditDependencies = {
    id: 'audit-dependencies',
    schedule: 'DTSTART;TZID=Europe/London:20241219T080000;\nRRULE:FREQ=DAILY;COUNT=1',
    title: 'Audit Dependencies',
    body: 'Run npm audit --fix',
    repositories: [
      'acuminous/foo',
    ],
  };

  clock.fix('2024-01-01T11:00:00.000Z');

  describe('dsl', () => {

    it('should allow an id', async () => {
      const driver = new StubDriver('github');
      const knuff = getKnuff({}, { github: driver });
      const reminders = [
        opi.set(bumpDependencies, 'id', 'i-love-reminders'),
      ];

      await knuff.process(reminders);
    });

    it('should require the id to be a string', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'id', 1),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder '1' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, 'must be string');
        return true;
      });
    });

    it('should allow a description', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'description', 'Some description'),
      ];

      await knuff.process(reminders);
    });

    it('should require the description to be a string', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'description', 1),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, 'must be string');
        return true;
      });
    });

    it('should require a schedule', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.del(bumpDependencies, 'schedule'),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, "must have required property 'schedule'");
        return true;
      });
    });

    it('should allow the schedule to be a string', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'schedule', 1),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 3);
        eq(error.details[0].message, 'must be string');
        eq(error.details[1].message, 'must be array');
        eq(error.details[2].message, 'must match exactly one schema in oneOf');
        return true;
      });
    });

    it('should allow the schedule to be an array', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'schedule', [
          'DTSTART;TZID=Europe/London:20241219T080000;\nRRULE:FREQ=DAILY;COUNT=1',
          'DTSTART;TZID=Europe/London:20250319T080000;\nRRULE:FREQ=DAILY;COUNT=1',
        ]),
      ];

      await knuff.process(reminders);
    });

    it('should require the schedule items to be strings', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'schedule', [1]),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 3);
        eq(error.details[0].message, 'must be string');
        eq(error.details[1].message, 'must be string');
        eq(error.details[2].message, 'must match exactly one schema in oneOf');
        return true;
      });
    });

    it('should require the schedule items to be unique', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'schedule', [
          'DTSTART;TZID=Europe/London:20241219T080000;\nRRULE:FREQ=DAILY;COUNT=1',
          'DTSTART;TZID=Europe/London:20241219T080000;\nRRULE:FREQ=DAILY;COUNT=1',
        ]),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 3);
        eq(error.details[0].message, 'must be string');
        eq(error.details[1].message, 'must NOT have duplicate items (items ## 1 and 0 are identical)');
        eq(error.details[2].message, 'must match exactly one schema in oneOf');
        return true;
      });
    });

    it('should require a title', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.del(bumpDependencies, 'title'),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, "must have required property 'title'");
        return true;
      });
    });

    it('should require the title to be a string', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'title', 1),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, 'must be string');
        return true;
      });
    });

    it('should require a body', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.del(bumpDependencies, 'body'),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, "must have required property 'body'");
        return true;
      });
    });

    it('should require the body to be a string', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'body', 1),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, 'must be string');
        return true;
      });
    });

    it('should allow labels', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'labels', []),
      ];

      await knuff.process(reminders);
    });

    it('should require the labels to be strings', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'labels', [1]),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, 'must be string');
        return true;
      });
    });

    it('should require labels to be unique', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'labels', ['one', 'one']),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, 'must NOT have duplicate items (items ## 1 and 0 are identical)');
        return true;
      });
    });

    it('should require repositories', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.del(bumpDependencies, 'repositories'),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, "must have required property 'repositories'");
        return true;
      });
    });

    it('should require at least one repository', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'repositories', []),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, 'must NOT have fewer than 1 items');
        return true;
      });
    });

    it('should require repositories to be strings', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'repositories', [1]),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, 'must be string');
        return true;
      });
    });

    it('should require repositories to be unique', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'repositories', ['one', 'one']),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, 'must NOT have duplicate items (items ## 1 and 0 are identical)');
        return true;
      });
    });

    it('should report unknown reminder attributes', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'wibble', 1),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, 'must NOT have additional properties');
        return true;
      });
    });
  });

  describe('process', () => {

    it('should create a reminder when the next occurrence is today', async () => {
      const today = new Date(clock.now());
      const driver = new StubDriver('github');
      const knuff = getKnuff({}, { github: driver });

      const reminders = [
        opi.set(bumpDependencies, 'schedule', `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`),
        opi.set(auditDependencies, 'schedule', `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`),
      ];
      await knuff.process(reminders);

      const fooReminders = driver.repositories('acuminous/foo').reminders;
      eq(fooReminders.length, 2);
      eq(fooReminders[0].title, 'Bump Dependencies');
      eq(fooReminders[0].body, 'Bump dependencies for all projects');
      eq(fooReminders[0].date.toISOString(), '2024-01-01T11:00:00.000Z');
      eq(fooReminders[0].timezone, Intl.DateTimeFormat().resolvedOptions().timeZone);
      eq(fooReminders[1].title, 'Audit Dependencies');
      eq(fooReminders[1].body, 'Run npm audit --fix');
      eq(fooReminders[1].date.toISOString(), '2024-01-01T11:00:00.000Z');
      eq(fooReminders[1].timezone, Intl.DateTimeFormat().resolvedOptions().timeZone);
    });

    it('should create a reminder when there are multiple schedules all with the next occurrences being today', async () => {
      const today1 = new Date(clock.now());
      const today2 = new Date(today1.getTime() + 1000);
      const driver = new StubDriver('github');
      const knuff = getKnuff({}, { github: driver });

      const reminders = [
        opi.set(bumpDependencies, 'schedule', [
          `DTSTART;TZID=Europe/London:${dtstart(today1)};\nRRULE:FREQ=DAILY;COUNT=1`,
          `DTSTART;TZID=Europe/London:${dtstart(today2)};\nRRULE:FREQ=DAILY;COUNT=1`,
        ]),
      ];
      await knuff.process(reminders);

      const fooReminders = driver.repositories('acuminous/foo').reminders;
      eq(fooReminders.length, 1);
      eq(fooReminders[0].title, 'Bump Dependencies');
      eq(fooReminders[0].body, 'Bump dependencies for all projects');
      eq(fooReminders[0].date.toISOString(), '2024-01-01T11:00:00.000Z');
      eq(fooReminders[0].timezone, Intl.DateTimeFormat().resolvedOptions().timeZone);
    });

    it('should create a reminder when there are two schedules but only the first schedules next occurrence is today', async () => {
      const today = new Date(clock.now());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const driver = new StubDriver('github');
      const knuff = getKnuff({}, { github: driver });

      const reminders = [
        opi.set(bumpDependencies, 'schedule', [
          `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`,
          `DTSTART;TZID=Europe/London:${dtstart(tomorrow)};\nRRULE:FREQ=DAILY;COUNT=1`,
        ]),
      ];
      await knuff.process(reminders);

      const fooReminders = driver.repositories('acuminous/foo').reminders;
      eq(fooReminders.length, 1);
      eq(fooReminders[0].title, 'Bump Dependencies');
      eq(fooReminders[0].body, 'Bump dependencies for all projects');
      eq(fooReminders[0].date.toISOString(), '2024-01-01T11:00:00.000Z');
      eq(fooReminders[0].timezone, Intl.DateTimeFormat().resolvedOptions().timeZone);
    });

    it('should create a reminder when there are two schedules but only the second schedules next occurrence is today', async () => {
      const today = new Date(clock.now());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const driver = new StubDriver('github');
      const knuff = getKnuff({}, { github: driver });

      const reminders = [
        opi.set(bumpDependencies, 'schedule', [
          `DTSTART;TZID=Europe/London:${dtstart(tomorrow)};\nRRULE:FREQ=DAILY;COUNT=1`,
          `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`,
        ]),
      ];
      await knuff.process(reminders);

      const fooReminders = driver.repositories('acuminous/foo').reminders;
      eq(fooReminders.length, 1);
      eq(fooReminders[0].title, 'Bump Dependencies');
      eq(fooReminders[0].body, 'Bump dependencies for all projects');
      eq(fooReminders[0].date.toISOString(), '2024-01-01T11:00:00.000Z');
      eq(fooReminders[0].timezone, Intl.DateTimeFormat().resolvedOptions().timeZone);
    });

    it('should not create reminders when the next occurrence is after today', async () => {
      const today = new Date(clock.now());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const driver = new StubDriver('github');
      const knuff = getKnuff({}, { github: driver });

      const reminders = [
        opi.set(bumpDependencies, 'schedule', `DTSTART;TZID=Europe/London:${dtstart(tomorrow)};\nRRULE:FREQ=DAILY;COUNT=1`),
      ];
      await knuff.process(reminders);

      const fooReminders = driver.repositories('acuminous/foo').reminders;
      eq(fooReminders.length, 0);
    });

    it('should not create reminders when the last occurrence was before today', async () => {
      const today = new Date(clock.now());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const driver = new StubDriver('github');
      const knuff = getKnuff({}, { github: driver });

      const reminders = [
        opi.set(bumpDependencies, 'schedule', `DTSTART;TZID=Europe/London:${dtstart(yesterday)};\nRRULE:FREQ=DAILY;COUNT=1`),
      ];
      await knuff.process(reminders);

      const fooReminders = driver.repositories('acuminous/foo').reminders;
      eq(fooReminders.length, 0);
    });

    it('should default the id to the sluggified title', async () => {
      const today = new Date(clock.now());
      const driver = new StubDriver('github');
      const knuff = getKnuff({}, { github: driver });
      const reminders = [
        opi.wrap(bumpDependencies)
          .del('id')
          .set('title', 'I ♥ Reminders')
          .set('schedule', `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`)
          .value(),
      ];

      await knuff.process(reminders);

      const fooReminders = driver.repositories('acuminous/foo').reminders;
      eq(fooReminders.length, 1);
      eq(fooReminders[0].id, 'i-love-reminders');
    });

    it('should add the specified labels', async () => {
      const today = new Date(clock.now());
      const driver = new StubDriver('github');
      const knuff = getKnuff({}, { github: driver });

      const reminders = [
        opi.wrap(bumpDependencies)
          .set('schedule', `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`)
          .set('labels', ['chore', 'reminder'])
          .value(),
      ];
      await knuff.process(reminders);

      const fooReminders = driver.repositories('acuminous/foo').reminders;
      eq(fooReminders.length, 1);
      eq(fooReminders[0].labels.length, 4);
      eq(fooReminders[0].labels[0], 'chore');
      eq(fooReminders[0].labels[1], 'reminder');
      eq(fooReminders[0].labels[2], 'knuff:bump-dependencies');
      eq(fooReminders[0].labels[3], 'knuff:2024-01-01');
    });

    it('should create reminders in all specified repositories', async () => {
      const today = new Date(clock.now());
      const driver = new StubDriver('github');
      const knuff = getKnuff({}, { github: driver });

      const reminders = [
        opi.wrap(bumpDependencies)
          .set('schedule', `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`)
          .set('repositories', ['acuminous/foo', 'acuminous/bar'])
          .value(),
      ];
      await knuff.process(reminders);

      const fooReminders = driver.repositories('acuminous/foo').reminders;
      eq(fooReminders.length, 1);

      const barReminders = driver.repositories('acuminous/bar').reminders;
      eq(barReminders.length, 1);
    });

    it('should create reminders using the correct driver', async () => {
      const today = new Date(clock.now());
      const driver1 = new StubDriver('github');
      const driver2 = new StubDriver('gitlab');
      const drivers = { github: driver1, gitlab: driver2 };
      const knuff = new Knuff({ repositories }, drivers, clock);

      const reminders = [
        opi.wrap(bumpDependencies)
          .set('schedule', `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`)
          .set('repositories', ['acuminous/foo', 'acuminous/baz'])
          .value(),
      ];
      await knuff.process(reminders);

      const githubReminders = driver1.repositories('acuminous/baz').reminders;
      eq(githubReminders.length, 0);

      const gitlabReminders = driver2.repositories('acuminous/baz').reminders;
      eq(gitlabReminders.length, 1);
    });

    it('should suppress duplicate reminders', async () => {
      const today = new Date(clock.now());
      const driver = new StubDriver('github');
      const knuff = getKnuff({}, { github: driver });

      const reminders = [
        opi.set(bumpDependencies, 'schedule', `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`),
        opi.set(bumpDependencies, 'schedule', `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`),
      ];
      await knuff.process(reminders);

      const fooReminders = driver.repositories('acuminous/foo').reminders;
      eq(fooReminders.length, 1);
      eq(fooReminders[0].title, 'Bump Dependencies');
      eq(fooReminders[0].body, 'Bump dependencies for all projects');
    });

    it('should respect the reminder time zone (end of day before reminder)', async () => {
      /* eslint-disable-next-line camelcase */
      const end_of_dec_31st_2023_Sydney = new Date('2023-12-31T12:59:00.000Z');
      clock.fix(end_of_dec_31st_2023_Sydney);

      const driver = new StubDriver('github');
      const knuff = getKnuff({}, { github: driver });

      const reminders = [
        opi.set(bumpDependencies, 'schedule', 'DTSTART;TZID=Australia/Sydney:20240101T000000;\nRRULE:FREQ=DAILY;COUNT=1'),
      ];
      await knuff.process(reminders);

      const fooReminders = driver.repositories('acuminous/foo').reminders;
      eq(fooReminders.length, 0);
    });

    it('should respect the reminder time zone (start of reminder day)', async () => {
      /* eslint-disable-next-line camelcase */
      const start_of_jan_1st_2024_Sydney = new Date('2023-12-31T13:00:00.000Z');
      clock.fix(start_of_jan_1st_2024_Sydney);
      const driver = new StubDriver('github');
      const knuff = getKnuff({}, { github: driver });

      const reminders = [
        opi.set(bumpDependencies, 'schedule', 'DTSTART;TZID=Australia/Sydney:20240101T000000;\nRRULE:FREQ=DAILY;COUNT=1'),
      ];
      await knuff.process(reminders);

      const fooReminders = driver.repositories('acuminous/foo').reminders;
      eq(fooReminders.length, 1);
      eq(fooReminders[0].date.toISOString(), '2023-12-31T13:00:00.000Z');
      eq(fooReminders[0].timezone, 'Australia/Sydney');
      eq(fooReminders[0].labels[1], 'knuff:2024-01-01');
    });

    it('should respect the reminder time zone (end of reminder day)', async () => {
      /* eslint-disable-next-line camelcase */
      const end_of_jan_1st_2024_Sydney = new Date('2024-01-01T12:59:00.000Z');
      clock.fix(end_of_jan_1st_2024_Sydney);
      const driver = new StubDriver('github');
      const knuff = getKnuff({}, { github: driver });

      const reminders = [
        opi.set(bumpDependencies, 'schedule', 'DTSTART;TZID=Australia/Sydney:20240101T000000;\nRRULE:FREQ=DAILY;COUNT=1'),
      ];
      await knuff.process(reminders);

      const fooReminders = driver.repositories('acuminous/foo').reminders;
      eq(fooReminders.length, 1);
      eq(fooReminders[0].date.toISOString(), '2023-12-31T13:00:00.000Z');
      eq(fooReminders[0].timezone, 'Australia/Sydney');
      eq(fooReminders[0].labels[1], 'knuff:2024-01-01');
    });

    it('should respect the reminder time zone (start of day after reminder)', async () => {
      /* eslint-disable-next-line camelcase */
      const start_of_jan_2nd_2024_Sydney = new Date('2024-01-01T13:00:00.000Z');
      clock.fix(start_of_jan_2nd_2024_Sydney);
      const driver = new StubDriver('github');
      const knuff = getKnuff({}, { github: driver });

      const reminders = [
        opi.set(bumpDependencies, 'schedule', 'DTSTART;TZID=Australia/Sydney:20240101T000000;\nRRULE:FREQ=DAILY;COUNT=1'),
      ];
      await knuff.process(reminders);

      const fooReminders = driver.repositories('acuminous/foo').reminders;
      eq(fooReminders.length, 0);
    });
  });

  describe('error handling', () => {

    it('should report missing repositories', async () => {
      const today = new Date(clock.now());
      const driver = new StubDriver('github');
      const knuff = getKnuff({}, { github: driver });

      const reminders = [
        opi.wrap(bumpDependencies)
          .set('schedule', `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`)
          .set('repositories', ['acuminous/meh'])
          .value(),
      ];

      const errors = [];
      knuff.on('error', (error) => errors.push(error));

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, '1 of 1 reminders could not be processed');
        return true;
      });

      eq(errors.length, 1);
      eq(errors[0].message, "Reminder 'bump-dependencies' has an unknown repository 'acuminous/meh'");
    });

    it('should report invalid schedules', async () => {
      const driver = new StubDriver('github');
      const knuff = getKnuff({}, { github: driver });

      const reminders = [
        opi.set(bumpDependencies, 'schedule', 'DTSTART:20241201T08x000Z;\nRRULE:FREQ=DAILY;COUNT=1'),
      ];

      const errors = [];
      knuff.on('error', (error) => errors.push(error));

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, '1 of 1 reminders could not be processed');
        return true;
      });

      eq(errors.length, 1);
      eq(errors[0].message, "Reminder 'bump-dependencies' has an invalid schedule 'DTSTART:20241201T08x000Z;\nRRULE:FREQ=DAILY;COUNT=1'");
      eq(errors[0].cause.message, 'Invalid UNTIL value: 20241201T08x000Z');
    });

    it('should continue on failure', async () => {
      const today = new Date(clock.now());
      const driver = new StubDriver('github');
      const knuff = getKnuff({}, { github: driver });

      const reminders = [
        opi.wrap(bumpDependencies)
          .set('schedule', `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`)
          .set('repositories', ['acuminous/meh'])
          .value(),
        opi.wrap(auditDependencies)
          .set('schedule', `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`)
          .value(),
      ];

      const errors = [];
      knuff.on('error', (error) => errors.push(error));

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, '1 of 2 reminders could not be processed');
        return true;
      });

      eq(errors.length, 1);
      eq(errors[0].message, "Reminder 'bump-dependencies' has an unknown repository 'acuminous/meh'");

      const fooReminders = driver.repositories('acuminous/foo').reminders;
      eq(fooReminders.length, 1);
      eq(fooReminders[0].title, 'Audit Dependencies');
      eq(fooReminders[0].body, 'Run npm audit --fix');
    });
  });

  describe('stats', () => {
    it('should report stats', async () => {
      const today = new Date(clock.now());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const knuff = getKnuff();

      const reminders = [
        opi.set(bumpDependencies, 'schedule', `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`),
        opi.set(bumpDependencies, 'schedule', `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`),
        opi.set(auditDependencies, 'schedule', `DTSTART;TZID=Europe/London:${dtstart(tomorrow)};\nRRULE:FREQ=DAILY;COUNT=1`),
      ];

      const stats = await knuff.process(reminders);
      eq(stats.reminders, 3);
      eq(stats.due, 2);
      eq(stats.duplicates, 1);
      eq(stats.created, 1);
      eq(stats.errors, 0);
    });
  });

  describe('pretend', () => {
    it('should pretend to create reminders', async () => {
      const today = new Date(clock.now());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const driver = new StubDriver('github');
      const knuff = getKnuff({ pretend: true }, { github: driver });

      const reminders = [
        opi.set(bumpDependencies, 'schedule', `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`),
        opi.set(bumpDependencies, 'schedule', `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`),
        opi.set(auditDependencies, 'schedule', `DTSTART;TZID=Europe/London:${dtstart(tomorrow)};\nRRULE:FREQ=DAILY;COUNT=1`),
      ];

      const stats = await knuff.process(reminders);
      eq(stats.reminders, 3);
      eq(stats.due, 2);
      eq(stats.duplicates, 0);
      eq(stats.created, 2);
      eq(stats.errors, 0);

      const fooReminders = driver.repositories('acuminous/foo').reminders;
      eq(fooReminders.length, 0);
    });
  });

  describe('progress', () => {
    it('should report progress every 10 reminders by default', async () => {
      const today = new Date(clock.now());
      const driver = new StubDriver('github');
      const knuff = getKnuff({}, { github: driver });

      const reminders = new Array(100).fill().map((_, index) => {
        return opi.wrap(bumpDependencies)
          .set('id', `reminder-${index + 1}`)
          .set('schedule', `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`)
          .value();
      });

      const reports = [];
      knuff.on('progress', (stats) => reports.push(stats));

      await knuff.process(reminders);
      eq(reports.length, 10);
      eq(reports[0].due, 10);
    });

    it('should report progress every N reminders when specified', async () => {
      const today = new Date(clock.now());
      const driver = new StubDriver('github');
      const drivers = { github: driver };
      const knuff = new Knuff({ progress: 50, repositories }, drivers, clock);

      const reminders = new Array(100).fill().map((_, index) => {
        return opi.wrap(bumpDependencies)
          .set('id', `reminder-${index + 1}`)
          .set('schedule', `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`)
          .value();
      });

      const reports = [];
      knuff.on('progress', (stats) => reports.push(stats));

      await knuff.process(reminders);
      eq(reports.length, 2);
      eq(reports[0].due, 50);
    });
  });

  function getKnuff(config = {}, drivers = getDrivers()) {
    return new Knuff({ ...config, repositories }, drivers, clock);
  }

  function getDrivers() {
    const driver = new StubDriver('github');
    return { github: driver };
  }

  function dtstart(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  }
});

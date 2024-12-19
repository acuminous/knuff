const { strictEqual: eq, rejects } = require('node:assert');
const { describe, it } = require('zunit');
const { fake: clock } = require('groundhog-day');
const opi = require('object-path-immutable');

const StubDriver = require('./lib/StubDriver');
const Knuff = require('..');

describe('knuff', () => {

  const repositories = {
    'acuminous/foo': {
      organisation: 'acuminous',
      name: 'foo',
      driver: 'github',
    },
    'acuminous/bar': {
      organisation: 'acuminous',
      name: 'bar',
      driver: 'github',
    },
    'acuminous/baz': {
      organisation: 'acuminous',
      name: 'baz',
      driver: 'gitlab',
    },
  };

  const bumpDependencies = {
    id: 'bump-dependencies',
    schedule: 'DTSTART;TZID=Europe/London:20241219T080000;\nRRULE:FREQ=DAILY;COUNT=1',
    issue: {
      title: 'Bump Dependencies',
      body: 'Bump dependencies for all projects',
    },
    repositories: [
      'acuminous/foo',
    ],
  };

  describe('dsl', () => {

    it('should require an id', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.del(bumpDependencies, 'id'),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'undefined' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, "must have required property 'id'");
        return true;
      });
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

    it('should require the schedule to be a string', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'schedule', 1),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, 'must be string');
        return true;
      });
    });

    it('should require an issue title', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.del(bumpDependencies, 'issue.title'),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, "must have required property 'title'");
        return true;
      });
    });

    it('should require the issue title to be a string', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'issue.title', 1),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, 'must be string');
        return true;
      });
    });

    it('should require an issue body', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.del(bumpDependencies, 'issue.body'),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, "must have required property 'body'");
        return true;
      });
    });

    it('should require the issue body to be a string', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'issue.body', 1),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, 'must be string');
        return true;
      });
    });

    it('should allow issue labels', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'issue.labels', []),
      ];

      await knuff.process(reminders);
    });

    it('should require the labels to be strings', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'issue.labels', [1]),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, 'must be string');
        return true;
      });
    });

    it('should require issue labels to be unique', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'issue.labels', ['one', 'one']),
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

    it('should report unknown issue attributes', async () => {
      const knuff = getKnuff();
      const reminders = [
        opi.set(bumpDependencies, 'issue.wibble', 1),
      ];

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, "Reminder 'bump-dependencies' is invalid. See error.details for more information");
        eq(error.details.length, 1);
        eq(error.details[0].message, 'must NOT have additional properties');
        return true;
      });
    });
  });

  describe('issue creation', () => {

    it('should create issues when the next occurence is today', async () => {
      const today = new Date(clock.now());
      const driver = new StubDriver('github');
      const drivers = { github: driver };
      const knuff = new Knuff({ repositories }, drivers, clock);

      const reminders = [
        {
          id: 'bump-dependencies',
          schedule: `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`,
          issue: {
            title: 'Bump Dependencies',
            body: 'Bump dependencies for all projects',
          },
          repositories: [
            'acuminous/foo',
          ],
        },
        {
          id: 'audit-dependencies',
          schedule: `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`,
          issue: {
            title: 'Audit Dependencies',
            body: 'Run npm audit --fix',
          },
          repositories: [
            'acuminous/foo',
          ],
        },
      ];
      await knuff.process(reminders);

      const issues = driver.repositories('acuminous/foo').issues;
      eq(issues.length, 2);
      eq(issues[0].title, 'Bump Dependencies');
      eq(issues[0].body, 'Bump dependencies for all projects');
      eq(issues[1].title, 'Audit Dependencies');
      eq(issues[1].body, 'Run npm audit --fix');
    });

    it('should not create issues when the next occurence is after today', async () => {
      const today = new Date(clock.now());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const driver = new StubDriver('github');
      const drivers = { github: driver };
      const knuff = new Knuff({ repositories }, drivers, clock);

      const reminders = [
        {
          id: 'bump-dependencies',
          schedule: `DTSTART;TZID=Europe/London:${dtstart(tomorrow)};\nRRULE:FREQ=DAILY;COUNT=1`,
          issue: {
            title: 'Bump Dependencies',
            body: 'Bump dependencies for all projects',
          },
          repositories: [
            'acuminous/foo',
          ],
        },
      ];
      await knuff.process(reminders);

      const issues = driver.repositories('acuminous/foo').issues;
      eq(issues.length, 0);
    });

    it('should not create issues when the last occurrence was before today', async () => {
      const today = new Date(clock.now());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const driver = new StubDriver('github');
      const drivers = { github: driver };
      const knuff = new Knuff({ repositories }, drivers, clock);

      const reminders = [
        {
          id: 'bump-dependencies',
          schedule: `DTSTART;TZID=Europe/London:${dtstart(yesterday)};\nRRULE:FREQ=DAILY;COUNT=1`,
          issue: {
            title: 'Bump Dependencies',
            body: 'Bump dependencies for all projects',
          },
          repositories: [
            'acuminous/foo',
          ],
        },
      ];
      await knuff.process(reminders);

      const issues = driver.repositories('acuminous/foo').issues;
      eq(issues.length, 0);
    });

    it('should add the specified labels', async () => {
      const today = new Date(clock.now());
      const driver = new StubDriver('github');
      const drivers = { github: driver };
      const knuff = new Knuff({ repositories }, drivers, clock);

      const reminders = [
        {
          id: 'bump-dependencies',
          schedule: `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`,
          issue: {
            title: 'Bump Dependencies',
            body: 'Bump dependencies for all projects',
            labels: [
              'chore',
              'reminder',
            ],
          },
          repositories: [
            'acuminous/foo',
          ],
        },
      ];
      await knuff.process(reminders);

      const issues = driver.repositories('acuminous/foo').issues;
      eq(issues.length, 1);
      eq(issues[0].labels.length, 3);
      eq(issues[0].labels[0], 'chore');
      eq(issues[0].labels[1], 'reminder');
      eq(issues[0].labels[2], 'bump-dependencies');
    });

    it('should create issues in all specified repositories', async () => {
      const today = new Date(clock.now());
      const driver = new StubDriver('github');
      const drivers = { github: driver };
      const knuff = new Knuff({ repositories }, drivers, clock);

      const reminders = [
        {
          id: 'bump-dependencies',
          schedule: `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`,
          issue: {
            title: 'Bump Dependencies',
            body: 'Bump dependencies for all projects',
          },
          repositories: [
            'acuminous/foo',
            'acuminous/bar',
          ],
        },
      ];
      await knuff.process(reminders);

      const fooIssues = driver.repositories('acuminous/foo').issues;
      eq(fooIssues.length, 1);

      const barIssues = driver.repositories('acuminous/bar').issues;
      eq(barIssues.length, 1);
    });

    it('should create issues using the correct driver', async () => {
      const today = new Date(clock.now());
      const driver1 = new StubDriver('github');
      const driver2 = new StubDriver('gitlab');
      const drivers = { github: driver1, gitlab: driver2 };
      const knuff = new Knuff({ repositories }, drivers, clock);

      const reminders = [
        {
          id: 'bump-dependencies',
          schedule: `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`,
          issue: {
            title: 'Bump Dependencies',
            body: 'Bump dependencies for all projects',
          },
          repositories: [
            'acuminous/foo',
            'acuminous/baz',
          ],
        },
      ];
      await knuff.process(reminders);

      const githubIssues = driver1.repositories('acuminous/baz').issues;
      eq(githubIssues.length, 0);

      const gitlabIssues = driver2.repositories('acuminous/baz').issues;
      eq(gitlabIssues.length, 1);
    });

    it('should suppress duplicate issues', async () => {
      const today = new Date(clock.now());
      const driver = new StubDriver('github');
      const drivers = { github: driver };
      const knuff = new Knuff({ repositories }, drivers, clock);

      const reminders = [
        {
          id: 'bump-dependencies',
          schedule: `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`,
          issue: {
            title: 'Bump Dependencies',
            body: 'Bump dependencies for all projects',
          },
          repositories: [
            'acuminous/foo',
          ],
        },
        {
          id: 'bump-dependencies',
          schedule: `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`,
          issue: {
            title: 'Bump Dependencies',
            body: 'Bump dependencies for all projects',
          },
          repositories: [
            'acuminous/foo',
          ],
        },
      ];
      await knuff.process(reminders);

      const issues = driver.repositories('acuminous/foo').issues;
      eq(issues.length, 1);
      eq(issues[0].title, 'Bump Dependencies');
      eq(issues[0].body, 'Bump dependencies for all projects');
    });
  });

  describe('error handling', () => {

    it('should report missing repositories', async () => {
      const today = new Date(clock.now());
      const driver = new StubDriver('github');
      const drivers = { github: driver };
      const knuff = new Knuff({ repositories }, drivers, clock);

      const reminders = [
        {
          id: 'bump-dependencies',
          schedule: `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`,
          issue: {
            title: 'Bump Dependencies',
            body: 'Bump dependencies for all projects',
          },
          repositories: [
            'acuminous/meh',
          ],
        },
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
      const drivers = { github: driver };
      const knuff = new Knuff({ repositories }, drivers, clock);

      const reminders = [
        {
          id: 'bump-dependencies',
          schedule: 'DTSTART:20241201T08x000Z;\nRRULE:FREQ=DAILY;COUNT=1',
          issue: {
            title: 'Bump Dependencies',
            body: 'Bump dependencies for all projects',
          },
          repositories: [
            'acuminous/foo',
          ],
        },
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
      const drivers = { github: driver };
      const knuff = new Knuff({ repositories }, drivers, clock);

      const reminders = [
        {
          id: 'bump-dependencies',
          schedule: `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`,
          issue: {
            title: 'Bump Dependencies',
            body: 'Bump dependencies for all projects',
          },
          repositories: [
            'acuminous/meh',
          ],
        },
        {
          id: 'audit-dependencies',
          schedule: `DTSTART;TZID=Europe/London:${dtstart(today)};\nRRULE:FREQ=DAILY;COUNT=1`,
          issue: {
            title: 'Audit Dependencies',
            body: 'Run npm audit --fix',
          },
          repositories: [
            'acuminous/foo',
          ],
        },
      ];

      const errors = [];
      knuff.on('error', (error) => errors.push(error));

      await rejects(() => knuff.process(reminders), (error) => {
        eq(error.message, '1 of 2 reminders could not be processed');
        return true;
      });

      eq(errors.length, 1);
      eq(errors[0].message, "Reminder 'bump-dependencies' has an unknown repository 'acuminous/meh'");

      const issues = driver.repositories('acuminous/foo').issues;
      eq(issues.length, 1);
      eq(issues[0].title, 'Audit Dependencies');
      eq(issues[0].body, 'Run npm audit --fix');
    });
  });

  function getKnuff() {
    const driver = new StubDriver('github');
    const drivers = { github: driver };
    return new Knuff({ repositories }, drivers, clock);
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

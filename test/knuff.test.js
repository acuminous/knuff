const { strictEqual: eq } = require('node:assert');
const { describe, it } = require('zunit');
const { fake: clock } = require('groundhog-day');

const StubDriver = require('./lib/StubDriver');
const { Knuff } = require('..');

describe('knuff', () => {

  describe('dsl', () => {
    it('should require a schedule');
    it('should require an issue title');
    it('should require an issue body');
    it('should allow one or more issue lables');
    it('should require at least one repository');
    it('should allow multiple repositories');
    it('should report unknown issue attributes');
  });

  describe('issue creation', () => {

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
    it('should report missing repositories');
    it('should report repositories without auth credentials');
    it('should report invalid schedules');
    it('should continue on failure');
    it('should report all failures');
  });

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

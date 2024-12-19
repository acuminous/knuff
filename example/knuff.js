/* eslint-disable no-console, import/no-extraneous-dependencies */
const fs = require('node:fs');
const yaml = require('yaml');
const Knuff = require('..');
const StubDriver = require('../test/lib/StubDriver');

const pathToReminders = process.argv[2] || 'reminders.yaml';

const config = {
  repositories: {
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
  },
};

const drivers = { github: new StubDriver('test') };
const knuff = new Knuff(config, drivers)
  .on('error', console.error)
  .on('progress', console.log);
const reminders = yaml.parse(fs.readFileSync(pathToReminders, 'utf8'));

knuff.process(reminders).then((stats) => {
  console.log(`Successfully processed ${stats.reminders} reminders`);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});

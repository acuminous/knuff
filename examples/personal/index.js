/* eslint-disable no-console,import/no-unresolved,import/extensions */
import fs from 'node:fs';
import yaml from 'yaml';
import { Octokit } from '@octokit/rest';
import GitHubDriver from 'knuff-github-driver';
import Knuff from 'knuff/index.js';

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

// If you only ever post reminders to the same repository
// that runs the action, you can use the GITHUB_TOKEN automatically
// provided by GitHub. Alternatively create a fine grained personal
// access token with read+write issue permissions
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const drivers = { github: new GitHubDriver(octokit) };
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

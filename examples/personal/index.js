/* eslint-disable no-console, import/no-unresolved */
import fs from 'node:fs';
import minimist from 'minimist';
import yaml from 'yaml';
import { Octokit } from '@octokit/rest';
import GitHubDriver from '@acuminous/knuff-github-driver';
import Knuff from '@acuminous/knuff';

const argv = minimist(process.argv.slice(2), {
  booleans: ['pretend'],
  default: {
    auth: process.env.GITHUB_TOKEN,
    reminders: 'reminders.yaml',
    pretend: false,
    now: Date.now(),
  },
});

const auth = argv.auth;
const pathToReminders = argv.reminders;
const pretend = argv.pretend;
const now = () => new Date(argv.now).getTime();

const config = {
  pretend,
  repositories: {
    'acuminous/knuff': {
      owner: 'acuminous',
      name: 'knuff',
      driver: 'github',
    },
  },
};

(async () => {
  try {
    const octokit = new Octokit({ auth });
    const drivers = { github: new GitHubDriver(octokit) };
    const knuff = new Knuff(config, drivers, now)
      .on('error', console.error)
      .on('progress', console.log);
    const reminders = yaml.parse(fs.readFileSync(pathToReminders, 'utf8'));
    const stats = await knuff.process(reminders);
    console.log(stats);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

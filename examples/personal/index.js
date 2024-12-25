/* eslint-disable no-console, import/no-unresolved */
import fs from 'node:fs';
import yaml from 'yaml';
import { Octokit } from '@octokit/rest';
import Knuff from '@acuminous/knuff';
import GitHubDriver from '@acuminous/knuff-github-driver';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PATH_TO_REMINDERS = process.env.PATH_TO_REMINDERS || 'reminders.yaml';

const config = {
  repositories: {
    'acuminous/knuff': {
      owner: 'acuminous',
      name: 'knuff',
      driver: 'github',
    },
  },
};

const octokit = new Octokit({ auth: GITHUB_TOKEN });
const drivers = { github: new GitHubDriver(octokit) };
const knuff = new Knuff(config, drivers)
  .on('error', console.error)
  .on('progress', console.log);
const reminders = yaml.parse(fs.readFileSync(PATH_TO_REMINDERS, 'utf8'));

knuff.process(reminders).then((stats) => {
  console.log(`Successfully processed ${stats.reminders} reminders`);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});

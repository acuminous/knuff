/* eslint-disable no-console, import/no-unresolved */
import fs from 'node:fs';
import yaml from 'yaml';
import { App } from 'octokit';
import Knuff from '@acuminous/knuff';
import GitHubDriver from '@acuminous/knuff-github-driver';

const GITHUB_APP_ID = process.env.GITHUB_APP_ID;
const GITHUB_INSTALLATION_ID = process.env.GITHUB_INSTALLATION_ID;
const PRIVATE_KEY_PATH = process.env.PRIVATE_KEY_PATH;
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

(async () => {
  try {
    const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
    const app = new App({ appId: GITHUB_APP_ID, privateKey });
    const octokit = await app.getInstallationOctokit(GITHUB_INSTALLATION_ID);
    const drivers = { github: new GitHubDriver(octokit.rest) };
    const knuff = new Knuff(config, drivers)
      .on('error', console.error)
      .on('progress', console.log);
    const reminders = yaml.parse(fs.readFileSync(PATH_TO_REMINDERS, 'utf8'));
    const stats = await knuff.process(reminders);
    console.log(`Successfully processed ${stats.reminders} reminders`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

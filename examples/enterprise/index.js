/* eslint-disable no-console, import/no-unresolved */
import fs from 'node:fs';
import minimist from 'minimist';
import yaml from 'yaml';
import { App } from 'octokit';
import Knuff from '@acuminous/knuff';
import GitHubDriver from '@acuminous/knuff-github-driver';

const argv = minimist(process.argv.slice(2), {
  booleans: ['pretend'],
  default: {
    appId: process.env.GITHUB_APP_ID,
    privateKey: 'private-key.pem',
    installationId: process.env.GITHUB_INSTALLATION_ID,
    reminders: 'reminders.yaml',
    pretend: false,
    now: Date.now(),
  },
});

const appId = argv.appId;
const privateKey = fs.readFileSync(argv.privateKey, 'utf8');
const installationId = argv.installationId;
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
    const app = new App({ appId, privateKey });
    const octokit = await app.getInstallationOctokit(installationId);
    const drivers = { github: new GitHubDriver(octokit.rest) };
    const knuff = new Knuff(config, drivers, now)
      .on('error', console.error)
      .on('progress', console.log);
    const reminders = yaml.parse(fs.readFileSync(pathToReminders, 'utf8'));
    const stats = await knuff.process(reminders);
    console.log(`Successfully processed ${stats.reminders} reminders`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

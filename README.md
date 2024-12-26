# Knuff - *Reminders as Code*

[![NPM version](https://img.shields.io/npm/v/@acuminous/knuff.svg?style=flat-square)](https://www.npmjs.com/package/@acuminous/knuff)
[![Node.js CI](https://github.com/acuminous/knuff/workflows/Node.js%20CI/badge.svg)](https://github.com/acuminous/actions?query=workflow%3A%22Node.js+CI%22)
[![Code Climate](https://codeclimate.com/github/acuminous/knuff/badges/gpa.svg)](https://codeclimate.com/github/acuminous/knuff)
[![Test Coverage](https://codeclimate.com/github/acuminous/knuff/badges/coverage.svg)](https://codeclimate.com/github/acuminous/knuff/coverage)
[![Discover zUnit](https://img.shields.io/badge/Discover-zUnit-brightgreen)](https://www.npmjs.com/package/zunit)

Knuff is an automated reminder tool which creates tickets in your issue tracker of choice (e.g. GitHub). It is designed to be run from an external scheduler such as the one provided by [GitHub Actions](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#schedule). You can use it to remind yourself about one off and recurring tasks such as...

- regenerating long lived API keys / auth tokens before they expire
- updating software dependencies on a monthly cadence
- domain name renewals

Knuff is also a German word meaning nudge or poke.

## Getting Started

### Installation
```
npm i @acuminous/knuff
```

### Reminders
A `Reminder` needs 

1. An id for duplicate checking and error reporting
2. A schedule adhering to [rfc5545](https://datatracker.ietf.org/doc/html/rfc5545) RRULE format (more accessibly documented by the node [rrule](https://www.npmjs.com/package/rrule) package)
3. Issue details (title and body) describing the work that needs to be done
4. One or more repositories the reminder will be posted to

Knuff will process a list of reminders, posting those that are due to the relevant repositories according to the schedule. Knuff will only post the reminder if a matching one is not already open, and will continue on error.

### The Reminders File
Knuff works with JSON, but since it's so easy to convert YAML to JSON, and because YAML is better for multiline strings, it is a good choice. An annoated reminders file is below...

```yaml
# Creates a reminder in acuminous/foo repository at 08:00 on the 1st of July 2025

  # Optional. Must be unique. Generated from the title if omitted
  # Used to avoid creating multiple open issues for the same reminder
- id: 'update-cms-api-key'

  # Optional. Potentially useful for understanding the reminder's background 
  description: |
    The CMS API key expires on the 1st August 2025

  # Required. This will be the title of the reminder
  title: 'Update CMS API Key'

  # Required. This will be the body of the reminder
  body: |
    The CMS API key expires on the 1st August 2025.

    - [ ] Regenerate the API Key
    - [ ] Reset knuff reminder

  # Optional. Knuff will append the reminder id to the reminder labels and use it prevent creating duplicates
  labels:
    - 'reminder'

  # Required. Supports a single string or list of strings
  # See https://datatracker.ietf.org/doc/html/rfc5545 and https://www.npmjs.com/package/rrule
  # Use ChatGPT to generate :)
  schedule: |
    DTSTART;TZID=Europe/London:20250701T080000
    RRULE:FREQ=DAILY;COUNT=1

  # Required. The list of repositories to post the reminder to
  repositories: 
    - 'acuminous/knuff'
```

### Generating Reminders
To generate the reminders you need a script that will process the reminder file. You also need to configure the repository drivers. The drivers are published separately to this package. At time of writing the following drivers exist.

- [GitHub Driver](https://www.npmjs.com/package/@acuminous/knuff-github-driver)
- [JIRA Driver](https://www.youtube.com/watch?v=LPCUAgzUt2k)

An example script suitable for personal use is as follows...

```js
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
const knuff = new Knuff(config, drivers).on('error', console.error)
const reminders = yaml.parse(fs.readFileSync(PATH_TO_REMINDERS, 'utf8'));

knuff.process(reminders).then((stats) => {
  console.log(`Successfully processed ${stats.reminders} reminders`);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
```

### Scheduling Knuff
Knuff requires an external scheduler. Which one is to you, but we provide an example GitHub Actions setup below...

```yaml
name: Check Reminders

on:
  workflow_dispatch: # Allows manual triggering of the workflow
  schedule:
    - cron: "*/60 * * * *" # Runs every 60 minutes

jobs:
  run-reminder:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install dependencies with npm ci
        run: npm ci

      - name: Execute Knuff
        run: node knuff.js
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
If you only ever create reminders in the same repository as the action, you can use the GITHUB_TOKEN magically provided by GitHub. If you want to create reminders in multiple/separate repositories you can use a fine-grained personal access token with read+write issue permissions, and store it as an action secret. If you intend to use Knuff with a large number of teams and repositories you may find you are rate limited. In this case your best option is to register a GitHub App and use an installation token. See the [enterprise example](https://github.com/acuminous/knuff/tree/main/examples/enterprise) for how.

### Advanced Usage

#### Reporting Progress
If you have a lot of reminders you may wish to report progress after a batch of them are processed...
```js
const config = {
  progress: 20, // The default is 10
  repositories,
};

const knuff = new Knuff(config, drivers)
  .on('error', console.error)
  .on('progress', console.log);
````

#### Testing Reminders
If you want extra confidence that your reminders will fire when expected you can run Knuff in `pretend` mode with a fake date...
```js
const { Settings } = require('luxon');

const config = {
  pretend: true,
  repositories,
};

Settings.now = () => new Date('2024-12-25');

const knuff = new Knuff(config, drivers).on('error', console.error);
```
Because Knuff does not actually create the issues it cannot detect duplicates that would have been created in the same run.

### Custom Drivers
Developing a custom driver is simple, you just need to write a class that implements the Driver interface specified in the type definitions, and configure it in your Knuff script, e.g.

```js
import fs from 'node:fs';
import yaml from 'yaml';
import MyCustomDriver from './my-custom-driver';
import Knuff from '@acuminous/knuff';

const pathToReminders = process.argv[2] || 'reminders.yaml';

const config = {
  repositories: {
    'my-repo-id': {
      prop1: 'custom-prop-1',
      prop2: 'custom-prop-2',
      driver: 'my-custom-driver',
    },
  },
};

const drivers = { 'my-custom-driver': new MyCustomDriver() };
const knuff = new Knuff(config, drivers)
  .on('error', console.error);
const reminders = yaml.parse(fs.readFileSync(pathToReminders, 'utf8'));

knuff.process(reminders).then((stats) => {
  console.log(`Successfully processed ${stats.reminders} reminders`);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
```

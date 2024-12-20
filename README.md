# Knuff

[![NPM version](https://img.shields.io/npm/v/@acuminous/knuff.svg?style=flat-square)](https://www.npmjs.com/package/@acuminous/knuff)
[![Node.js CI](https://github.com/acuminous/knuff/workflows/Node.js%20CI/badge.svg)](https://github.com/acuminous/actions?query=workflow%3A%22Node.js+CI%22)
[![Code Climate](https://codeclimate.com/github/acuminous/knuff/badges/gpa.svg)](https://codeclimate.com/github/acuminous/knuff)
[![Test Coverage](https://codeclimate.com/github/acuminous/knuff/badges/coverage.svg)](https://codeclimate.com/github/acuminous/knuff/coverage)
[![Discover zUnit](https://img.shields.io/badge/Discover-zUnit-brightgreen)](https://www.npmjs.com/package/zunit)

Knuff is an automated reminder tool which creates tickets in your issue tracker of choice (e.g. GitHub). It is designed to be run from an external scheduler such as the one provided by [GitHub Actions](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#schedule). You can use it to remind you to

- regenerate long lived API keys / auth tokens before they expire
- update software dependencies on a monthly cycle

Knuff is also a German word meaning nudge or poke.

## Getting Started

### Reminders
A `Reminder` needs 

1. An id for duplicate checking and error reporting
2. A schedule adhering to [rfc5545](https://datatracker.ietf.org/doc/html/rfc5545) RRULE format (more accessibly documented by the node [rrule](https://www.npmjs.com/package/rrule) package)
3. Issue details (title and body) describing the work that needs to be done
4. One or more repositories the issue will be posted to

Knuff will process a list of reminders, creating issues in the relevant repositories according to the schedule. Knuff will only create the issue if one not already open, and will continue if it encounters an error. 

### The Reminders File
Knuff works with JSON, but since it's so easy to convert YAML to JSON, and because YAML is better for multiline strings, it is a good choice. An annoated reminders file is below...

```yaml
# Creates an issue in acuminous/foo repository at 08:00 on the 1st of July 2025

  # Required. Must be unique within the reminders file
- id: 'update-contentful-api-key'

  # Optional. Potentially useful for understanding the reminder's background 
  description: |
    The Contentful API key expires yearly. See https://github.com/acuminous/foo/blog/master/README.md#api-key for more details

  # Required. See https://datatracker.ietf.org/doc/html/rfc5545 
  # See also https://www.npmjs.com/package/rrule
  schedule: |
    DTSTART;TZID=Europe/London:20250701T080000
    RRULE:FREQ=DAILY;COUNT=1

  issue:
    # Required. This will be the title of the issue
    title: 'Update Contenful API Key'

    # Required. This will be the body of the issue
    body: |
      The Contentful API Key expires on the 14th of July 2025.
      - [ ] Regenerate the Contentful API Key
      - [ ] Update AWS Secrets Manager
      - [ ] Redeploy the website
      - [ ] Update the reminder for next year

    # Optional. Knuff will append the reminder id to the issue labels and use it prevent creating duplicates
    labels:
      - 'Reminder'
      - 'Critical'

  # Required. The list of repositories to post the issue to
  repositories: 
    - 'acuminous/foo'
```

### Processing Reminders
To process the reminders you need to write a script that will read the reminder file. You also need to configure the Repository Drivers. The drivers are published separately to this package. At time of writing the following drivers exist.

- [GitHub Driver](https://www.npmjs.com/package/knuff-github-driver)
- [JIRA Driver](https://www.youtube.com/watch?v=LPCUAgzUt2k)

An example script is as follows...

```js
import fs from 'node:fs';
import yaml from 'yaml';
import { Octokit } from '@octokit/rest';
import GitHubDriver from '@acuminous/knuff-github-driver';
import Knuff from '@acuminous/knuff';

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

// For personal usage use a fine grained personal access token with read+write issue permissions
// See https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
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
```

### Scheduling Knuff
Knuff requires an external scheduler. Which one is to you, but we provide an example GitHub Actions setup below...

```yaml
name: Knuff Said!

on:
  workflow_dispatch: # Allows manual triggering of the workflow
  schedule:
    - cron: "*/30 * * * *" # Runs every 30 minutes

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
If you only ever create reminders in the same repository as the action, you do not need to use a personal access token, GitHub magically provides one for you. See https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication

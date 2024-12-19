#knuff

## TL;DR

### Define the reminders
```yaml
# Creates an issue in acuminous/foo repository at 08:00 on the 1st of July 2025 
- id: 'update-contentful-api-key'
  description: |
    The Contentful API key expires yearly. See https://github.com/acuminous/foo/blog/master/README.md#api-key for more details
  # See https://datatracker.ietf.org/doc/html/rfc5545 and https://www.npmjs.com/package/rrule
  schedule: |
    DTSTART;TZID=Europe/London:20250701T080000
    RRULE:FREQ=DAILY;COUNT=1
  issue:
    title: 'Update Contenful API Key'
    body: |
      The Contentful API Key expires on the 14th of July 2025.
      - [ ] Regenerate the Contentful API Key
      - [ ] Update AWS Secrets Manager
      - [ ] Redeploy the website
      - [ ] Update the reminder for next year
    labels:
      - 'Reminder'
      - 'Critical'
  repositories: 
    - 'acuminous/foo'

# Creates an issue in acuminous/foo and acuminous/bar repositories at 08:00 on the 1st of each month 
- id: 'bump-dependencies'
  # See https://datatracker.ietf.org/doc/html/rfc5545 and https://www.npmjs.com/package/rrule
  schedule: |
    DTSTART;TZID=Europe/London:20240101T080000
    RRULE:FREQ=MONTHLY;BYMONTHDAY=1;BYHOUR=8;BYMINUTE=0
  issue:
    title: 'Bump dependencies'
    body: |
      Bump dependencies for all projects
    labels:
      - 'Reminder'
      - 'Chore'      
  repositories: 
    - 'acuminous/foo'
    - 'acuminous/bar'
```

### Run Knuff
Knuff is intended to be run via an external scheduler such the one provided with GitHub Actions.

```js
const fs = require('node:fs');
const yaml = require('yaml');
const Knuff = require('knuff');
const { createActionAuth: authStrategy } require('@octokit/auth-action');
const GitHubDriver = require('knuff-github-driver');

const config = {
  repositories: {
    'acuminous/foo': {
      organisation: 'acuminous',
      name: 'foo',
      driver: 'github'
    },
    'acuminous/bar': {
      organisation: 'acuminous',
      name: 'bar',
      driver: 'github'
    },    
  }
};

const drivers = { github: new GitHubDriver({ authStrategy }) };
const knuff = new Knuff(config, drivers);
const reminders = yaml.parse(fs.readFileSync('./path/to/reminders.yaml', 'utf8'));
await knuff.process(reminders);
```

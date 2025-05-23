import { EventEmitter } from 'events';
import { RRule } from 'rrule';

interface Repository {
  id: string;
  driver: string;
};

type Reminder = {
  id?: string;
  title: string;
  body: string;
  schedule: string | string[];
  repositories: string[];
  date: Date;
  timezone: string;
};

interface Driver {
  hasReminder(repository: Repository, reminder: Reminder): Promise<boolean>;
  createReminder(repository: Repository, reminder: Reminder): Promise<any>;
}

type KnuffConfig = {
  pretend?: boolean;
  progress?: number;
  repositories: Record<string, Repository>;
};

type KnuffStats = {
  reminders: number;
  due: number;
  duplicates: number;
  created: number;
  errors: number;
};

type Drivers = Record<string, Driver>;

declare class Knuff extends EventEmitter {
  constructor(config: KnuffConfig, drivers: Drivers, now?: () => number);

  /**
   * Processes a list of reminders, emitting progress and error events.
   * @param reminders The list of reminders to process.
   * @returns A promise that resolves with stats after processing all reminders.
   */
  process(reminders: Reminder[]): Promise<KnuffStats>;
}

export = Knuff;
#!/usr/bin/env node

/* Code taken from bin/firebase */

// Check for older versions of Node no longer supported by the CLI.
import * as semver from "semver";
const pkg = require("../../package.json");
const nodeVersion = process.version;
if (!semver.satisfies(nodeVersion, pkg.engines.node)) {
  console.error(
    `Firebase CLI v${pkg.version} is incompatible with Node.js ${nodeVersion} Please upgrade Node.js to version ${pkg.engines.node}`,
  );
  process.exit(1);
}

import * as updateNotifierPkg from "update-notifier-cjs";
import { markedTerminal } from "marked-terminal";
const updateNotifier = updateNotifierPkg({ pkg });
import { marked } from "marked";
marked.use(markedTerminal() as any);

import { Command } from "commander";
import { join } from "node:path";
const stripAnsi = require("strip-ansi");
import * as fs from "node:fs";

const fdelete = require("../firestore/delete");

/* Custom Univelop Code */

const project = "univelop-dev";
const path = "/jobQueue";
const options = {
  recursive: false,
  shallow: true,
  allCollections: false,
  database: "(default)",
};

const filters = [
  {
    fieldFilter: {
      field: {
        fieldPath: "jobType",
      },
      op: "EQUAL",
      value: {
        referenceValue: "scheduledCleanUp",
      },
    },
  },
  {
    fieldFilter: {
      field: {
        fieldPath: "jobType",
      },
      op: "EQUAL",
      value: {
        referenceValue: "scheduledCleanUp",
      },
    },
  },
];

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let cmd: Command;

  function findAvailableLogFile(): string {
    const candidates = ["firebase-debug.log"];
    for (let i = 1; i < 10; i++) {
      candidates.push(`firebase-debug.${i}.log`);
    }

    for (const c of candidates) {
      const logFilename = join(process.cwd(), c);

      try {
        const fd = fs.openSync(logFilename, "r+");
        fs.closeSync(fd);
        return logFilename;
      } catch (e: any) {
        if (e.code === "ENOENT") {
          // File does not exist, which is fine
          return logFilename;
        }

        // Any other error (EPERM, etc) means we won't be able to log to
        // this file so we skip it.
      }
    }

    throw new Error("Unable to obtain permissions for firebase-debug.log");
  }

  const logFilename = findAvailableLogFile();

  if (!process.env.DEBUG && args.includes("--debug")) {
    process.env.DEBUG = "true";
  }

  process.env.IS_FIREBASE_CLI = "true";

  const deleteOp = new fdelete.FirestoreDelete(
    project,
    path,
    {
      recursive: options.recursive,
      shallow: options.shallow,
      allCollections: options.allCollections,
      databaseId: options.database,
    },
    filters,
  );
  console.log("Started");
  await deleteOp.execute();
  console.log("Finished");
}

void main();

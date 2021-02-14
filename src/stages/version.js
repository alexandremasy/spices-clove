#!/usr/bin/env node
const semver = require('semver');
const execute = require('../utils/execute');

class VersionStep {
  constructor() {
    this._config = require('../utils/config');
    this.tagVersion = '0.0.0';
  }

  set config(value) {
    this._config = value;
  }

  get config() {
    return this._config;
  }

  run() {
    return this.getLatestVersionTag()
      .then(this.getRelease.bind(this))
      .then(this.getNextVersion.bind(this))
      .then(this.version.bind(this))
      .catch(e => {
        console.log(e)
        process.exit(0);
      });
  }

  /**
   * Find the latest version tag on the repository
   * 
   * @return {Promise}
   */
  getLatestVersionTag() {
    return new Promise((resolve, reject) => {
      let command = 'git describe --abbrev=0 --tags';
      this.config.debug && this.config.verbose && console.log('version.getLatestVersionTag >', chalk.dim(command));
      execute(command, { verbose: false })
        .then(({response}) => {
          this.config.debug && this.config.verbose && console.log('version.getLatestVersionTag <', chalk.dim(response));

          this.tagVersion = semver.clean(response);
          this.config.debug && console.log('tagVersion', this.tagVersion);
          resolve();
        })
        .catch(e => {
          this.config.debug && console.log('tagVersion', 'no tags');
          resolve();
        })
    })
  }

  /**
   * Find out the release type based on the git history
   * The release `major` - `minor` - `patch` - `null`
   * 
   * @returns {Promise}
   */
  getRelease() {
    return new Promise((resolve, reject) => {
      let command = 'git log --oneline $(git describe --tags --abbrev=0 @^)..@';
      this.config.debug && this.config.verbose && console.log('version.getRelease >', chalk.dim(command));
      execute(command, { verbose: false })
      .then(({response}) => {
        this.config.debug && this.config.verbose && console.log('version.getRelease <', chalk.dim(command));
        this.config.release = this.parseCommits(response);
        this.config.debug && console.log('version.getRelease', this.config.release);
        this.config.release === null ? reject('no changes to publish') : resolve();
      })
      .catch(e => {
        // No tag yet, make sure there are commits
        command = 'git log --oneline';
        this.config.debug && this.config.verbose && console.log('version.getRelease >', chalk.dim(command));
        execute(command, { verbose: false })
        .then(({response}) => {
          this.config.debug && this.config.verbose && console.log('version.getRelease <', chalk.dim(command));
          this.config.release = this.parseCommits(response);
          this.config.debug && console.log('version.getRelease', this.config.release);
          this.config.release === null ? reject('no changes to publish') : resolve();
        })
      })
    })
  }

  /**
   * Parse a given set of commits to find out the 
   * @param {*} commits 
   * @private
   */
  parseCommits(commits) {
    commits = commits.split('\n')
      .filter(c => c.trim().length > 0)
      .map(c => {
        let s = c.substr(8);
        return {
          sha: c.substr(0, 7),
          subject: s,
          isSemver: semver.valid(s) !== null
        }
      });

    let isPublished = commits.length == 1 && commits[0].isSemver === true;
    let isMajor = commits.find(c => c.subject.includes('bump-major')) !== undefined && !isPublished;
    let isMinor = commits.find(c => c.subject.includes('bump-minor')) !== undefined && !isMajor && !isPublished;
    let isPatch = commits.length > 0 && !isMajor && !isMinor && !isPublished;

    let release = null;
    if (isMajor) release = 'major';
    if (isMinor) release = 'minor';
    if (isPatch) release = 'patch';

    return release;
  }

  /**
   * Get the next version number based on the release type
   * 
   * @param {String} release The release type
   */
  getNextVersion() {
    this.config.debug && this.config.verbose && console.log('version.getNextVersion >', this.tagVersion, this.config.version);

    let next = semver.gt(this.tagVersion, this.config.version) ? this.tagVersion : this.config.version;
    next = semver.inc(next, this.config.release);

    this.config.debug && console.log('version.getNextVersion', next);
    this.config.next = next;

    return Promise.resolve(next);
  }

  /**
   * Update the version number
   */
  version() {
    return new Promise((resolve, reject) => {
      let command = `yarn version --new-version ${this.config.next} --quiet`;
      execute(command)
        .then(resolve)
        .catch(reject)
    })
  }
}
module.exports = VersionStep

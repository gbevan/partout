/*jshint node: true*/
'use strict';

const globalHooks = require('../../../hooks'),
      hooks = require('feathers-hooks'),
      auth = require('feathers-authentication').hooks,
      _ = require('lodash'),
      fs = require('fs'),
      path = require('path'),
      Q = require('q'),
      tempfile = require('tempfile'),
      pWriteFile = Q.denodeify(fs.writeFile),
      pStat = Q.denodeify(fs.stat),
      pRmdir = Q.denodeify(require('rmdir')),
      spawn = require('child_process').spawn;

const debug = require('debug').debug('partout:service:environments:hooks');

const HIDDEN = '[...HIDDEN...]';

/**
 * Run git command for requested action
 * @param {object}  hook   feathers hook object
 * @param {object}  env    this environment document
 * @param {string}  action 'clone' or 'pull'
 * @returns {Promise}
 */
function gitCmd(hook, env, action) {
  debug('gitCmd env:', env);
  return new Promise((resolve, reject) => {

    /**
     * accumulate clone output in env.cloneOutput
     * @param   {string}  log   log data to add
     * @param   {boolean} erase start fresh log
     * @returns {promise}
     */
    function out(log, erase) {
      log = log.toString();
      if (action === 'clone') {
        env.cloneOutput = (erase ? log : env.cloneOutput + '\n' + log);
      } else if (action === 'pull') {
        env.pullOutput = (erase ? log : env.pullOutput + '\n' + log);
      }
      return hook.app.service('environments')
      .patch(env.id, env);
    }

    // If key given as text, write to temp file
    const manifestdir = hook.app.get('cfg').MANIFESTDIR;
    const cloneFolder = path.join(manifestdir, env.name);
    debug(`${action}ing: ${cloneFolder}`);

    const tempSshFile = tempfile();
    const keyTempPromise = new Promise((sshKeyResolve, sshKeyReject) => {
      if (env.keyType === 'text' && env.key) {
        pWriteFile(tempSshFile, env.key, {mode: 0o600})
        .then(() => {
          sshKeyResolve(`-i ${tempSshFile}`);
        })
        .catch((err) => {
          sshKeyReject(err);
        });
      } else if (env.keyType === 'file' && env.key) {
        sshKeyResolve(`-i ${env.key}`);
      } else {
        sshKeyResolve('');
      }
    });

    keyTempPromise
    .then((sshKeyParm) => {
      let git_cmd;
      if (action === 'clone') {
        git_cmd = `GIT_SSH_COMMAND="ssh -T -oStrictHostKeyChecking=no -oBatchMode=yes ${sshKeyParm}" git clone --branch "${env.branchtag}" --depth 1 ${env.url} ${cloneFolder}`;

      } else if (action === 'pull') {
        git_cmd = `cd ${cloneFolder} && GIT_SSH_COMMAND="ssh -T -oStrictHostKeyChecking=no -oBatchMode=yes ${sshKeyParm}" git pull`;

      }
      debug('git_cmd:', git_cmd);

      return out('Spawning: ' + git_cmd, true)
      .then(() => {
        const gitCp = spawn(git_cmd, {
          shell: true,
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe']
        });

        gitCp.on('error', (err) => {
          fs.unlink(tempSshFile);
          out('Spawn failed: ' + err.message)
          .then(() => {
            reject(err);
          });
        });

        gitCp.stderr.on('data', (d) => {
          out(d);
        });

        gitCp.stdout.on('data', (d) => {
          out(d);
        });

        gitCp.on('exit', (rc) => {
          out((rc === 0 ? 'Completed' : 'Failed') + ' with rc=' + rc)
          .then(() => {
            if (action === 'clone') {
              return hook.app.service('environments')
              .patch(env.id, {
                cloneStatus: (rc === 0 ? 'cloned' : 'failed')
              });
            } else {
              return Promise.resolve();
            }
          })
          .then(() => {
            resolve(hook);
          })
          .catch((err) => {
            reject(err);
          });
        });
      });
    });
  }); // Promise
}

function protectKey(options) {
  return (hook) => {
    return new Promise((resolve, reject) => {
      const e = hook.data;
      if (e.keyType === 'text' && (e.key === HIDDEN || e.key === '')) {
        hook.app.service('environments')
        .get(e.id)
        .then((old_e) => {
          e.key = old_e.key;
          debug('cleansed e:', e);
          resolve(hook);
        })
        .catch((err) => {
          reject(err);
        });
      } else {
        debug('not cleansed e:', e);
        resolve(hook);
      }
    });
  };
}

function ensureNameUnique(options) {
  return (hook) => {
    return new Promise((resolve, reject) => {
      const e = hook.data;

      hook.app.service('environments')
      .find({query: {name: e.name}})
      .then((other_e) => {
        debug('other_e:', other_e);
        if (other_e.total > 0) {
          return reject(new Error('Duplicate entry for name'));
        }
        resolve(hook);
      })
      .catch((err) => {
        reject(err);
      });
    });
  };
}

exports.before = {
  all: [
    auth.authenticate('jwt'),
    globalHooks.hasPermission({permission: 'app:service:environments', access: 'R'})
  ],
  find: [],
  get: [],
  create: [
    globalHooks.hasPermission({permission: 'app:service:environments', access: 'RW'}),
    ensureNameUnique(),
    (hook) => {
      // check target folder for clone does not already exist
      const env = hook.data;
      return new Promise((resolve, reject) => {
        const manifestdir = hook.app.get('cfg').MANIFESTDIR;
        const cloneFolder = path.join(manifestdir, env.name);
        pStat(cloneFolder)
        .then((stats) => {
          reject(new Error('Target folder for clone already exists'));
        })
        .catch((err) => {
          if (err.code === 'ENOENT') {
            resolve(hook);
          } else {
            reject(err);
          }
        });
      });
    }
  ],
  update: [
    globalHooks.hasPermission({permission: 'app:service:environments', access: 'RW'}),
    protectKey()
  ],
  patch: [
    globalHooks.hasPermission({permission: 'app:service:environments', access: 'RW'}),
    (hook) => {
      // handle pull request
      return new Promise((resolve, reject) => {
        // look up full env
        hook.app.service('environments')
        .get(hook.id)
        .then((env) => {
          if (hook.data.pullRequest) {
            debug('pull request');
            gitCmd(hook, env, 'pull');  // async reports back via table updates
            resolve();  // no update
          } else {
            resolve(hook);
          }
        });
      });

    },
    protectKey()
  ],
  remove: [
    globalHooks.hasPermission({permission: 'app:service:environments', access: 'RW'})
  ],
};

exports.after = {
  all: [
    (hook) => {
      if (hook.params && hook.params.provider) {
        if (_.isArray(hook.result)) {
          hook.result.forEach((r) => {
            if (r.keyType === 'text' && r.key && r.key !== '') {
              r.key = HIDDEN;
            }
          });
        } else {
          const r = hook.result;
          if (r.keyType === 'text' && r.key && r.key !== '') {
            r.key = HIDDEN;
          }
        }
      }
      return Promise.resolve(hook);
    }
  ],
  find: [],
  get: [],
  create: [
    (hook) => {
      return new Promise((resolve, reject) => {

        const env = hook.result;
        if (env.url) {
          resolve(gitCmd(hook, env, 'clone'));
        } else {
          resolve(hook);
        }
      });
    }
  ],
  update: [],
  patch: [],
  remove: [
    (hook) => {
      const env = hook.result;
      return new Promise((resolve, reject) => {
        const manifestdir = hook.app.get('cfg').MANIFESTDIR;
        const cloneFolder = path.join(manifestdir, env.name);
        debug('removing clone folder:', cloneFolder);

        pRmdir(cloneFolder)
        .then(() => {
          resolve(hook);
        })
        .catch((err) => {
          console.error(err);
          if (err.code === 'ENOENT') {
            return resolve(hook);
          }
          reject(err);
        });
      });
    }
  ],
};

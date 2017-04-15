'use babel';

import term from 'term-launcher';
import path from 'path';
import { CompositeDisposable, Disposable } from 'atom';


const HydrogenLauncher = {
  config: {
    app: {
      title: 'Terminal application',
      description: 'This will depend on your operation system.',
      type: 'string',
      default: term.getDefaultTerminal(),
    },
    console: {
      title: 'Jupyter console',
      description: 'Change this if you want to start a `qtconsole` or any other jupyter interface that can be started with `jupyter <your-console> --existing <connection-file>`.',
      type: 'string',
      default: 'console',
    },
    command: {
      title: 'Custom command',
      description: 'This command will be excuted in the launched terminal. You can access the connection file from Hydrogen by using `{connection-file}` within your command',
      type: 'string',
      default: '',
    },
  },

  subscriptions: null,
  hydrogen: null,
  platformIoTerminal: null,

  activate() {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'hydrogen-launcher:launch-terminal': () => this.launchTerminal(),
      'hydrogen-launcher:launch-jupyter-console': () => this.launchJupyter(),
      'hydrogen-launcher:launch-jupyter-console-in-platformio-terminal': () =>
        this.launchJupyterInPlatformIoTerminal(),
      'hydrogen-launcher:launch-terminal-command': () =>
        this.launchTerminal(true),
      'hydrogen-launcher:copy-path-to-connection-file': () =>
        this.copyPathToConnectionFile(),
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  consumeHydrogen(hydrogen) {
    this.hydrogen = hydrogen;
    return new Disposable(() => {
      this.hydrogen = null;
    });
  },

  consumePlatformIoTerminal(provider) {
    this.platformIoTerminal = provider;
    return new Disposable(() => {
      this.platformIoTerminal = null;
    });
  },

  launchTerminal(command = false) {
    let cmd;
    if (command) {
      cmd = this.getCommand();
      if (!cmd) return;
    }
    term.launchTerminal(cmd, this.getCWD(), this.getTerminal(), (err) => {
      if (err) {
        atom.notifications.addError(err.message);
      }
    });
  },

  launchJupyter() {
    const connectionFile = this.getConnectionFile();
    if (!connectionFile) return;

    const jpConsole = atom.config.get('hydrogen-launcher.console');
    term.launchJupyter(connectionFile, this.getCWD(), jpConsole, this.getTerminal(), (err) => {
      if (err) atom.notifications.addError(err.message);
    });
  },

  launchJupyterInPlatformIoTerminal() {
    const connectionFile = this.getConnectionFile();
    if (!connectionFile) return;

    const jpConsole = atom.config.get('hydrogen-launcher.console');
    term.getConnectionCommand(connectionFile, jpConsole, (err, command) => {
      if (!this.platformIoTerminal) {
        atom.notifications.addError('PlatformIO IDE Terminal has to be installed.');
      } else if (err) {
        atom.notifications.addError(err.message);
      } else {
        this.platformIoTerminal.run([command]);
      }
    });
  },

  copyPathToConnectionFile() {
    const connectionFile = this.getConnectionFile();
    if (!connectionFile) return;

    atom.clipboard.write(connectionFile);
    const message = 'Path to connection file copied to clipboard.';
    const description = `Use \`jupyter console --existing ${connectionFile}\` to
            connect to the running kernel.`;
    atom.notifications.addSuccess(message, { description });
  },

  getConnectionFile() {
    if (!this.hydrogen) {
      atom.notifications.addError('Hydrogen `v1.0.0+` has to be running.');
      return null;
    }
    try {
      return this.hydrogen.getActiveKernel() ?
        this.hydrogen.getActiveKernel().getConnectionFile() : null;
    } catch (error) {
      atom.notifications.addError(error.message);
    }
    return null;
  },

  getCommand() {
    let cmd = atom.config.get('hydrogen-launcher.command');
    if (cmd === '') {
      atom.notifications.addError('No custom command set.');
      return null;
    }
    if (cmd.indexOf('{connection-file}') > -1) {
      const connectionFile = this.getConnectionFile();
      if (!connectionFile) {
        return null;
      }
      cmd = cmd.replace('{connection-file}', connectionFile);
    }
    return cmd;
  },

  getTerminal() {
    return atom.config.get('hydrogen-launcher.app');
  },

  getCWD() {
    return (atom.project.rootDirectories[0]) ?
      atom.project.rootDirectories[0].path :
      path.dirname(atom.workspace.getActiveTextEditor().getPath());
  },
};

export default HydrogenLauncher;

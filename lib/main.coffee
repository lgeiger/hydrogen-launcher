# coffeelint: disable = missing_fat_arrows
term = require 'term-launcher'
path = require 'path'
{CompositeDisposable, Disposable} = require 'atom'


module.exports = HydrogenLauncher =
    config:
        app:
            title: 'Terminal application'
            description: 'This will depend on your operation system.'
            type: 'string'
            default: term.getDefaultTerminal()

    subscriptions: null
    connectionFile: null

    activate: (state) ->
        @subscriptions = new CompositeDisposable

        @subscriptions.add atom.commands.add 'atom-text-editor',
            'hydrogen-launcher:launch-terminal': => @launchTerminal()
            'hydrogen-launcher:launch-jupyter-console': => @launchJupyter()
            'hydrogen-launcher:copy-path-to-connection-file': =>
                @copyPathToConnectionFile()

    deactivate: ->
        @subscriptions.dispose()

    consumeHydrogen: (provider) ->
        @setConnectionFile provider.connectionFile
        new Disposable => @setConnectionFile null

    launchTerminal: ->
        term.launchTerminal '', @getCWD(), @getTerminal(), (err) ->
            if err
                atom.notifications.addError err.message

    launchJupyter: ->
        connectionFile = @getConnectionFile()
        unless connectionFile
            return

        term.launchJupyter connectionFile, @getCWD(), @getTerminal(), (err) ->
            if err
                atom.notifications.addError err.message

    copyPathToConnectionFile: ->
        connectionFile = @getConnectionFile()
        unless connectionFile
            return

        atom.clipboard.write connectionFile
        message = 'Path to connection file copied to clipboard.'
        description = "Use `jupyter console --existing #{connectionFile}` to
            connect to the running kernel."
        atom.notifications.addSuccess message, description: description

    setConnectionFile: (file) ->
        @connectionFile = file

    getConnectionFile: ->
        unless @connectionFile
            atom.notifications.addError 'Hydrogen `v0.15.0+` has to be running.'
            return
        return @connectionFile()

    getTerminal: ->
        return atom.config.get 'hydrogen-launcher.app'

    getCWD: ->
        dir = atom.project.rootDirectories[0]?.path or
            path.dirname atom.workspace.getActiveTextEditor().getPath()
        return dir

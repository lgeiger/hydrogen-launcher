# coffeelint: disable = missing_fat_arrows
{CompositeDisposable} = require 'atom'


module.exports = HydrogenLauncher =
    config:
        app:
            type: 'string'
            default: 'Terminal.app'
    subscriptions: null

    activate: (state) ->
        @subscriptions = new CompositeDisposable

        @subscriptions.add atom.commands.add 'atom-text-editor',
            'hydrogen-launcher:launch-terminal': => @launchTerminal()
            'hydrogen-launcher:launch-jupyter-console': => @launchJupyter()

    deactivate: ->
        @subscriptions.dispose()

    launchTerminal: ->
        console.log 'launchTerminal'

    launchJupyter: ->
        console.log 'launchJupyter'

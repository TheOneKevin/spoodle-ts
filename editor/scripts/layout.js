var myLayout = new GoldenLayout({
    settings: {
        hasHeaders: true,
        constrainDragToContainer: true,
        reorderEnabled: true,
        selectionEnabled: false,
        popoutWholeStack: false,
        blockedPopoutsThrowError: true,
        closePopoutsOnUnload: true,
        showPopoutIcon: false,
        showMaximiseIcon: false,
        showCloseIcon: false
    },
    dimensions: {
        borderWidth: 1.5,
        borderGrabWidth: 10,
        minItemHeight: 10,
        minItemWidth: 10,
        headerHeight: 30,
        dragProxyWidth: 300,
        dragProxyHeight: 0
    },
    content: [{
        type: 'row',
        content: [{
            type: 'column',
            content: [{
                type: 'component',
                componentName: 'codeview',
                componentState: {
                    showCompileButton: true
                }
            }, {
                type: 'component',
                componentName: 'consoleview',
                componentState: {
                    showClearButton: true
                }
            }]
        }, {
            type: 'component',
            componentName: 'disasmview',
            componentState: {
                showExecuteButton: true
            }
        }, {
            type: 'column',
            width: 25,
            content: [{
                type: 'component',
                componentName: 'debugview',
                componentState: {
                    showDebugButton: true
                }
            }, {
                type: 'component',
                componentName: 'callview',
                componentState: {

                }
            }, {
                type: 'stack',
                height: 50,
                content: [{
                    type: 'component',
                    componentName: 'stackview',
                    componentState: {

                    }
                }, {
                    type: 'component',
                    componentName: 'globalview',
                    componentState: {

                    }
                }]
            }] // Column
        }] // Row
    }] // Content
});

myLayout.createLayout = function (name, title, id, cl, element = $('<div></div>')) {
    myLayout.registerComponent(name, function (container) {
        container.setTitle(title);
        let webview = element;
        webview.attr('id', id);
        webview.addClass(cl);
        webview.css({
            "position": "absolute",
            "background": "white",
            "height": "100%",
            "width": "100%",
            "border": "none"
        });
        container.getElement().append(webview);
    });
}

myLayout.createLayout('codeview', 'Code View', 'container-codeview', 'ide');
myLayout.createLayout('disasmview', 'Disassembly View', 'container-disasmview', 'ide');
myLayout.createLayout('consoleview', 'Output Console', 'consoleview', 'console');

myLayout.createLayout('debugview', 'Debug Info', 'debugview', 'debug', $($('template.debug-template').html()));
myLayout.createLayout('globalview', 'Globals', 'globalview', 'debug', $($('template.debug-template').html()));
myLayout.createLayout('stackview', 'Locals/Stack', 'stackview', 'debug', $($('template.debug-template').html()));
myLayout.createLayout('callview', 'Call Stack', 'callview', 'debug', $($('template.debug-template').html()));

/// Callback for every created stack
myLayout.on('stackCreated', function (stack) {
    // Add everything inside <template> to header
    var compileButton = $($('template.header-template').html());
    stack.header.controlsContainer.prepend(compileButton);

    // Update the color initially and whenever the tab changes
    stack.on('activeContentItemChanged', function (contentItem) {
        compileButton.children().hide();
        if (contentItem.container.getState().showCompileButton) {
            compileButton.children('.compile').show();
        }
        else if (contentItem.container.getState().showExecuteButton) {
            compileButton.children('.execute').show();
        }
        else if (contentItem.container.getState().showClearButton) {
            compileButton.children('.clearcons').show();
        }
        else if (contentItem.container.getState().showDebugButton) {
            compileButton.children('.debugtools').show();
        }
    });
});

myLayout.init();
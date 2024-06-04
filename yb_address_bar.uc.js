(function yb_address_bar() {
    'use strict';

    const USE_ACCENT_COLOR = Services.prefs.getBoolPref('floorp.titlebar.favicon.color');

    const GREY_BG = 'var(--grey-30)';
    const GREY_FG = 'var(--grey-60)';
    const FAVICON_BG = `var(--floorp-favicon-bg-color, var(--floorp-tab-panel-bg-color, ${GREY_BG}))`;
    const FAVICON_FG = `var(--floorp-favicon-fg-color, var(--floorp-tab-panel-fg-color, ${GREY_FG}))`;

    const STYLE = `
        .YBDomainButton {
            background-color: ${USE_ACCENT_COLOR ? FAVICON_BG : GREY_BG};
            color: ${USE_ACCENT_COLOR ? FAVICON_FG : GREY_FG};
            padding-inline: 8px;
            padding-bottom: 2px;
            border-radius: 4px;
            margin: 2px 8px 2px 0;
            height: auto;
            overflow: hidden;
            font-size: 13px;
            display: flex;
            align-items: center;
            transition: filter 2s var(--animation-easing-function),
                background-color 2s var(--animation-easing-function),
                color 2s var(--animation-easing-function);
        }

        .YBDomainButton:hover {
            filter: brightness(125%);
        }

        .YBDomainButton.Hidden {
            display: none;
        }
    `;

    const TIMEOUT = 10;

    class YBAddressBar {
        constructor() {
            this.addStyle();
            this.observeLocationChange();
            this.observeUrlbarFocused();
            this.update();
        }

        observeLocationChange() {
            document.addEventListener('floorpOnLocationChangeEvent', () => {
                this.updateDelayed();
            });
        }

        observeUrlbarFocused() {
            if (!this.#urlbar) {
                setTimeout(() => this.observeUrlbarFocused(), TIMEOUT);
                return;
            }

            this.urlbarObserver = new MutationObserver((records) => {
                for (const record of records) {
                    if (record.type === 'attributes' && record.attributeName === 'focused') {
                        this.updateDelayed();
                        break;
                    }
                }
            });
            this.urlbarObserver.observe(this.#urlbar, {
                attributes: true,
            });
        }

        addStyle() {
            const style = document.createElement('style');
            style.innerHTML = STYLE;
            this.#head.appendChild(style);
        }

        updateDelayed() {
            setTimeout(() => this.update(), TIMEOUT);
        }

        update() {
            if (
                this.#urlbar.getAttribute('focused') === 'true' ||
                gBrowser.currentURI.scheme === 'about'
            ) {
                this.hideYBDomainButton();
                return;
            }

            if (!this.#urlbarInputContainer || !this.#urlbarInput) {
                this.hideYBDomainButton();
                this.updateDelayed();
                return;
            }

            try {
                if (!this.#ybDomainButton) {
                    this.createYBDomainButton();
                }
                this.updateHost();
                this.updateTitle();
                this.showYBDomainButton();
            } catch (error) {
                this.updateDelayed();
                return;
            }
        }

        hideYBDomainButton() {
            if (this.#ybDomainButton) {
                this.#ybDomainButton.classList.add('Hidden');
            }
        }

        showYBDomainButton() {
            if (this.#ybDomainButton) {
                this.#ybDomainButton.classList.remove('Hidden');
            }
        }

        createYBDomainButton() {
            const ybDomainButton = document.createElement('div');
            ybDomainButton.className = 'YBDomainButton Hidden';

            ybDomainButton.onclick = () => {
                window.gBrowser.loadTabs([gBrowser.currentURI.host], {
                    replace: true,
                    allowThirdPartyFixup: true,
                    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
                });
            };

            this.#urlbarInputContainer.insertBefore(ybDomainButton, this.#urlbarInputBox);
        }

        updateHost() {
            this.#ybDomainButton.innerText = gBrowser.currentURI.host;
        }

        updateTitle() {
            var title = gBrowser.contentTitle;
            if (!title) {
                throw 'Empty title';
            }
            this.#urlbarInput.value = title;
        }

        get #head() {
            return document.querySelector('head');
        }

        get #urlbarInputContainer() {
            return document.querySelector('#urlbar-input-container');
        }

        get #urlbarInputBox() {
            return document.querySelector('.urlbar-input-box');
        }

        get #urlbar() {
            return document.querySelector('#urlbar');
        }

        get #urlbarInput() {
            return document.querySelector('#urlbar-input');
        }

        get #ybDomainButton() {
            return document.querySelector('.YBDomainButton');
        }
    }

    var interval = setInterval(() => {
        if (document.querySelector('#browser')) {
            window.ybAddressBar = new YBAddressBar();
            clearInterval(interval);
        }
    }, TIMEOUT);
})();

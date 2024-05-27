(function yb_address_bar() {
    "use strict";

    const STYLE = `
        .YBDomainButton {
            background-color: var(--urlbar-box-bgcolor);
            color: var(--urlbar-box-text-color);
            padding-inline: 8px;
            border-radius: var(--urlbar-icon-border-radius);
            margin-right: 4px;
            transition: background-color 1.25s var(--animation-easing-function) !important;
        }

        .YBDomainButton:hover {
            background-color: var(--urlbar-box-hover-bgcolor);
            color: var(--urlbar-box-hover-text-color);
        }
    `;

    const TIMEOUT = 10;

    class YBAddressBar {
        urlbarMutationObserver = null;

        constructor() {
            this.#addStyle();
            this.urlbarMutationObserver = this.#createUrlbarInputMutationObserver();
            this.#observeTabSelection();
        }

        // listeners

        #observeTabSelection() {
            gBrowser.tabContainer.addEventListener("TabSelect", () => {
                this.deleteYBDomainButtons();
                setTimeout(() => this.placeYb(), TIMEOUT);
            })
        }

        #createUrlbarInputMutationObserver() {
            if (!this.#urlbarInput) {
                setTimeout(() => this.#createUrlbarInputMutationObserver(), TIMEOUT);
                return;
            }

            const titleMutationObserver = new MutationObserver((records) => {
                this.deleteYBDomainButtons();
                setTimeout(() => this.placeYb(), TIMEOUT);
            });
            titleMutationObserver.observe(this.#urlbarInput, {
                attributes: true,
                childList: true
            });
            return titleMutationObserver;
        }

        // builders

        #createStyle() {
            const style = document.createElement('style');
            style.innerHTML = STYLE;
            return style;
        }

        #createYBDomainButton() {
            var host = gBrowser.currentURI.host;

            const ybDomainButton = document.createElement('div');
            ybDomainButton.innerText = host;
            ybDomainButton.className = 'YBDomainButton';

            ybDomainButton.onclick = () => {
                window.gBrowser.loadTabs([host], {
                    replace: true,
                    allowThirdPartyFixup: true,
                    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                });
            };

            this.#urlbarInputContainer.insertBefore(ybDomainButton, this.#urlbarInputBox);
            return ybDomainButton;
        }

        #createYbTitle() {
            var title = gBrowser.contentTitle;

            if (!title)  {
                throw "Empty title";
            };

            this.#urlbarInput.value = title;
        }

        // actions

        #addStyle() {
            this.#head.appendChild(this.#createStyle());
        }

        placeYb() {
            if (this.#urlbar.getAttribute("focused") === "true" || gBrowser.currentURI.scheme === "about") {
                return;
            }

            if (!this.#urlbarInputContainer || !this.#urlbarInput) {
                setTimeout(() => this.placeYb(), TIMEOUT);
                return;
            }

            try {
                this.deleteYBDomainButtons();
                this.placeYBDomainButton();
                this.placeYBTitle();
            } catch (error) {
                setTimeout(() => this.placeYb(), TIMEOUT);
                return;
            }
        }

        deleteYBDomainButtons() {
            for (const e of this.#ybDomainButtons) {
                this.#urlbarInputContainer.removeChild(e);
            }
        }

        placeYBDomainButton() {
            this.#createYBDomainButton();
        }

        placeYBTitle() {
            this.#createYbTitle();
        }

        // getters

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

        get #ybDomainButtons() {
            return document.querySelectorAll('.YBDomainButton');
        }
    };

    var interval = setInterval(() => {
        if (document.querySelector('#browser')) {
            window.ybAddressBar = new YBAddressBar();
            clearInterval(interval);
        }
    }, TIMEOUT);
})();

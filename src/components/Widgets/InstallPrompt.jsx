import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import './InstallPrompt.css';

const DISMISS_KEY = 'pwa-install-dismissed-at';
const IOS_DISMISS_KEY = 'pwa-ios-install-dismissed-at';
const DISMISS_DURATION_MS = 12 * 60 * 60 * 1000;

function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIosVisible, setIsIosVisible] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    const dismissedRecently = useMemo(() => {
        const dismissedAt = Number(localStorage.getItem(DISMISS_KEY));
        if (!dismissedAt) return false;

        return Date.now() - dismissedAt < DISMISS_DURATION_MS;
    }, []);

    const iosDismissedRecently = useMemo(() => {
        const dismissedAt = Number(localStorage.getItem(IOS_DISMISS_KEY));
        if (!dismissedAt) return false;

        return Date.now() - dismissedAt < DISMISS_DURATION_MS;
    }, []);

    useEffect(() => {
        const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const iosStandalone = window.navigator.standalone === true;
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        const isSafari = /safari/.test(userAgent) && !/crios|fxios|edgios|opios/.test(userAgent);

        if (displayModeStandalone || iosStandalone) {
            setIsInstalled(true);
            return;
        }

        if (isIosDevice && isSafari && !iosDismissedRecently) {
            setIsIosVisible(true);
        }

        const handleBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setDeferredPrompt(event);
            setIsIosVisible(false);

            if (!dismissedRecently) {
                setIsVisible(true);
            }
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
            setIsVisible(false);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [dismissedRecently, iosDismissedRecently]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        await deferredPrompt.userChoice;

        setDeferredPrompt(null);
        setIsVisible(false);
    };

    const handleDismiss = () => {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setIsVisible(false);
    };

    const handleIosDismiss = () => {
        localStorage.setItem(IOS_DISMISS_KEY, String(Date.now()));
        setIsIosVisible(false);
    };

    if (isInstalled) {
        return null;
    }

    if (isVisible && deferredPrompt) {
        return (
            <div className="install-prompt" role="dialog" aria-live="polite" aria-label="Install app prompt">
                <div className="install-prompt__icon-wrap" aria-hidden="true">
                    <Download size={18} />
                </div>
                <div className="install-prompt__copy">
                    <h3>Install Event Dashboard</h3>
                    <p>One tap access, faster load, and app-like full screen experience.</p>
                </div>
                <div className="install-prompt__actions">
                    <button type="button" className="install-prompt__dismiss" onClick={handleDismiss}>
                        Later
                    </button>
                    <button type="button" className="install-prompt__install" onClick={handleInstall}>
                        Install
                    </button>
                </div>
            </div>
        );
    }

    if (!isIosVisible) {
        return null;
    }

    return (
        <div className="install-prompt install-prompt--ios" role="dialog" aria-live="polite" aria-label="iOS add to home screen prompt">
            <div className="install-prompt__icon-wrap" aria-hidden="true">
                <Download size={18} />
            </div>
            <div className="install-prompt__copy">
                <h3>Add To Home Screen</h3>
                <p>In Safari, tap share icon then choose Add to Home Screen for app-style access.</p>
                <ol className="install-prompt__steps">
                    <li>Tap Safari Share button.</li>
                    <li>Scroll and tap Add to Home Screen.</li>
                    <li>Tap Add to install Event Dashboard.</li>
                </ol>
            </div>
            <div className="install-prompt__actions">
                <button type="button" className="install-prompt__dismiss" onClick={handleIosDismiss}>
                    Got it
                </button>
            </div>
        </div>
    );
}

export default InstallPrompt;

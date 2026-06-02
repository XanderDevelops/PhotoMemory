/**
 * Platform API Adapter for Line It Up
 * Decouples game logic from portal-specific SDKs (CrazyGames, Poki, etc.)
 */
class PlatformAdapter {
    constructor() {
        this.activePlatform = 'default';
        this.sdk = null;
        this.adsRemoved = localStorage.getItem('lineitup_ads_removed') === 'true';
        this.onMuteCallbacks = [];
        this.onUnmuteCallbacks = [];
    }

    async init() {
        console.log("[Platform] Initializing Platform Adapter...");
        
        // Detect if CrazyGames SDK is available on the window
        if (window.CrazyGames && window.CrazyGames.SDK) {
            try {
                this.activePlatform = 'crazygames';
                this.sdk = window.CrazyGames.SDK;
                console.log("[Platform] CrazyGames SDK detected. Initializing...");
                
                // Track focus/ad events for automatic muting
                this.sdk.addEventListener('adStarted', () => this.triggerMute());
                this.sdk.addEventListener('adFinished', () => this.triggerUnmute());
                
                // Mute audio on focus loss
                document.addEventListener('visibilitychange', () => {
                    if (document.hidden) {
                        this.triggerMute();
                    } else {
                        this.triggerUnmute();
                    }
                });
            } catch (e) {
                console.error("[Platform] CrazyGames initialization failed:", e);
                this.activePlatform = 'default';
            }
        } else {
            console.log("[Platform] No portal SDK detected, running in default browser mode.");
            this.activePlatform = 'default';
        }
    }

    /**
     * Show Interstitial Ad (Midgame Ad)
     */
    showInterstitial(onAdClosed) {
        if (this.adsRemoved) {
            console.log("[Platform] Ads are removed. Skipping interstitial.");
            if (onAdClosed) onAdClosed();
            return;
        }

        console.log("[Platform] Requesting Interstitial Ad...");

        if (this.activePlatform === 'crazygames' && this.sdk) {
            this.triggerMute();
            this.sdk.ad.requestAd('midgame', {
                adStarted: () => {
                    console.log("[Platform] CrazyGames Interstitial started.");
                    this.triggerMute();
                },
                adFinished: () => {
                    console.log("[Platform] CrazyGames Interstitial closed.");
                    this.triggerUnmute();
                    if (onAdClosed) onAdClosed();
                },
                adError: (err) => {
                    console.warn("[Platform] CrazyGames Interstitial error:", err);
                    this.triggerUnmute();
                    if (onAdClosed) onAdClosed();
                }
            });
        } else {
            // Default browser fallback mock overlay
            this.showMockAdOverlay('Interstitial Ad', onAdClosed);
        }
    }

    /**
     * Show Rewarded Ad (for +2 extra guesses)
     */
    showRewarded(onRewardGranted, onAdClosed) {
        console.log("[Platform] Requesting Rewarded Ad...");

        if (this.activePlatform === 'crazygames' && this.sdk) {
            this.triggerMute();
            this.sdk.ad.requestAd('rewarded', {
                adStarted: () => {
                    console.log("[Platform] CrazyGames Rewarded ad started.");
                    this.triggerMute();
                },
                adFinished: () => {
                    console.log("[Platform] CrazyGames Rewarded ad watched successfully. Granting reward.");
                    this.triggerUnmute();
                    if (onRewardGranted) onRewardGranted();
                    if (onAdClosed) onAdClosed();
                },
                adError: (err) => {
                    console.warn("[Platform] CrazyGames Rewarded ad error/skipped:", err);
                    this.triggerUnmute();
                    if (onAdClosed) onAdClosed();
                }
            });
        } else {
            // Default browser fallback mock overlay
            this.showMockAdOverlay('Rewarded Ad (Watch for +2 Guesses)', () => {
                if (onRewardGranted) onRewardGranted();
                if (onAdClosed) onAdClosed();
            });
        }
    }

    /**
     * Report score to the Leaderboard
     */
    submitScore(leaderboardId, score) {
        console.log(`[Platform] Submitting score of ${score} to leaderboard ${leaderboardId}`);
        
        if (this.activePlatform === 'crazygames' && this.sdk) {
            try {
                this.sdk.game.submitScore({
                    leaderboardId: leaderboardId,
                    value: score
                });
            } catch (e) {
                console.error("[Platform] Leaderboard submit failed:", e);
            }
        } else {
            // Store locally for default browser leaderboard Mock
            let leaderboard = JSON.parse(localStorage.getItem('lineitup_leaderboard_' + leaderboardId) || '[]');
            const username = this.getUsername();
            
            // Check if user already exists
            const existingIdx = leaderboard.findIndex(item => item.name === username);
            if (existingIdx !== -1) {
                // Keep the better score (lower guesses is better in Solo)
                if (score < leaderboard[existingIdx].score) {
                    leaderboard[existingIdx].score = score;
                }
            } else {
                leaderboard.push({ name: username, score: score, date: new Date().toLocaleDateString() });
            }
            
            // Sort: lower guesses first
            leaderboard.sort((a, b) => a.score - b.score);
            localStorage.setItem('lineitup_leaderboard_' + leaderboardId, JSON.stringify(leaderboard.slice(0, 20)));
        }
    }

    /**
     * Fetch leaderboard statistics
     */
    getLeaderboard(leaderboardId) {
        if (this.activePlatform === 'crazygames') {
            // CrazyGames handles leaderboards in their system overlay
            return [];
        }
        
        // Return local fallback list
        return JSON.parse(localStorage.getItem('lineitup_leaderboard_' + leaderboardId) || '[]');
    }

    /**
     * Check if ads are removed
     */
    isAdsRemoved() {
        return this.adsRemoved;
    }

    /**
     * Buy "Remove Ads" IAP
     */
    purchaseRemoveAds(onSuccess) {
        console.log("[Platform] Initiating Remove Ads purchase...");
        
        // Mock purchase delay
        setTimeout(() => {
            this.adsRemoved = true;
            localStorage.setItem('lineitup_ads_removed', 'true');
            console.log("[Platform] Purchase complete! Ads removed.");
            if (onSuccess) onSuccess();
        }, 1000);
    }

    /**
     * Get player's active username
     */
    getUsername() {
        let savedName = localStorage.getItem('lineitup_username');
        if (!savedName) {
            savedName = 'Player_' + Math.floor(1000 + Math.random() * 9000);
            localStorage.setItem('lineitup_username', savedName);
        }
        return savedName;
    }

    /**
     * Update player's local username
     */
    setUsername(newName) {
        if (!newName || newName.trim() === '') return;
        localStorage.setItem('lineitup_username', newName.trim());
    }

    // Audio Sync Listeners
    onMute(callback) {
        this.onMuteCallbacks.push(callback);
    }

    onUnmute(callback) {
        this.onUnmuteCallbacks.push(callback);
    }

    triggerMute() {
        this.onMuteCallbacks.forEach(cb => {
            try { cb(); } catch(e) {}
        });
    }

    triggerUnmute() {
        this.onUnmuteCallbacks.forEach(cb => {
            try { cb(); } catch(e) {}
        });
    }

    /**
     * Helper to show a beautiful retro-styled mock ad overlay in standalone mode
     */
    showMockAdOverlay(title, onClosed) {
        const overlay = document.createElement('div');
        overlay.id = 'mock-ad-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(26, 26, 26, 0.95)';
        overlay.style.zIndex = '999999';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.fontFamily = "'Fredoka', sans-serif";
        overlay.style.color = '#FFFDF6';
        
        // Trigger mute for the mock ad duration
        this.triggerMute();

        overlay.innerHTML = `
            <div style="background-color: #FFFDF6; border: 4px solid #1A1A1A; padding: 40px; border-radius: 12px; max-width: 450px; text-align: center; color: #1A1A1A; box-shadow: 8px 8px 0px #FF3E4D; margin: 20px; box-sizing: border-box;">
                <h2 style="margin-top: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 1px; color: #FF3E4D;">📺 ${title}</h2>
                <p style="font-family: 'Outfit', sans-serif; font-size: 16px; margin: 20px 0; color: #555;">This mock ad simulates a platform ad. In production on CrazyGames, the official SDK ad player will render.</p>
                <div style="width: 100%; height: 10px; background-color: #EEE; border: 2px solid #1A1A1A; border-radius: 5px; margin-bottom: 25px; overflow: hidden; position: relative;">
                    <div id="mock-ad-progress" style="width: 0%; height: 100%; background-color: #FFC93C; transition: width 3s linear;"></div>
                </div>
                <button id="close-mock-ad-btn" disabled style="background-color: #DDD; color: #888; font-family: 'Fredoka', sans-serif; font-size: 18px; padding: 12px 25px; border: 3px solid #1A1A1A; border-radius: 8px; cursor: not-allowed; transition: all 0.2s;">
                    Wait 3s...
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Animate progress bar
        setTimeout(() => {
            const bar = document.getElementById('mock-ad-progress');
            if (bar) bar.style.width = '100%';
        }, 100);

        // Enable close button after 3 seconds
        setTimeout(() => {
            const btn = document.getElementById('close-mock-ad-btn');
            if (btn) {
                btn.disabled = false;
                btn.style.backgroundColor = '#12947F';
                btn.style.color = '#FFFDF6';
                btn.style.cursor = 'pointer';
                btn.innerText = 'Close Ad & Resume';
                btn.addEventListener('click', () => {
                    document.body.removeChild(overlay);
                    this.triggerUnmute();
                    if (onClosed) onClosed();
                });
            }
        }, 3000);
    }
}

// Export global instance
window.Platform = new PlatformAdapter();

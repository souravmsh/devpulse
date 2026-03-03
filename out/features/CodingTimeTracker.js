"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodingTimeTracker = void 0;
const vscode = require("vscode");
class CodingTimeTracker {
    constructor(context) {
        this.context = context;
        this._codingTime = 0;
        this._lastActiveTime = Date.now();
        this._timerPaused = false;
        this.loadTime();
        context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(() => this.updateActivity()), vscode.window.onDidChangeActiveTextEditor(() => this.updateActivity()));
        // Persist every minute
        this._saveInterval = setInterval(() => {
            this.context.globalState.update('heartbeat.codingTime', this._codingTime);
        }, 60000);
    }
    loadTime() {
        let savedTime = this.context.globalState.get('heartbeat.codingTime');
        if (savedTime === undefined)
            savedTime = this.context.globalState.get('takeABreak.codingTime');
        let savedDateStr = this.context.globalState.get('heartbeat.codingDate');
        if (savedDateStr === undefined)
            savedDateStr = this.context.globalState.get('takeABreak.codingDate');
        const todayStr = new Date().toDateString();
        // Reset day if it's a new day
        if (savedDateStr !== todayStr) {
            this._codingTime = 0;
            this.context.globalState.update('heartbeat.codingDate', todayStr);
        }
        else if (savedTime !== undefined) {
            this._codingTime = savedTime;
        }
    }
    updateActivity() {
        if (this._timerPaused)
            return;
        const now = Date.now();
        // 5-minute inactivity threshold
        if (now - this._lastActiveTime < 300000) {
            this._codingTime += (now - this._lastActiveTime);
        }
        this._lastActiveTime = now;
    }
    getTrackerData() {
        this.updateActivity(); // Trigger calculation on fetch
        return {
            codingTimeMs: this._codingTime
        };
    }
    togglePause() {
        this._timerPaused = !this._timerPaused;
        if (!this._timerPaused) {
            this._lastActiveTime = Date.now(); // Reset baseline on resume
        }
    }
    isPaused() {
        return this._timerPaused;
    }
    resetTime() {
        this._codingTime = 0;
        this._lastActiveTime = Date.now();
        this.context.globalState.update('heartbeat.codingTime', this._codingTime);
    }
}
exports.CodingTimeTracker = CodingTimeTracker;
//# sourceMappingURL=CodingTimeTracker.js.map
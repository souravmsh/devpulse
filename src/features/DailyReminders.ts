import * as vscode from 'vscode';

export interface DailyReminder {
    id: string;
    name: string;
    time: string; // HH:mm
    date?: string; // YYYY-MM-DD
}

export class DailyReminders {
    private _reminders: DailyReminder[] = [];
    private _lastNotified: Map<string, string> = new Map();
    public onReminder?: (reminder: DailyReminder) => void;

    constructor(private context: vscode.ExtensionContext) {
        this.loadReminders();
        setInterval(() => this.checkReminders(), 30000); // Check every 30s
    }

    addReminder(name: string, time: string, date?: string) {
        this._reminders.push({
            id: Date.now().toString(),
            name,
            time,
            date
        });
        this.saveReminders();
    }

    removeReminder(id: string) {
        this._reminders = this._reminders.filter(r => r.id !== id);
        this._lastNotified.delete(id);
        this.saveReminders();
    }

    getReminders() {
        return this._reminders;
    }

    public loadReminders() {
        const data = this.context.globalState.get<DailyReminder[]>('heartbeat.dailyReminders');
        if (data) {
            this._reminders = data;
        }
    }

    private saveReminders() {
        this.context.globalState.update('heartbeat.dailyReminders', this._reminders);
    }

    private checkReminders() {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const todayDate = now.toISOString().split('T')[0];

        this._reminders.forEach(r => {
            if (r.time === currentTime) {
                if (r.date) {
                    // One-time reminder
                    if (r.date === todayDate) {
                        if (this._lastNotified.get(r.id) !== todayDate) {
                            if (this.onReminder) this.onReminder(r);
                            this._lastNotified.set(r.id, todayDate);
                            // Auto-remove one-time reminders after triggering? 
                            // Or keep them but mark as notified. Let's keep for now.
                        }
                    }
                } else {
                    // Daily reminder
                    const lastDate = this._lastNotified.get(r.id);
                    if (lastDate !== todayDate) {
                        if (this.onReminder) this.onReminder(r);
                        this._lastNotified.set(r.id, todayDate);
                    }
                }
            }
        });
    }
}

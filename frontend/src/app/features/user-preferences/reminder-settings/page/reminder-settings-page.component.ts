import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { I18nService } from 'core-app/core/i18n/i18n.service';
import { CurrentUserService } from 'core-app/core/current-user/current-user.service';
import { take } from 'rxjs/internal/operators/take';
import { UIRouterGlobals } from '@uirouter/core';
import { UserPreferencesService } from 'core-app/features/user-preferences/state/user-preferences.service';
import {
  FormArray,
  FormBuilder,
} from '@angular/forms';
import {
  DailyRemindersSettings,
  ImmediateRemindersSettings,
} from 'core-app/features/user-preferences/state/user-preferences.model';
import {
  emailAlerts,
  EmailAlertType,
} from 'core-app/features/user-preferences/reminder-settings/email-alerts/email-alerts-settings.component';
import { UntilDestroyedMixin } from 'core-app/shared/helpers/angular/until-destroyed.mixin';
import {
  filter,
  withLatestFrom,
} from 'rxjs/operators';
import { filterObservable } from 'core-app/shared/helpers/rxjs/filterWith';

export const myReminderPageComponentSelector = 'op-reminders-page';

interface IReminderSettingsFormValue {
  immediateReminders:ImmediateRemindersSettings,
  dailyReminders:DailyRemindersSettings,
  emailAlerts:Record<EmailAlertType, boolean>;
}

@Component({
  selector: myReminderPageComponentSelector,
  templateUrl: './reminder-settings-page.component.html',
  styleUrls: ['./reminder-settings-page.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReminderSettingsPageComponent extends UntilDestroyedMixin implements OnInit {
  @Input() userId:string;

  public form = this.fb.group({
    immediateReminders: this.fb.group({
      mentioned: this.fb.control(false),
    }),
    dailyReminders: this.fb.group({
      enabled: this.fb.control(false),
      times: this.fb.array([]),
    }),
    emailAlerts: this.fb.group({
      newsAdded: this.fb.control(false),
      newsCommented: this.fb.control(false),
      documentAdded: this.fb.control(false),
      forumMessages: this.fb.control(false),
      wikiPageAdded: this.fb.control(false),
      wikiPageUpdated: this.fb.control(false),
      membershipAdded: this.fb.control(false),
      membershipUpdated: this.fb.control(false),
    }),
  });

  text = {
    title: this.I18n.t('js.reminders.settings.title'),
    save: this.I18n.t('js.button_save'),
    daily: {
      title: this.I18n.t('js.reminders.settings.daily.title'),
      explanation: this.I18n.t('js.reminders.settings.daily.explanation'),
    },
    immediate: {
      title: this.I18n.t('js.reminders.settings.immediate.title'),
      explanation: this.I18n.t('js.reminders.settings.immediate.explanation'),
    },
    alerts: {
      title: this.I18n.t('js.reminders.settings.alerts.title'),
      explanation: this.I18n.t('js.reminders.settings.alerts.explanation'),
    },
  };

  formInitialized = false;

  constructor(
    private I18n:I18nService,
    private storeService:UserPreferencesService,
    private currentUserService:CurrentUserService,
    private uiRouterGlobals:UIRouterGlobals,
    private fb:FormBuilder,
    private cdRef:ChangeDetectorRef,
  ) {
    super();
  }

  ngOnInit():void {
    this.userId = (this.userId || this.uiRouterGlobals.params.userId) as string;
    this
      .currentUserService
      .user$
      .pipe(take(1))
      .subscribe((user) => {
        this.userId = this.userId || user?.id as string;
        this.storeService.get(this.userId);
      });

    this.storeService.query.select()
      .pipe(
        filter((settings) => !!settings),
        withLatestFrom(this.storeService.query.globalNotification$),
        filterObservable(this.storeService.query.selectLoading(), (val) => !val),
      )
      .subscribe(([settings, globalSetting]) => {
        this.form.get('immediateReminders.mentioned')?.setValue(settings.immediateReminders.mentioned);

        this.form.get('dailyReminders.enabled')?.setValue(settings.dailyReminders.enabled);

        const dailyReminderTimes = this.form.get('dailyReminders.times') as FormArray;
        dailyReminderTimes.clear({ emitEvent: false });
        settings.dailyReminders.times.forEach((time) => {
          dailyReminderTimes.push(this.fb.control(time), { emitEvent: false });
        });

        dailyReminderTimes.enable({ emitEvent: true });

        emailAlerts.forEach((alert) => {
          this.form.get(`emailAlerts.${alert}`)?.setValue(globalSetting[alert]);
        });

        this.formInitialized = true;
        this.cdRef.detectChanges();
      });
  }

  public saveChanges():void {
    const prefs = this.storeService.query.getValue();
    const globalNotifications = prefs.notifications.filter((notification) => !notification._links.project.href);
    const projectNotifications = prefs.notifications.filter((notification) => !!notification._links.project.href);
    const reminderSettings = (this.form.value as IReminderSettingsFormValue);

    this.storeService.update(this.userId, {
      ...prefs,
      dailyReminders: reminderSettings.dailyReminders,
      immediateReminders: reminderSettings.immediateReminders,
      notifications: [
        ...globalNotifications.map((notification) => (
          {
            ...notification,
            ...reminderSettings.emailAlerts,
          }
        )),
        ...projectNotifications,
      ],
    });
  }
}

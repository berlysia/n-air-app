import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';
import { remote } from 'electron';
import { $t } from 'services/i18n';

@Component({})
export default class ProgramInfo extends Vue {
  @Inject()
  nicoliveProgramService: NicoliveProgramService;

  isCreating: boolean = false;
  async createProgram() {
    try {
      this.isCreating = true;
      return await this.nicoliveProgramService.createProgram();
    } catch (e) {
      // TODO
      console.warn(e);
    } finally {
      this.isCreating = false;
    }
  }

  isFetching: boolean = false;
  async fetchProgram() {
    try {
      this.isFetching = true;
      return await this.nicoliveProgramService.fetchProgram();
    } catch (e) {
      console.warn(e);
      // TODO: 翻訳
      // TODO: エラー理由を見て出し分ける
      await new Promise(resolve => {
        remote.dialog.showMessageBox(
          remote.getCurrentWindow(),
          {
            type: 'warning',
            message: 'ニコニコ生放送にて番組が作成されていません。\n［番組作成］ボタンより、番組を作成してください。',
            buttons: [$t('common.ok')],
            noLink: true,
          },
          done => resolve(done)
        );
      });
    } finally {
      this.isFetching = false;
    }
  }

  isStarting: boolean = false;
  async startProgram() {
    try {
      this.isStarting = true;
      return await this.nicoliveProgramService.startProgram();
    } catch (e) {
      // TODO
      console.warn(e);
    } finally {
      this.isStarting = false;
    }
  }

  isEnding: boolean = false;
  async endProgram() {
    try {
      this.isEnding = true;
      const isOk = await new Promise(resolve => {
        // TODO: 翻訳
        remote.dialog.showMessageBox(
          remote.getCurrentWindow(),
          {
            type: 'warning',
            message: '番組を終了しますか？',
            buttons: ['終了する', $t('common.cancel')],
            noLink: true,
          },
          idx => resolve(idx === 0)
        );
      });

      if (isOk) {
        return await this.nicoliveProgramService.endProgram();
      }
    } catch (e) {
      // TODO
      console.warn(e);
    } finally {
      this.isEnding = false;
    }
  }

  get programStatus(): string {
    return this.nicoliveProgramService.state.status;
  }

  get programTitle(): string {
    return this.nicoliveProgramService.state.title;
  }

  get communityID(): string {
    return this.nicoliveProgramService.state.communityID;
  }

  get communityName(): string {
    return this.nicoliveProgramService.state.communityName;
  }

  get communitySymbol(): string {
    return this.nicoliveProgramService.state.communitySymbol;
  }

  get viewers(): number {
    return this.nicoliveProgramService.state.viewers;
  }

  get comments(): number {
    return this.nicoliveProgramService.state.comments;
  }

  get adPoint(): number {
    return this.nicoliveProgramService.state.adPoint;
  }

  get giftPoint(): number {
    return this.nicoliveProgramService.state.giftPoint;
  }

  get programEndTime(): number {
    return this.nicoliveProgramService.state.endTime;
  }

  get programStartTime(): number {
    return this.nicoliveProgramService.state.startTime;
  }

  currentTime: number = 0;
  updateCurrrentTime() {
    this.currentTime = Math.floor(Date.now() / 1000);
  }

  get programCurrentTime(): number {
    return this.currentTime - this.programStartTime;
  }

  @Watch('programStatus')
  onStatusChange(newValue: string, oldValue: string) {
    if (newValue === 'end') {
      clearInterval(this.timeTimer);
    } else if (oldValue === 'end') {
      clearInterval(this.timeTimer);
      this.startTimer();
    }
  }

  startTimer() {
    this.timeTimer = (setInterval(() => this.updateCurrrentTime(), 1000) as any) as number;
  }

  timeTimer: number = 0;
  mounted() {
    this.startTimer();
  }
}

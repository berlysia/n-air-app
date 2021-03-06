import { mutation, StatefulService } from './stateful-service';
import * as obs from '../../obs-api';
import {
  getPropertiesFormData,
  IListOption, setPropertiesFormData,
  TFormData, TObsValue
} from '../components/shared/forms/Input';
import { Inject } from '../util/injector';
import { WindowsService } from './windows';
import { $t } from 'services/i18n';

interface ISceneTransitionsState {
  availableTransitions: IListOption<string>[];
  duration: number;
  properties: TFormData;
  type: string;
}

export class ScenesTransitionsService extends StatefulService<ISceneTransitionsState> {

  static initialState = {
    duration: 300,
    type: '',
  } as ISceneTransitionsState;

  @Inject()
  windowsService: WindowsService;


  init() {
    // Set the default transition type
    this.setType('cut_transition');
  }


  @mutation()
  private SET_TYPE(type: string) {
    this.state.type = type;
  }


  @mutation()
  private SET_DURATION(duration: number) {
    this.state.duration = duration;
  }

  getTypes(): IListOption<string>[] {
    return [
      { description: $t('transitions.cut_transition'), value: 'cut_transition' },
      { description: $t('transitions.fade_transition'), value: 'fade_transition' },
      { description: $t('transitions.swipe_transition'), value: 'swipe_transition' },
      { description: $t('transitions.slide_transition'), value: 'slide_transition' },
      { description: $t('transitions.fade_to_color_transition'), value: 'fade_to_color_transition' },
      { description: $t('transitions.wipe_transition'), value: 'wipe_transition' },
      { description: $t('transitions.obs_stinger_transition'), value: 'obs_stinger_transition' }
    ];
  }

  transitionTo(scene: obs.IScene) {
    const transition = this.getCurrentTransition();
    transition.start(this.state.duration, scene);
  }


  release() {
    this.getCurrentTransition().release();
  }

  reset() {
    this.release();
    obs.Global.setOutputSource(0, null);
  }

  getSettings(): Dictionary<TObsValue> {
    return this.getCurrentTransition().settings;
  }

  setSettings(settings: Dictionary<TObsValue>)  {
    this.getCurrentTransition().update(settings);
  }

  getPropertiesFormData(): TFormData {
    return getPropertiesFormData(this.getCurrentTransition()) || [];
  }

  setPropertiesFormData(formData: TFormData) {
    return setPropertiesFormData(this.getCurrentTransition(), formData);
  }

  private getCurrentTransition() {
    return obs.Global.getOutputSource(0) as obs.ITransition;
  }


  setType(type: string) {
    const oldTransition = this.getCurrentTransition() as obs.ITransition;

    const transition = this.getTypes().find(transition => {
      return transition.value === type;
    });

    if (transition) {
      const newTransition = obs.TransitionFactory.create(type, 'Global Transition');
      obs.Global.setOutputSource(0, newTransition);

      if (oldTransition && oldTransition.getActiveSource) {
        newTransition.set(oldTransition.getActiveSource());
        oldTransition.release();
      }

      this.SET_TYPE(type);
    }
  }


  setDuration(duration: number) {
    this.SET_DURATION(duration);
  }


  getFormData() {
    return {
      type: {
        description: $t('transitions.transition'),
        name: 'type',
        value: this.state.type,
        options: this.getTypes()
      },
      duration: {
        description: $t('transitions.duration'),
        name: 'duration',
        value: this.state.duration
      }
    };
  }


  showSceneTransitions() {
    this.windowsService.showWindow({
      componentName: 'SceneTransitions',
      size: {
        width: 500,
        height: 600
      }
    });
  }
}

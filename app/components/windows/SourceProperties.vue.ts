import Vue from 'vue';
import cloneDeep from 'lodash/cloneDeep';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { TFormData } from 'components/shared/forms/Input';
import { WindowsService } from 'services/windows';
import windowMixin from 'components/mixins/window';
import { ISourcesServiceApi } from 'services/sources';

import ModalLayout from 'components/ModalLayout.vue';
import Display from 'components/shared/Display.vue';
import GenericForm from 'components/shared/forms/GenericForm.vue';
import { $t } from 'services/i18n';

@Component({
  components: {
    ModalLayout,
    Display,
    GenericForm
  },
  mixins: [windowMixin]
})
export default class SourceProperties extends Vue {

  @Inject()
  sourcesService: ISourcesServiceApi;

  @Inject()
  windowsService: WindowsService;

  sourceId = this.windowsService.getChildWindowQueryParams().sourceId;
  source = this.sourcesService.getSource(this.sourceId);
  properties: TFormData = [];
  initialProperties: TFormData = [];
  tainted = false;

  mounted() {
    this.properties = this.source ? this.source.getPropertiesFormData() : [];
    this.initialProperties = cloneDeep(this.properties);
  }

  get propertiesManagerUI() {
    if (this.source) return  this.source.getPropertiesManagerUI();
  }

  onInputHandler(properties: TFormData, changedIndex: number) {
    const source = this.sourcesService.getSource(this.sourceId);
    source.setPropertiesFormData(
      [properties[changedIndex]]
    );
    this.tainted = true;
    this.refresh();
  }

  refresh() {
    this.properties = this.source.getPropertiesFormData();
  }

  closeWindow() {
    this.windowsService.closeChildWindow();
  }

  done() {
    this.closeWindow();
  }

  cancel() {
    if (this.tainted) {
      const source = this.sourcesService.getSource(this.sourceId);
      source.setPropertiesFormData(
        this.initialProperties
      );
    }
    this.closeWindow();
  }

  get windowTitle() {
    const source = this.sourcesService.getSource(this.sourceId);
    return source ? $t('sources.propertyWindowTitle', { sourceName: source.name }) : '';
  }

}

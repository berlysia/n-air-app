import {
    OptimizeSettings,
    filterKeyDescriptions,
    AllKeyDescriptions,
    OptimizationKey,
    CategoryName,
    EncoderType,
    SettingsKeyAccessor,
    ISettingsAccessor,
    iterateKeyDescriptions,
    Optimizer
} from './optimizer';
import { createSetupFunction } from 'util/test-setup';
import { readFileSync } from 'fs';
import { resolve } from 'path';
type ISettingsSubCategory = import('./settings-api').ISettingsSubCategory;
jest.mock('./settings-api');
jest.mock('services/i18n', () => ({
  $t: (x: string) => x,
}));
jest.mock('services/stateful-service');
jest.mock('util/injector');
jest.mock('services/obs-api', () => ({}));
jest.mock('components/shared/forms/Input', () => ({}));
jest.mock('services/windows', () => ({}));
jest.mock('services/hotkeys', () => ({}));
jest.mock('services/audio', () => ({}));
jest.mock('services/shortcuts', () => ({}));
jest.mock('services/selection', () => ({}));
jest.mock('services/video', () => ({}));
jest.mock('services/scenes', () => ({}));
jest.mock('services/sources', () => ({}));
jest.mock('services-manager', () => ({}));
jest.mock('services/ipc-server', () => ({}));
jest.mock('services/jsonrpc/jsonrpc', () => ({}));
jest.mock('services/jsonrpc', () => ({}));
jest.mock('util/menus/Menu', () => ({}));

const setup = createSetupFunction({
    injectee: {
        FileManagerService: {
            read(filename: string) {
                return readFileSync(filename, 'utf-8');
            },
            resolve(filepath: string) {
                return resolve(filepath);
            },
        },
    },
    state: {
        I18nService: {},
    },
});

test('filterKeyDescriptions', () => {
    const outputSimpleOnly: OptimizeSettings = {
        outputMode: 'Simple',
    }
    const simpleOnly = filterKeyDescriptions(outputSimpleOnly, AllKeyDescriptions);
    expect(simpleOnly).toEqual([{
        key: OptimizationKey.outputMode,
        category: CategoryName.output,
        subCategory: 'Untitled',
        setting: 'Mode',
        lookupValueName: true,
    }]);

    const qsvSettings: OptimizeSettings = {
        outputMode: 'Simple',
        simpleUseAdvanced: true,
    }
    const qsv = filterKeyDescriptions(qsvSettings, AllKeyDescriptions);
    expect(qsv).toMatchSnapshot();
});

test('SettingsKeyAccessor#traverseKeyDescriptions', () => {
    // テスト用の最小のdescriptionを用意する
    //  分岐があること
    const simpleSettings: OptimizeSettings = {
        outputMode: 'Simple',
        videoBitrate: 12345,
    }
    const simpleDescriptions = filterKeyDescriptions(simpleSettings, AllKeyDescriptions);
    expect(simpleDescriptions.length).toEqual(1);
    expect(simpleDescriptions[0].dependents).not.toBeFalsy();
    expect(simpleDescriptions[0].dependents.length).toEqual(2);

    const advancedSettings: OptimizeSettings = {
        outputMode: 'Advanced',
        videoBitrate: 12345,
    }
    const advancedDescriptions = filterKeyDescriptions(advancedSettings, AllKeyDescriptions);
    expect(advancedDescriptions.length).toEqual(1);
    expect(advancedDescriptions[0].dependents).not.toBeFalsy();
    expect(advancedDescriptions[0].dependents.length).toEqual(2);

    // アクセサのmockを作る
    let outputMode = 'Simple';
    const accessor = {
        findSettingValue: jest.fn().mockImplementation(
            (settings: ISettingsSubCategory[], category: string, setting: string) => {
                if (category === 'Untitled' && setting === 'Mode') {
                    return outputMode;
                }
                // Simple value
                if (category === 'Streaming' && setting === 'VBitrate') {
                    return 4649;
                }
                // Advanced value
                if (category === 'Streaming' && setting === 'Encoder') {
                    return 'obs_x264';
                }
                if (category === 'Streaming' && setting === 'rate_control') {
                    return 'CBR';
                }
                if (category === 'Streaming' && setting === 'bitrate') {
                    return 2525;
                }
                return undefined;
            }
        ),
        getSettingsFormData: jest.fn(),
        findSetting: jest.fn(),
        setSettings: jest.fn()
    };
    const a = new SettingsKeyAccessor(accessor);

    // 分岐の選択されている側のみの値が得られること
    outputMode = 'Simple';
    const simpleResult = [...a.travarseKeyDescriptions(simpleDescriptions, d => [d.key, d.setting])];

    expect(accessor.findSettingValue).toHaveBeenCalledTimes(1);
    expect(accessor.findSettingValue).toHaveBeenLastCalledWith(undefined, 'Untitled', 'Mode');

    expect(simpleResult).toEqual([
        [OptimizationKey.outputMode, 'Mode'],
        [OptimizationKey.videoBitrate, 'VBitrate'],
    ]);

    outputMode = 'Advanced';
    const advancedResult = [...a.travarseKeyDescriptions(advancedDescriptions, d => [d.key, d.setting])];
    expect(advancedResult).toEqual([
        [OptimizationKey.outputMode, 'Mode'],
        [OptimizationKey.encoder, 'Encoder'],
        [OptimizationKey.advRateControl, 'rate_control'],
        [OptimizationKey.videoBitrate, 'bitrate'],
    ]);
});

test('iterateKeyDescriptions', () => {
    const best: OptimizeSettings = {
        outputMode: 'Simple',
        videoBitrate: 5808,
        audioBitrate: '192',
        quality: '1280x720',
        fpsType: 'Common FPS Values',
        fpsCommon: '30',
        encoder: EncoderType.x264,
        simpleUseAdvanced: true,
        encoderPreset: 'ultrafast',
    };
    const pairs = [...iterateKeyDescriptions(best, AllKeyDescriptions)].map(desc => [desc.key, desc.setting]);
    expect(pairs).toEqual([
        [OptimizationKey.outputMode, 'Mode'],
        [OptimizationKey.videoBitrate, 'VBitrate'],
        [OptimizationKey.encoder, 'StreamEncoder'],
        [OptimizationKey.simpleUseAdvanced, 'UseAdvanced'],
        [OptimizationKey.encoderPreset, 'Preset'],
        [OptimizationKey.audioBitrate, 'ABitrate'],
        [OptimizationKey.quality, 'Output'],
        [OptimizationKey.fpsType, 'FPSType'],
        [OptimizationKey.fpsCommon, 'FPSCommon'],
    ])
});

test('SettingsKeyAccessor#optimizeInfo', () => {
    const current: OptimizeSettings = {
        outputMode: 'Advanced',
        encoder: EncoderType.x264,
        videoBitrate: 5808,
        quality: '1280x720',
        fpsType: 'Common FPS Values',
        fpsCommon: '30',
        audioBitrate: '128',
    };
    const best: OptimizeSettings = {
        outputMode: 'Simple',
        videoBitrate: 5808,
        audioBitrate: '192',
        quality: '1280x720',
        fpsType: 'Common FPS Values',
        fpsCommon: '30',
        encoder: EncoderType.x264,
        simpleUseAdvanced: true,
        encoderPreset: 'ultrafast',
    };
    const expectedDiff: OptimizeSettings = {
        outputMode: 'Simple',
        audioBitrate: '192',
        simpleUseAdvanced: true,
        encoderPreset: 'ultrafast',
    };
    const delta: OptimizeSettings = Object.assign({}, ...Optimizer.getDifference(current, best));
    expect(delta).toEqual(expectedDiff);

    const accessor = {
        findSettingValue: jest.fn(),
        getSettingsFormData: jest.fn(),
        findSetting: jest.fn(),
        setSettings: jest.fn()
    };
    const a = new SettingsKeyAccessor(accessor);

    const opt = new Optimizer(a, best);
    expect(opt.optimizeInfo(current, delta)).toMatchSnapshot();
});

test.todo('Optimizer#getCurrentSettings');

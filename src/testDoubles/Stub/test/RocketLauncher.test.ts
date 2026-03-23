import { describe, it, expect, vi } from "vitest";
import {RocketLauncherImpl, WeatherRepositoryImpl} from "../RocketLauncher.js";
import {StubRainyWeatherRepository, StubSunnyWeatherRepository} from "./StubWeatherRepository.js";

describe('RocketLauncherImpl（ロケット発射装置）のテスト', () => {


    // 今の実装は WeatherRepositoryImpl を使っていますが、これはランダムに「晴れ」か「雨」を返すため、テストが安定しません。
    // まずはこの「晴れ」の時のテストが通るように、StubSunnyWeatherRepository を実装し、「晴れ」の状態を Stubしよう
    // 正しく Stub ができたら、まずは「晴れ」のテストが通るようにrocketLauncher の実装を修正しましょう。
    it('天気が「晴れ」の場合、打ち上げを実行すること', async () => {
        const weatherRepository = new StubSunnyWeatherRepository()
        const rocketLauncher = new RocketLauncherImpl(weatherRepository)

        const result = await rocketLauncher.launch()

        expect(result).toBeTruthy()
    })

    // 今度は「雨」の時のテストをするために、stubRainyWeatherRepository を実装し、
    // 正しく Stub ができたら、どちらのテストも通るように、rocketLauncher を再度修正しましょう。
    it('天気が「雨」の場合、打ち上げを中止すること', async () => {
        const weatherRepository = new StubRainyWeatherRepository()
        const rocketLauncher = new RocketLauncherImpl(weatherRepository)

        const result = await rocketLauncher.launch()

        expect(result).toBeFalsy()
    })

    // vi.fn() を使って、モック関数を作成してみましょう。モック関数を使うと、より簡単に「晴れ」の状態を Stub できます。
    it('天気が「晴れ」の場合、打ち上げを実行すること(モック関数を使った場合)', async () => {
    })
    // モック関数を使って、「雨」の状態も Stub してみましょう。
    it('天気が「雨」の場合、打ち上げを中止すること(モック関数を使った場合)', async () => {

    })
})
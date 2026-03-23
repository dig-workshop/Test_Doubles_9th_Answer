import type {LaunchRocketSystem, Weather, WeatherRepository} from "./Types.js";

export class WeatherRepositoryImpl implements WeatherRepository {
    getWeather(): Promise<Weather> {
        const random = Math.random()
        if (random < 0.5) {
            return Promise.resolve("RAINY")
        } else {
            return Promise.resolve("SUNNY")
        }
    }
}

export class RocketLauncherImpl implements LaunchRocketSystem {
    constructor(private weatherRepository: WeatherRepository = new WeatherRepositoryImpl) {}

    async launch (): Promise<boolean> {
        // まずは「晴れ」の時のテストが通るように書き換えましょう。
        // 「晴れ」のテストが通り、「雨」の Stub ができたら、どちらのテストも通るように書き換えてください。
        if (await this.weatherRepository.getWeather() === "SUNNY" ) {
            return Promise.resolve(true)
        }else {
            return Promise.resolve(false)
        }
    }

}
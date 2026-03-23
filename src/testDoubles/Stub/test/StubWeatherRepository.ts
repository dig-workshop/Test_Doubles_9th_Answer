import type {Weather, WeatherRepository} from "../Types.js";

export class StubSunnyWeatherRepository implements WeatherRepository {
    // 「晴れ」の状態を Stub できるように実装してください。
  getWeather: () => Promise<Weather> = async () => {
    return "SUNNY"
  }
}

export class StubRainyWeatherRepository implements WeatherRepository {
    // 「雨」の状態を Stub できるように実装してください。
  getWeather: () => Promise<Weather> = async () => {
    return "RAINY"
  }
}

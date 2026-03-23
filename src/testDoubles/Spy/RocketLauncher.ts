import type {Auth, LaunchRocketSystem, Rocket} from "./Types.js";

export class RocketLauncherImpl implements LaunchRocketSystem {

    launch(rocket: Rocket, auth: Auth) {
        // テストが通るように修正してください
        if (! auth.authenticate()) return
        rocket.fire()
    }
}
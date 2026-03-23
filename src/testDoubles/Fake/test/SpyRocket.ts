import type {Rocket} from "../Types.js";

export class SpyRocket implements Rocket {
    fire_wasCalled = false
    fire() {
        // Spy の役割を果たすように実装してください
        this.fire_wasCalled = true
    }
}
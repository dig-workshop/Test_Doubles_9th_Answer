import type {Rocket} from "../Types.js";

export class SpyRocket implements Rocket {
    fire_wasCalled = false
    fire() {
          this.fire_wasCalled = true
        // Spy の役割を果たすように実装してください
    }
}
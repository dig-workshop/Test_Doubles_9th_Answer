import type {Rocket} from "../Types.js";

export default class SpyRocket implements Rocket {
    fire_wasCalled: boolean = false
    fire(): void {
        // Spy の役割を果たすように実装してください
          this.fire_wasCalled = true
    }

    abort_wasCalled: boolean = false
    abort(): void {
        // Spy の役割を果たすように実装してください
          this.abort_wasCalled = true
    }
}
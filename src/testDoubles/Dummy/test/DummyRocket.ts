import type {Rocket} from "../Types.js";

export class DummyRocket implements Rocket {
    fire() {
        // Dummy の役割を果たすように実装してください
        throw Error("DummyRocket's fire method should not be called")
    }
}

import type {Rocket} from "../Types.js";
import {expect} from "vitest";

export class MockRocket implements Rocket {
    private fire_wasCalled = false
    fire(): void {
        // リファクタリング後のテストが通るように実装してください
        this.fire_wasCalled = true
    }

    private abort_wasCalled = false
    abort(): void {
        // リファクタリング後のテストが通るように実装してください
        this.abort_wasCalled = true
    }

    verifyTrigger() {
        // リファクタリング後のテストが通るように実装してください
        expect(this.fire_wasCalled).toBeTruthy()
        expect(this.abort_wasCalled).toBeFalsy()
    }

    verifyAbort() {
        // リファクタリング後のテストが通るように実装してください
        expect(this.fire_wasCalled).toBeFalsy()
        expect(this.abort_wasCalled).toBeTruthy()
    }
}
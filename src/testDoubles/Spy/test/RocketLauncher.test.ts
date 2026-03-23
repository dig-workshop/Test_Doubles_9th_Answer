import { describe, it, expect, vi } from "vitest";
import {SpyRocket} from "./SpyRocket.js";
import {StubFailureAuth, StubSuccessAuth} from "./StubAuth.js";
import {RocketLauncherImpl} from "../RocketLauncher.js";


describe('ロケット発射システム（RocketLauncherImpl）の認証機能のテスト', () => {

    // まずはこのテストが通るように、SpyRocket を実装しましょう。
    // 認証成功の状態を Stub できるよう、StubSuccessAuth も実装しましょう。
    it('認証が通った場合、ロケットが発射される', () => {
        const spyRocket = new SpyRocket()
        const stubSuccessAuth = new StubSuccessAuth()
        const rocketLauncher = new RocketLauncherImpl()

        rocketLauncher.launch(spyRocket, stubSuccessAuth)

        expect(spyRocket.fire_wasCalled).toBeTruthy()
    })

    // 上のテストで SpyRocket を正しく実装できていれば、
    // 認証失敗の状態を Stub するStubFailureAuth を実装すると、
    // このテストが通らなくなるはずです。
    // 今度はどちらのテストも通るように、rocketLauncher を修正しましょう。
    it('認証が通らなかった場合、ロケットが発射されない', () => {
        const rocketLauncher = new RocketLauncherImpl()
        const spyRocket = new SpyRocket()
        const stubFailureAuth = new StubFailureAuth()

        rocketLauncher.launch(spyRocket, stubFailureAuth)

        expect(spyRocket.fire_wasCalled).toBeFalsy()
    })

    // さらに、モック関数を使って、認証の認証の成功・失敗の状態を Stubしてみましょう。
    // spyRocketもモック関数を使って実装してみましょう。モック関数を使うと、toHaveBeenCalled() などの便利なマッチャーが使えるようになります。
    it(`認証が通らなかった場合、ロケットが発射されない（モック関数を使った場合）。`, () => {
        const rocketLauncher = new RocketLauncherImpl()
        const mockRocket = { fire: vi.fn() }
        const mockAuth = { authenticate: vi.fn().mockResolvedValue(false) }

        rocketLauncher.launch(mockRocket, mockAuth)

        expect(mockRocket.fire).not.toHaveBeenCalled()
    })
})

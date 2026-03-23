import type {Auth} from "../Types.js";

export class StubSuccessAuth implements Auth {
    // 認証成功の状態を Stub できるように実装してください。
  authenticate: () => boolean = () => {
    return true
  }
}

export class StubFailureAuth implements Auth {
    // 認証失敗の状態を Stub できるように実装してください。
  authenticate: () => boolean = () => {
    return false
  }
}
# Mock — テストダブルの自己検証パターン

## Mock の位置づけ — Spy/Stub からのリファクタリング

Mock は突然現れた概念ではなく、Stub → Spy → Mock という段階的な進化の結果として理解できる。

### Step 1: Stub で間接入力を制御する

Stub はテスト対象が依存先から受け取る値を制御するだけで、検証には関与しない。

### Step 2: Spy で間接出力を事後検証する

Spy は「テスト対象が依存先を正しく呼んだか」を記録し、テストコード側であとから検証する。

### Step 3: 検証ロジックをオブジェクト自身に移す → Mock

Spy のテストでは毎回「何回呼ばれたか確認」「引数を確認」「順番を確認」という同じパターンが繰り返される。この検証ロジックをテストダブル自身の責務として内包させたのが Mock である。

```
Stub: 値を返すだけ。検証はテスト側が戻り値に対して行う
  ↓ 「依存先への呼び出しも検証したい」
Spy:  呼び出しを記録する。検証はテスト側がログを調べて行う
  ↓ 「記録→検証のパターンが毎回同じだ。DRYにできないか」
Mock: 期待の定義と検証をオブジェクト自身に内包する
```

この流れは「Tell, Don't Ask」原則にも合致する。
Spy では「記録を取り出して外で調べる（Ask）」のに対し、Mock では「自分で検証しろと命じる（Tell）」というスタイルになっている。

---

## 事例 1: 注文処理における決済ゲートウェイの検証

注文を確定するとき、決済ゲートウェイが正しい金額で正しく 1 回だけ呼ばれることを検証する。

### テスト対象のコード

```typescript
interface PaymentGateway {
  charge(cardToken: string, amount: number): Promise<{ success: boolean }>;
}

class OrderService {
  constructor(private payment: PaymentGateway) {}

  async place(cardToken: string, unitPrice: number, qty: number) {
    const total = unitPrice * qty;
    const result = await this.payment.charge(cardToken, total);
    if (!result.success) {
      throw new Error("Payment failed");
    }
    return { status: "confirmed", total };
  }
}
```

### Spy パターン — テスト側が検証する

```typescript
// --- 最小限のアサーションヘルパー ---
function assertEqual<T>(actual: T, expected: T, label: string) {
  const ok = actual === expected;
  console.assert(ok, `${label}: 期待=${expected}, 実際=${actual}`);
}

function assertIncludes(actual: string, expected: string, label: string) {
  const ok = actual.includes(expected);
  console.assert(ok, `${label}: "${actual}" に "${expected}" が含まれていない`);
}

// --- Spy の実装 ---
// 呼び出しを記録するだけで、検証ロジックは持たない
class PaymentGatewaySpy implements PaymentGateway {
  calls: Array<{ cardToken: string; amount: number }> = [];

  async charge(cardToken: string, amount: number) {
    this.calls.push({ cardToken, amount });
    return { success: true };
  }
}

// --- テストコード ---
async function testOrderWithSpy() {
  const paymentSpy = new PaymentGatewaySpy();
  const service = new OrderService(paymentSpy);

  await service.place("card_123", 1500, 3);

  // テスト側が Spy の記録を取り出して検証する（Ask）
  assertEqual(paymentSpy.calls.length, 1, "charge の呼び出し回数");
  assertEqual(paymentSpy.calls[0].cardToken, "card_123", "cardToken");
  assertEqual(paymentSpy.calls[0].amount, 4500, "amount"); // 1500 × 3

}
```

Spy パターンでは、テストコード側が `calls` 配列を取り出し、ひとつひとつ手動で検証している。この「記録を取り出して→自分で調べる」がまさに Ask のスタイルである。

### Mock パターン — オブジェクト自身が検証する

```typescript
// --- Mock の自前実装 ---
// 「期待」を内部に持ち、verify() で自ら検証する
class PaymentGatewayMock implements PaymentGateway {
  private calls: Array<{ cardToken: string; amount: number }> = [];
  private expectedCalls: Array<{ cardToken: string; amount: number }> = [];

  // 期待を事前に登録する（テスト前に「こう呼ばれるはず」と宣言）
  expectCharge(cardToken: string, amount: number) {
    this.expectedCalls.push({ cardToken, amount });
  }

  // 実際に呼ばれたとき、記録する
  async charge(cardToken: string, amount: number) {
    this.calls.push({ cardToken, amount });
    return { success: true };
  }

  // Mock 自身が「期待通りだったか」を検証する
  verify() {
    assertEqual(this.calls.length, this.expectedCalls.length, "charge の呼び出し回数");
    for (let i = 0; i < this.expectedCalls.length; i++) {
      const expected = this.expectedCalls[i];
      const actual = this.calls[i];
      assertEqual(actual.cardToken, expected.cardToken, `${i + 1}回目の cardToken`);
      assertEqual(actual.amount, expected.amount, `${i + 1}回目の amount`);
    }
  }
}

// --- テストコード ---
async function testOrderWithMock() {
  // 1. Mock を作り、期待を宣言する
  const mockPayment = new PaymentGatewayMock();
  mockPayment.expectCharge("card_123", 4500); // 「この引数で1回呼ばれるはず」

  // 2. テスト対象を実行する
  const service = new OrderService(mockPayment);
  await service.place("card_123", 1500, 3);

  // 3. Mock 自身に「期待通りだったか検証しろ」と命じる（Tell）
  mockPayment.verify();

}
```

テストコード側は `calls` の中身を知らない。`verify()` を呼ぶだけで、Mock 自身が内部に持つ「期待」と「実際の呼び出し」を比較して合否を判定する。

### 比較

| 観点 | Spy パターン | Mock パターン |
| --- | --- | --- |
| 検証の主体 | テストコードが `calls` を取り出して自分で調べる | Mock の `verify()` が内部で判定する |
| テストコードが知ること | Spy の記録構造（配列の中身） | `expectCharge()` と `verify()` の API だけ |
| 検証の追加 | テストコード側に assert を足す | Mock クラスの `verify()` 内に集約 |
| Ask / Tell | Ask: 「記録を見せろ、こちらで調べる」 | Tell: 「期待を教えたから、自分で確かめろ」 |

---

## 事例 2: ユーザー登録における通知サービスの検証

ユーザー登録時に、ウェルカムメールと Slack 通知が正しい内容で送られることを検証する。複数の依存先への呼び出しを同時に検証するケース。

### テスト対象のコード

```typescript
interface EmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

interface SlackNotifier {
  notify(channel: string, message: string): Promise<void>;
}

interface UserRepository {
  save(user: { email: string; name: string }): Promise<{ id: string }>;
}

class UserRegistrationService {
  constructor(
    private repo: UserRepository,
    private email: EmailService,
    private slack: SlackNotifier
  ) {}

  async register(name: string, emailAddr: string) {
    const user = await this.repo.save({ email: emailAddr, name });

    await this.email.send(
      emailAddr,
      "Welcome!",
      `Hi ${name}, your account has been created.`
    );

    await this.slack.notify(
      "#new-users",
      `New user registered: ${name} (${emailAddr})`
    );

    return user;
  }
}
```

### Spy パターン — 2 つの Spy クラスを用意して事後検証

```typescript
class EmailServiceSpy implements EmailService {
  calls: Array<{ to: string; subject: string; body: string }> = [];
  async send(to: string, subject: string, body: string) {
    this.calls.push({ to, subject, body });
  }
}

class SlackNotifierSpy implements SlackNotifier {
  calls: Array<{ channel: string; message: string }> = [];
  async notify(channel: string, message: string) {
    this.calls.push({ channel, message });
  }
}

async function testRegistrationWithSpy() {
  const repoStub: UserRepository = {
    save: async (user) => ({ id: "user_001" }),
  };
  const emailSpy = new EmailServiceSpy();
  const slackSpy = new SlackNotifierSpy();
  const service = new UserRegistrationService(repoStub, emailSpy, slackSpy);

  await service.register("Taro", "taro@example.com");

  // テスト側が各 Spy の記録を掘り出して検証（Ask）

  // --- Email の検証 ---
  assertEqual(emailSpy.calls.length, 1, "Email の呼び出し回数");
  assertEqual(emailSpy.calls[0].to, "taro@example.com", "Email 宛先");
  assertEqual(emailSpy.calls[0].subject, "Welcome!", "Email 件名");
  assertIncludes(emailSpy.calls[0].body, "Taro", "Email 本文");

  // --- Slack の検証 ---
  assertEqual(slackSpy.calls.length, 1, "Slack の呼び出し回数");
  assertEqual(slackSpy.calls[0].channel, "#new-users", "Slack チャンネル");
  assertIncludes(slackSpy.calls[0].message, "Taro", "Slack メッセージ");

}
```

依存先が増えるほど、Spy クラスの定義と事後検証のコードが膨れ上がる。どの Spy のどのフィールドを取り出してどう比較するか、すべてテストコード側の責務になっている。

### Mock パターン — 各 Mock が自己検証する

```typescript
// --- Email の Mock ---
class EmailServiceMock implements EmailService {
  private calls: Array<{ to: string; subject: string; body: string }> = [];
  private expectedTo: string = "";
  private expectedSubject: string = "";
  private expectedBodyContains: string = "";

  expectSend(to: string, subject: string, bodyContains: string) {
    this.expectedTo = to;
    this.expectedSubject = subject;
    this.expectedBodyContains = bodyContains;
  }

  async send(to: string, subject: string, body: string) {
    this.calls.push({ to, subject, body });
  }

  verify() {
    assertEqual(this.calls.length, 1, "Email の呼び出し回数");
    const call = this.calls[0];
    assertEqual(call.to, this.expectedTo, "Email 宛先");
    assertEqual(call.subject, this.expectedSubject, "Email 件名");
    assertIncludes(call.body, this.expectedBodyContains, "Email 本文");
  }
}

// --- Slack の Mock ---
class SlackNotifierMock implements SlackNotifier {
  private calls: Array<{ channel: string; message: string }> = [];
  private expectedChannel: string = "";
  private expectedMessageContains: string = "";

  expectNotify(channel: string, messageContains: string) {
    this.expectedChannel = channel;
    this.expectedMessageContains = messageContains;
  }

  async notify(channel: string, message: string) {
    this.calls.push({ channel, message });
  }

  verify() {
    assertEqual(this.calls.length, 1, "Slack の呼び出し回数");
    const call = this.calls[0];
    assertEqual(call.channel, this.expectedChannel, "Slack チャンネル");
    assertIncludes(call.message, this.expectedMessageContains, "Slack メッセージ");
  }
}

// --- テストコード ---
async function testRegistrationWithMock() {
  const repoStub: UserRepository = {
    save: async () => ({ id: "user_001" }),
  };

  // 1. 各 Mock に期待を宣言する
  const mockEmail = new EmailServiceMock();
  mockEmail.expectSend("taro@example.com", "Welcome!", "Taro");

  const mockSlack = new SlackNotifierMock();
  mockSlack.expectNotify("#new-users", "Taro");

  // 2. テスト対象を実行する
  const service = new UserRegistrationService(repoStub, mockEmail, mockSlack);
  await service.register("Taro", "taro@example.com");

  // 3. 各 Mock に「自分で検証しろ」と命じる（Tell）
  mockEmail.verify();
  mockSlack.verify();

}
```

テストコードは `expectSend()` / `expectNotify()` で期待を宣言し、最後に `verify()` を呼ぶだけ。各 Mock の内部構造（`calls` 配列の中身）には一切触れていない。

### 比較

| 観点 | Spy パターン | Mock パターン |
| --- | --- | --- |
| 依存が増えたとき | Spy クラス＋検証コードが依存の数だけ膨張 | Mock クラスを足すが、テストコードは `verify()` を足すだけ |
| テストコードの責務 | 記録の取り出し＋比較ロジック全部 | 期待の宣言＋ `verify()` の呼び出しのみ |
| 検証ロジックの再利用 | テスト毎にコピペしがち | Mock クラス内に閉じているので再利用可能 |
| テストの読みやすさ | 何を検証しているか assert文を追って理解する | `expectSend("taro@...", "Welcome!", "Taro")` で意図が一目瞭然 |

---

## まとめ

Mock は Spy/Stub を使ったテストで繰り返し現れる「記録→事後検証」のボイラープレートを、テストダブル自身の責務として吸収したパターンである。これは DRY 原則の適用であると同時に、「Tell, Don't Ask」原則にも沿った設計上の移行。

自前で Mock を実装してみると、その構造がよくわかると思います。。Mock オブジェクトは内部に「期待（expected）」と「実際の呼び出し記録（actual）」の 2 つの状態を持ち、`verify()` メソッドで両者を突き合わせる。jest や vitst といったライブラリは、この仕組みを汎用化して提供しているに過ぎない。

概念として Stub・Spy・Mock を区別しておくことで、「このテストは何を検証しているのか」「検証の責務はどこにあるのか」という意図が明確になる。

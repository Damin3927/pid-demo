import type { ReactNode } from 'react'
import type { Gains } from '../sim/pid.ts'

export interface LabStep {
  kind: 'lab'
  id: string
  nav: string
  title: string
  lead: string
  active: { kp: boolean; ki: boolean; kd: boolean }
  defaults: Gains
  body: ReactNode
  tryThis: string[]
  watchFor: string[]
  antiWindup?: boolean
}

export interface IntroStep {
  kind: 'intro'
  id: string
  nav: string
  title: string
  body: ReactNode
}

export type Step = LabStep | IntroStep

const introBody: ReactNode = (
  <div className="space-y-4 text-sm leading-relaxed text-slate-300">
    <p>
      このデモでは、<strong className="text-slate-100">1関節のロボットアーム</strong>
      を題材に、PID制御を <span className="text-sky-300">P</span> →{' '}
      <span className="text-sky-300">PD</span> → <span className="text-sky-300">PID</span>{' '}
      と一段ずつ積み上げて理解します。
    </p>
    <p>
      アームはモーターのトルクで回転し、目標角度（黄色い破線）へ向かわせます。やっかいなのは
      <strong className="text-slate-100">重力</strong>です。アームを水平付近で支えるには常に一定の
      トルクが必要で、これが「外乱」として制御を難しくします。
    </p>
    <div className="rounded-lg bg-slate-800/50 p-4 ring-1 ring-white/5">
      <p className="mb-2 font-semibold text-slate-100">制御の基本式</p>
      <p className="font-mono text-sky-200">
        u = Kp·e + Ki·∫e dt + Kd·de/dt
      </p>
      <p className="mt-2 text-xs text-slate-400">
        e = 目標角度 − 現在角度（誤差）。u がモーターへ与えるトルク指令です。
      </p>
    </div>
    <ul className="space-y-2">
      <li>
        <span className="font-mono font-bold text-sky-300">P（比例）</span>
        ：今の誤差に比例して押す。大きいほど速いが、行き過ぎて振動しやすい。
      </li>
      <li>
        <span className="font-mono font-bold text-purple-300">D（微分）</span>
        ：誤差の変化の速さにブレーキをかける。振動を抑え、落ち着かせる。
      </li>
      <li>
        <span className="font-mono font-bold text-emerald-300">I（積分）</span>
        ：誤差を時間で積み上げて押す。残ってしまう定常偏差をゼロにする。
      </li>
    </ul>
    <p className="text-slate-400">
      各ステップでは、右側の<strong className="text-slate-200">「トルクの内訳」</strong>
      バーで P・I・D それぞれが今どれだけ働いているかを見られます。まずは「P制御」へ進みましょう。
    </p>
  </div>
)

export const STEPS: Step[] = [
  {
    kind: 'intro',
    id: 'intro',
    nav: 'はじめに',
    title: 'PID制御とは？',
    body: introBody,
  },
  {
    kind: 'lab',
    id: 'p',
    nav: 'P制御',
    title: 'P制御 — 誤差に比例して押す',
    lead: '比例ゲイン Kp だけで動かします。「目標との差」に比例したトルクをかける、最もシンプルな制御です。',
    active: { kp: true, ki: false, kd: false },
    defaults: { kp: 10, ki: 0, kd: 0 },
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-slate-300">
        <p>
          トルク指令は <span className="font-mono text-sky-200">u = Kp·e</span> だけ。誤差 e が大きいほど
          強く押し、目標に近づくほど弱くなります。
        </p>
        <p>
          Kp を上げると速く反応しますが、勢い余って<strong className="text-slate-100">行き過ぎ（オーバーシュート）</strong>
          、そのまま<strong className="text-slate-100">振動</strong>します。逆に小さいとゆっくりで弱々しい。
        </p>
        <p>
          さらに重要なのが、目標角度にぴったり止まらず
          <strong className="text-amber-300">わずかに手前で止まる</strong>こと。重力を支えるトルクを出すには
          誤差 e がゼロでは足りないからです。これを<strong className="text-amber-300">定常偏差</strong>と呼びます。
        </p>
      </div>
    ),
    tryThis: [
      'Kp を最小→最大まで動かし、速さと振動の変化を見る',
      'Kp を大きくしても目標線（黄破線）に届かないことを確認',
      '「外乱を加える」で小突き、戻り方を観察する',
    ],
    watchFor: [
      'グラフで青線が黄破線の少し下で止まる＝定常偏差',
      'Kp が大きいほど振動が激しくなる',
    ],
  },
  {
    kind: 'lab',
    id: 'pd',
    nav: 'PD制御',
    title: 'PD制御 — Dで振動を抑える',
    lead: 'P に微分項 Kd を加えます。動きの速さにブレーキをかけ、行き過ぎと振動を抑えます。',
    active: { kp: true, ki: false, kd: true },
    defaults: { kp: 16, ki: 0, kd: 2.5 },
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-slate-300">
        <p>
          D項は <span className="font-mono text-purple-200">Kd·de/dt</span>、つまり誤差が縮まる
          <strong className="text-slate-100">速さ</strong>に反応します。目標へ速く近づいているときほど強く
          ブレーキをかけ、行き過ぎを防ぎます。
        </p>
        <p>
          Dで振動が収まるので、P制御では振動して使えなかった
          <strong className="text-slate-100">大きな Kp</strong>が使えるようになり、より速く・安定して目標へ
          到達できます。
        </p>
        <p>
          ただし注意：PDでも<strong className="text-amber-300">定常偏差は残ったまま</strong>です。Dは「動いている
          とき」しか効かず、止まってしまえば de/dt = 0。重力を支える一定トルクは作れません。
        </p>
      </div>
    ),
    tryThis: [
      'Kd を 0 から上げ、振動がスッと収まるのを見る',
      'Kd を上げた状態で Kp も大きくし、速くて安定な応答を作る',
      'Kd を上げすぎると逆に鈍く（オーバーダンプ）なるのを確認',
    ],
    watchFor: [
      '振動は消えても、青線はまだ黄破線の手前で止まる',
      'Dバーは動いている間だけ働き、停止すると0になる',
    ],
  },
  {
    kind: 'lab',
    id: 'pid',
    nav: 'PID制御',
    title: 'PID制御 — Iで定常偏差を消す',
    lead: '最後に積分項 Ki を加えます。残った定常偏差を時間をかけて埋め、目標にぴったり合わせます。',
    active: { kp: true, ki: true, kd: true },
    defaults: { kp: 16, ki: 8, kd: 2.5 },
    antiWindup: true,
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-slate-300">
        <p>
          I項は <span className="font-mono text-emerald-200">Ki·∫e dt</span>。誤差が残っている限り
          <strong className="text-slate-100">少しずつ積み上がり</strong>、ついには重力を支えるだけのトルクを
          自分で作り出します。すると誤差はゼロへ。
        </p>
        <p>
          グラフで青線がゆっくり黄破線へ吸い付いていき、
          <strong className="text-emerald-300">定常偏差が消える</strong>様子を見てください。停止後も I バーだけが
          残って一定トルクを出し続けます。
        </p>
        <p>
          副作用もあります。Ki が大きすぎると積み上げすぎて
          <strong className="text-amber-300">再び行き過ぎ・振動</strong>します。また飽和が長引くと積分が膨らむ
          <strong className="text-amber-300">ワインドアップ</strong>が起きます。下のチェックでアンチワインドアップを
          切ると、その悪化を体感できます。
        </p>
      </div>
    ),
    tryThis: [
      'Ki を 0 から上げ、青線が黄破線へ吸い付くのを見る',
      '停止後にどのバーがトルクを出し続けているか確認（I項）',
      'アンチワインドアップを切り、大きな目標変更で挙動を比較',
    ],
    watchFor: [
      '時間が経つと定常偏差がほぼ0になる',
      'Ki が大きすぎると行き過ぎ・振動が出る',
    ],
  },
  {
    kind: 'lab',
    id: 'free',
    nav: '自由実験',
    title: '自由実験 — すべてのつまみ',
    lead: 'P・I・D をすべて自由に調整できます。目標変更や外乱に対し、速く・安定して・誤差なく追従する設定を探してみましょう。',
    active: { kp: true, ki: true, kd: true },
    defaults: { kp: 16, ki: 8, kd: 2.5 },
    antiWindup: true,
    body: (
      <div className="space-y-3 text-sm leading-relaxed text-slate-300">
        <p>
          良い制御とは、<strong className="text-slate-100">速さ（立ち上がり）</strong>・
          <strong className="text-slate-100">安定性（振動の少なさ）</strong>・
          <strong className="text-slate-100">正確さ（定常偏差ゼロ）</strong>のバランスです。三者はしばしば
          トレードオフの関係にあります。
        </p>
        <p>
          目標角度を動かしたり外乱を加えたりして、自分のチューニングがどれだけ素早く・きれいに
          追従するか試してみてください。
        </p>
      </div>
    ),
    tryThis: [
      'オーバーシュート0%かつ速い応答を目指す',
      '走行中に目標を変え、追従の速さを比べる',
      '外乱を連打しても安定し続ける設定を探す',
    ],
    watchFor: [
      '速さを上げると振動・行き過ぎが出やすい',
      'Iを強めると正確だが遅く・振動的になりがち',
    ],
  },
]

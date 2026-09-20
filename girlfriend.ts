import dotenv from 'dotenv'
import { choice, score, TypeSafeClient } from '@typesafe-ai/sdk'
import Table from 'tty-table'

dotenv.config({ quiet: true })

type GirlfriendConversation = {
  relationship: '目前交往中'
  message: string
  context: string
}

type GirlfriendSignal =
  | 'practical_request'
  | 'direct_feedback'
  | 'reassurance_or_connection'
  | 'coordination_or_expectation'
  | 'boundary_setting'
  | 'indirect_tension'
  | 'insufficient_context'

type RiskLevel = 'safe' | 'caution' | 'danger'
type ContraryWordingPattern =
  | 'literal_or_no_signal'
  | 'surface_acceptance'
  | 'surface_reassurance'
  | 'surface_distancing'
  | 'insufficient_context'
const contraryWordingExamples = `
以下是反話判斷的參考範例與可能含義。它們不是固定規則，只有訊息和脈絡共同支持時才能採用：
- 「去啊」：表面上允許對方出門，可能是在表達沒有被納入考量或期待被主動關心
- 「隨便你」或「你高興就好」：表面上把決定交給對方，可能是在表達挫折、不滿或想確認需求是否被重視
- 「不用陪我沒關係」：表面上降低需求，可能是在表達想被陪伴但不想直接要求
- 「沒事」或「我很好」：表面上表示一切正常，可能代表尚未準備好說明感受，而不是必然生氣
- 「算了」：表面上結束話題，可能是在表達溝通無效、失望或暫時不想繼續討論
- 「你想太多了」：可能是在拒絕或迴避當前話題，不必然等於對方承認或否認某件事
- 「那你先忙」、「不打擾你了」或「你慢慢來，我不急」：表面上體貼或不催促，可能是在表達等待、被忽略或期待落差
`

const [message, context = '沒有提供額外脈絡。'] = process.argv.slice(2)

if (message === undefined || message.trim() === '') {
  console.error('用法：npm run girlfriend -- "女友的訊息" "可選的前後文"')
  process.exitCode = 1
} else {
  const state: GirlfriendConversation = {
    relationship: '目前交往中',
    message,
    context,
  }

  const client = new TypeSafeClient()
  const response = await client.systemOne({
    state,
    questions: {
      girlfriend_signal: choice(
        '依據目前交往中伴侶的 `message` 與 `context`，這則訊息最主要呈現哪一種可觀察的溝通訊號？不要斷言對方的內心動機；若資訊不足或有多種同等合理解讀，選擇「資訊不足」。',
        {
          practical_request: '實際請求：明確詢問資訊、協助、安排、物品或其他可處理事項。',
          direct_feedback: '直接回饋：具體指出某件事造成不舒服、不滿、失望或需要調整。',
          reassurance_or_connection: '需要連結或支持：分享脆弱感受、需要陪伴、確認關係感受，或想得到關心。',
          coordination_or_expectation: '協調安排或期待：確認時間、行程、回覆節奏，或提醒先前約定。',
          boundary_setting: '設立界線：明確限制話題、互動方式、時間、見面或溝通管道。',
          indirect_tension: '間接緊張：可能有諷刺、疏離或試探，但沒有足夠直接資訊確認原因。',
          insufficient_context: '資訊不足：單靠現有訊息與脈絡，無法可靠區分以上型態。',
        },
      ),
      friction_level: score('只根據目前交往中伴侶的 `message` 與 `context`，評估這次回覆造成溝通摩擦的可能性；這不是對對方人格、憤怒程度或真正意圖的判決。', [
        '1 分：語氣平穩，或是單純確認、安排與請求；一般回覆不太會升高摩擦。',
        '3 分：有不滿、脆弱、諷刺、期待落差或模稜兩可訊號；回覆時應避免猜測動機或立即辯解。',
        '5 分：有明確衝突、強烈指責、辱罵、逼問或反覆忽略的界線；不當回覆很可能讓對話升高。',
      ]),
      girlfriend_mood_level: score('評估目前交往中伴侶在 `message` 裡表達出的情緒張力。這是文字與脈絡的觀察值，不是對真實內心、人格或動機的定論；Jev 對反話的評估可作為獨立參考。', [
        '1 分：語氣自然、平穩，沒有明顯不滿、受傷、焦慮或被忽略的訊號。',
        '3 分：可能有失望、委屈、期待落差、冷淡或需要被關心的訊號，但仍有其他合理解讀。',
        '5 分：明確表達強烈不滿、受傷、失望、怒氣或關係壓力，需要優先放慢回應並確認感受。',
      ]),
      contrary_wording_pattern: choice(
        `依據 \`message\` 與 \`context\`，這則訊息最可能呈現哪一種「字面意思可能與溝通意圖不同」的反話模式？只根據文字與已提供的脈絡判斷；不可把固定字詞視為證據，也不可斷言對方真正的內心動機。${contraryWordingExamples}`,
        {
          literal_or_no_signal: '字面一致或沒有反話訊號：文字內容與直接溝通一致，或看不出字面與可能意圖有落差。',
          surface_acceptance: '表面允許：看似同意、放行或把選擇交給對方，但脈絡可能顯示期待落差或不滿。',
          surface_reassurance: '表面沒事：看似表示沒有問題、不需要關心或一切良好，但脈絡可能顯示有未處理的感受。',
          surface_distancing: '表面體貼或抽離：看似催促對方先忙、降低需求或結束話題，但脈絡可能顯示疏離、等待或失望。',
          insufficient_context: '資訊不足：沒有足夠文字或脈絡判斷是否存在字面與可能意圖的落差。',
        },
      ),
      contrary_wording_level: score(`根據 \`message\` 與 \`context\`，評估字面意思與可能溝通意圖存在落差的可能性。反話只是可能性；沒有充分脈絡時必須維持低分或中間分，不得把短句或固定字詞直接視為反話。${contraryWordingExamples}`, [
        '1 分：字面意思大致明確，沒有足夠證據顯示隱含不同意思。',
        '3 分：可能有間接、不滿、抽離或期待落差訊號，但仍有同等合理的字面解讀。',
        '5 分：文字與脈絡共同顯示明顯的字面落差、諷刺或壓抑不滿；仍應以確認取代斷言。',
      ]),
      context_adequacy: score('現有 `message` 與 `context` 是否足以支持對目前交往中伴侶的對話建議？只評估已提供的資訊，不得自行補完對話歷史。', [
        '1 分：缺少事件、約定、時間或前後文，無法可靠解讀語氣。',
        '3 分：有部分脈絡，但仍存在多種合理解讀。',
        '5 分：訊息、具體事件與前後文都足夠，能提出有條件的溝通建議。',
      ]),
    },
  })

  const {
    context_adequacy,
    friction_level,
    girlfriend_mood_level,
    contrary_wording_level,
    contrary_wording_pattern,
    girlfriend_signal,
  } = response.answers

  const signalLabels: Record<GirlfriendSignal, string> = {
    practical_request: '實際請求',
    direct_feedback: '直接回饋',
    reassurance_or_connection: '需要連結或支持',
    coordination_or_expectation: '協調安排或期待',
    boundary_setting: '設立界線',
    indirect_tension: '間接緊張',
    insufficient_context: '資訊不足',
  }
  const contraryWordingLabels: Record<ContraryWordingPattern, string> = {
    literal_or_no_signal: '字面一致或沒有反話訊號',
    surface_acceptance: '表面允許',
    surface_reassurance: '表面沒事',
    surface_distancing: '表面體貼或抽離',
    insufficient_context: '資訊不足',
  }

  const riskColors: Record<RiskLevel, [string, string]> = {
    safe: ['bgGreen', 'white'],
    caution: ['bgYellow', 'black'],
    danger: ['bgRed', 'white'],
  }
  const contraryWordingScore = Math.round((contrary_wording_level.score / 2) * 30)
  const moodIndex = Math.min(100, Math.round((girlfriend_mood_level.score / 2) * 70 + contraryWordingScore))
  const moodRiskLevel: RiskLevel = moodIndex >= 70 ? 'danger' : moodIndex >= 35 ? 'caution' : 'safe'
  const contraryWordingRiskLevel: RiskLevel =
    contrary_wording_pattern.choice === 'insufficient_context' || contrary_wording_level.score >= 1 ? 'caution' : 'safe'
  const contraryWordingSummary = `${contraryWordingLabels[contrary_wording_pattern.choice]}（模型把握度 ${Math.round(contrary_wording_pattern.confidence * 100)}%）`


  const lacksContext = context_adequacy.score < 0.75 || girlfriend_signal.confidence < 0.5
  const riskLevel: RiskLevel = friction_level.score >= 1.25 ? 'danger' : friction_level.score >= 0.5 ? 'caution' : 'safe'

  const nextSteps: Record<GirlfriendSignal, string> = {
    practical_request: '先確認並處理具體請求；若做不到，直接說明限制與可行時間，不要失聯。',
    direct_feedback: '先承認對方指出的具體影響，再確認希望怎麼調整；不要用猜測動機取代回應事件。',
    reassurance_or_connection: '先確認自己是否有餘裕傾聽；可以關心與回應感受，但不要承諾超出自己界線的互動。',
    coordination_or_expectation: '確認具體時間、行程或回覆節奏；若原先約定無法做到，主動更新而非讓對方猜測。',
    boundary_setting: '尊重對方指定的互動範圍；不要用更多訊息要求對方立刻回應或改變決定。',
    indirect_tension: '不要急著自責或反擊。可用開放問題確認：「我感覺這件事可能讓你不舒服，想聽你怎麼看」',
    insufficient_context: '不要替對方下結論。補充前後文，或只用簡短開放問題確認是否有需要處理的事。',
  }
  const moodStep =
    '女友心情指數偏高：先確認具體發生什麼事與她的感受，參考 Jev 的反話評估，但不要直接辯解或替她定義動機。'

  const nextStep = lacksContext
    ? nextSteps.insufficient_context
    : moodIndex >= 60
      ? moodStep
      : nextSteps[girlfriend_signal.choice]

  const riskFormatter = function (
    this: { style: (value: string, ...effects: string[]) => string },
    value: string,
    _columnIndex: number,
    rowIndex: number,
    _rowData: unknown,
    inputData: { riskLevel?: RiskLevel }[],
  ) {
    const rowRiskLevel = inputData[rowIndex].riskLevel

    return rowRiskLevel === undefined ? value : this.style(value, ...riskColors[rowRiskLevel])
  }

  const scoreOutOfFive = (value: number) => `${(1 + value * 2).toFixed(1)}／5`
  const confidence = (value: number) => `${Math.round(value * 100)}%`

  const table = Table(
    [
      { value: 'item', alias: '項目' },
      { value: 'result', alias: '分析結果', formatter: riskFormatter },
    ],
    [
      {
        item: '主要溝通訊號',
        result: `${signalLabels[girlfriend_signal.choice]}（模型把握度 ${confidence(girlfriend_signal.confidence)}）`,
        riskLevel: girlfriend_signal.choice === 'insufficient_context' ? 'caution' : undefined,
      },
      {
        item: '女友心情指數',
        result: `${moodIndex}／100（語氣模型把握度 ${confidence(girlfriend_mood_level.confidence)}；Jev 反話評估 ${contraryWordingScore} 點）`,
        riskLevel: moodRiskLevel,
      },
      {
        item: '對話摩擦',
        result: `${scoreOutOfFive(friction_level.score)}（模型把握度 ${confidence(friction_level.confidence)}）`,
        riskLevel,
      },
      {
        item: 'Jev 反話評估',
        result: contraryWordingSummary,
        riskLevel: contraryWordingRiskLevel,
      },
      {
        item: '情境資訊完整度',
        result: `${scoreOutOfFive(context_adequacy.score)}（模型把握度 ${confidence(context_adequacy.confidence)}）`,
        riskLevel: lacksContext ? 'caution' : 'safe',
      },
      {
        item: '建議下一步',
        result: nextStep,
        riskLevel: lacksContext ? 'caution' : undefined,
      },
    ],
    {
      borderColor: 'cyan',
      borderStyle: 'solid',
      width: '100%',
    },
  )

  console.log()
  console.log('Jev 女友對話求生慾即時警報器')
  console.log()
  console.log(`訊息：「${state.message}」`)
  console.log(`脈絡：「${state.context}」`)
  console.log(table.render())
  console.log('\n提醒：這是根據文字與提供脈絡的機率判讀，不是對對方內心或人格的定論。')
}

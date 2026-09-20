import dotenv from 'dotenv'
import { choice, noul, score, TypeSafeClient } from '@typesafe-ai/sdk'
import Table from 'tty-table'

dotenv.config({ quiet: true })

type ExGirlfriendConversation = {
  relationship: '已結束交往關係'
  message: string
  context: string
}

type ExGirlfriendSignal =
  | 'practical_handover'
  | 'direct_feedback'
  | 'reconnection_or_support'
  | 'boundary_setting'
  | 'indirect_tension'
  | 'insufficient_context'

type RiskLevel = 'safe' | 'caution' | 'danger'

const [message, context = '沒有提供額外脈絡。'] = process.argv.slice(2)

if (message === undefined || message.trim() === '') {
  console.error('用法：npm run ex-girlfriend -- "前女友的訊息" "可選的前後文"')
  process.exitCode = 1
} else {
  const state: ExGirlfriendConversation = {
    relationship: '已結束交往關係',
    message,
    context,
  }

  const client = new TypeSafeClient()
  const response = await client.systemOne({
    state,
    questions: {
      ex_girlfriend_signal: choice(
        '依據已結束交往關係的對象所傳 `message` 與 `context`，這則訊息最主要呈現哪一種可觀察的溝通訊號？不要斷言對方的內心動機；若資訊不足或有多種同等合理解讀，選擇「資訊不足」。',
        {
          practical_handover: '實際交接或請求：明確詢問物品、帳務、共同責任、資訊、安排或其他可處理事項。',
          direct_feedback: '直接回饋：具體指出某件事造成不舒服、不滿、失望或需要處理。',
          reconnection_or_support: '重新連結或支持：分享共同回憶、近況、脆弱感受，或尋求聊天與陪伴，但沒有明確提出復合。',
          boundary_setting: '設立界線：明確限制聯絡頻率、管道、話題、見面或其他互動方式。',
          indirect_tension: '間接緊張：可能有諷刺、疏離或試探，但沒有足夠直接資訊確認原因。',
          insufficient_context: '資訊不足：單靠現有訊息與脈絡，無法可靠區分以上型態。',
        },
      ),
      friction_level: score('只根據已結束交往關係的對象所傳 `message` 與 `context`，評估這次回覆造成溝通摩擦的可能性；這不是對對方人格、憤怒程度或真正意圖的判決。', [
        '1 分：語氣平穩，或是單純確認與交接；一般回覆不太會升高摩擦。',
        '3 分：有不滿、脆弱、諷刺、共同歷史或模稜兩可訊號；回覆時應避免猜測動機或立即辯解。',
        '5 分：有明確衝突、強烈指責、辱罵、逼問或反覆忽略的界線；不當回覆很可能讓對話升高。',
      ]),
      context_adequacy: score('現有 `message` 與 `context` 是否足以支持已結束交往關係的對話建議？只評估已提供的資訊，不得自行補完對話歷史。', [
        '1 分：缺少分手後約定、具體事件或前後文，無法可靠解讀語氣。',
        '3 分：有部分脈絡，但仍存在多種合理解讀。',
        '5 分：訊息、具體事件與前後文都足夠，能提出有條件的溝通建議。',
      ]),
      clear_boundary: noul(
        '這則訊息是否明確要求停止、限制或改變聯絡、見面、話題或溝通管道？只有具體清楚的要求才算，單純冷淡或簡短不算。',
      ),
      safety_or_harassment_boundary: noul(
        '這則訊息是否涉及人身安全、明確拒絕不受歡迎的接觸、騷擾、跟蹤、脅迫，或可能需要優先處理安全的威脅？一般爭執或不滿不算。',
      ),
    },
  })

  const {
    clear_boundary,
    context_adequacy,
    ex_girlfriend_signal,
    friction_level,
    safety_or_harassment_boundary,
  } = response.answers

  const signalLabels: Record<ExGirlfriendSignal, string> = {
    practical_handover: '實際交接或請求',
    direct_feedback: '直接回饋',
    reconnection_or_support: '重新連結或支持',
    boundary_setting: '設立界線',
    indirect_tension: '間接緊張',
    insufficient_context: '資訊不足',
  }

  const riskColors: Record<RiskLevel, [string, string]> = {
    safe: ['bgGreen', 'white'],
    caution: ['bgYellow', 'black'],
    danger: ['bgRed', 'white'],
  }

  const hasSafetyBoundary = safety_or_harassment_boundary.noul >= 0.6
  const hasClearBoundary = clear_boundary.noul >= 0.6
  const lacksContext = context_adequacy.score < 0.75 || ex_girlfriend_signal.confidence < 0.5
  const riskLevel: RiskLevel = hasSafetyBoundary || friction_level.score >= 1.25 ? 'danger' : friction_level.score >= 0.5 || hasClearBoundary ? 'caution' : 'safe'

  const nextSteps: Record<ExGirlfriendSignal, string> = {
    practical_handover: '先處理明確交接或確認細節；不想協助時，直接而禮貌地說明自己的界線。',
    direct_feedback: '先回應對方指出的具體影響，再確認是否需要完成交接或收尾；不要用猜測動機取代回應事件。',
    reconnection_or_support: '先確認自己是否願意恢復這類互動；可以關心，但不要承諾超出自己界線的聯絡或關係。',
    boundary_setting: '尊重對方指定的聯絡方式、時間或範圍；不要用更多訊息要求對方立即回應。',
    indirect_tension: '不要急著自責或反擊。可用開放問題確認：「我感覺這件事可能讓你不舒服，想聽你怎麼看」',
    insufficient_context: '不要替對方下結論。補充前後文，或只用簡短開放問題確認是否有需要處理的事。',
  }

  const nextStep = hasSafetyBoundary
    ? '優先停止所有非必要接觸，遵守明確要求；若有立即危險，尋求當地緊急服務或可信任支援。'
    : hasClearBoundary
      ? nextSteps.boundary_setting
      : lacksContext
        ? nextSteps.insufficient_context
        : nextSteps[ex_girlfriend_signal.choice]

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
  const probability = (value: number) => `${Math.round(value * 100)}%`

  const table = Table(
    [
      { value: 'item', alias: '項目' },
      { value: 'result', alias: '分析結果', formatter: riskFormatter },
    ],
    [
      {
        item: '主要溝通訊號',
        result: `${signalLabels[ex_girlfriend_signal.choice]}（模型把握度 ${confidence(ex_girlfriend_signal.confidence)}）`,
        riskLevel: ex_girlfriend_signal.choice === 'insufficient_context' ? 'caution' : undefined,
      },
      {
        item: '對話摩擦',
        result: `${scoreOutOfFive(friction_level.score)}（模型把握度 ${confidence(friction_level.confidence)}）`,
        riskLevel,
      },
      {
        item: '情境資訊完整度',
        result: `${scoreOutOfFive(context_adequacy.score)}（模型把握度 ${confidence(context_adequacy.confidence)}）`,
        riskLevel: lacksContext ? 'caution' : 'safe',
      },
      {
        item: '明確界線訊號',
        result: probability(clear_boundary.noul),
        riskLevel: hasClearBoundary ? 'caution' : 'safe',
      },
      {
        item: '安全或騷擾界線',
        result: probability(safety_or_harassment_boundary.noul),
        riskLevel: hasSafetyBoundary ? 'danger' : 'safe',
      },
      {
        item: '建議下一步',
        result: nextStep,
        riskLevel: hasSafetyBoundary ? 'danger' : hasClearBoundary || lacksContext ? 'caution' : undefined,
      },
    ],
    {
      borderColor: 'cyan',
      borderStyle: 'solid',
      width: '100%',
    },
  )

  console.log()
  console.log('Jev 前女友對話求生慾即時警報器')
  console.log()
  console.log(`訊息：「${state.message}」`)
  console.log(`脈絡：「${state.context}」`)
  console.log(table.render())
  console.log('\n提醒：這是根據文字與提供脈絡的機率判讀，不是對對方內心或人格的定論。')
}

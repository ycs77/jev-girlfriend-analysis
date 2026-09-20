import dotenv from 'dotenv'
import { choice, score, TypeSafeClient } from '@typesafe-ai/sdk'

dotenv.config({ quiet: true })

type GirlfriendConversation = {
  relationship: '目前交往中'
  message: string
  context: string
}

type GirlfriendSituation =
  | 'practical_request'
  | 'unmet_expectation'
  | 'needs_listening'
  | 'direct_conflict'
  | 'needs_space'
  | 'unclear'

type InterpersonalSignal =
  | 'surface_permission'
  | 'surface_reassurance'
  | 'surface_consideration'
  | 'direct_discontent'
  | 'none_or_unsupported'

type ReplyFocus =
  | 'acknowledge_impact'
  | 'offer_presence'
  | 'give_a_specific_update'
  | 'clarify_gently'
  | 'respect_space'

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
      situation: choice(
        '依據目前交往中伴侶的 `message` 與 `context`，選出最能決定下一步回覆方式的情境。只根據文字與提供脈絡，不得斷言對方真正的內心動機。沒有足夠資訊時選擇「資訊不足」。',
        {
          practical_request: '具體請求：明確詢問資訊、協助、安排、物品或其他可處理事項。',
          unmet_expectation: '約定落空或期待落差：提到等待、未回覆、延後、忘記約定，或沒有被事先告知。',
          needs_listening: '想被傾聽或支持：分享壓力、脆弱感受或近況，沒有明確要求解決問題。',
          direct_conflict: '直接衝突：明確表達不滿、生氣、失望、責備、辱罵或逼問。',
          needs_space: '想暫停或設界線：明確表示現在不想談、需要時間，或限制互動方式。',
          unclear: '資訊不足：單靠現有訊息與脈絡，無法可靠區分以上情境。',
        },
      ),
      interpersonal_signal: choice(
        '依據 `message` 與 `context`，判讀這則訊息呈現的溝通訊號。字面看似允許、沒事或體貼，只有在前後文同時支持期待落差時，才可判為有落差；不可將固定字詞、單一標點或短句直接當成不滿證據。驚嘆號、問號、訊息長度與簡短回覆都只能當輔助線索，必須結合語意與脈絡。',
        {
          surface_permission: '表面放行：看似同意對方去做某事或說「隨意」，但脈絡顯示比較在意陪伴、被商量或共同決定。',
          surface_reassurance: '表面沒事：看似說沒關係、算了或自己很好，但脈絡顯示仍有未處理的事件、期待或受傷感。',
          surface_consideration: '表面體貼：看似催對方先忙、慢慢來或不打擾，但脈絡顯示可能在意被延後、忽略或沒有主動更新。',
          direct_discontent: '直接不滿：文字本身明確表達生氣、失望、責備、質問或受傷，不需要從反話推論。',
          none_or_unsupported: '沒有足夠證據：訊息與脈絡不支持上述溝通訊號，或仍有多種合理解讀。',
        },
      ),
      mood_level: score(
        '評估目前交往中伴侶在 `message` 裡表達出的情緒張力。這是根據文字與脈絡的可能狀態，不是對真實內心、人格或動機的定論。請綜合具體事件、期待落差、用字、標點與訊息長度；後三者只能輔助，不能取代脈絡。短句、單一標點或「好」「沒事」「隨便你」等文字，沒有脈絡時不可直接當成生氣。',
        [
          '1 分：看起來平穩；是單純確認、請求、安排，或沒有明顯不舒服訊號。',
          '2 分：有些微情緒線索，但資訊不足或仍有合理的中性解讀。',
          '3 分：可能有點在意、不舒服、失望、委屈、期待落差或需要被關心。',
          '4 分：明顯不舒服、失望、被忽略或關係緊繃，宜先處理具體事件與感受。',
          '5 分：明確表達強烈不滿、生氣、受傷、責備、辱罵、逼問或高度關係壓力。',
        ],
      ),
      reply_focus: choice(
        '根據 `message` 與 `context`，選出現在最適合的單一回覆方向。此判斷是降低誤會的溝通建議，不得假設對方真正的內心或要求使用者迎合。',
        {
          acknowledge_impact: '先承認具體事件、延誤或失約造成的影響，再提出可做到的補救。',
          offer_presence: '先確認她現在比較需要陪伴、傾聽，或一起想辦法；不要直接替她決定。',
          give_a_specific_update: '清楚說明目前限制與可做到的具體時間，避免只回「好」或讓對方繼續等。',
          clarify_gently: '用一個不預設她生氣的具體問題確認在意事項，不要把字面話直接當最終結論。',
          respect_space: '尊重她想暫停或限制互動的要求，不要連續傳訊息要求立刻回覆。',
        },
      ),
      context_adequacy: score(
        '現有 `message` 與 `context` 是否足以可靠判讀目前交往中伴侶的情緒張力與回覆方向？只評估已提供的資訊，不得自行補完對話歷史。',
        [
          '1 分：缺少事件、約定、時間或前後文，且文字本身沒有明確情緒或請求。',
          '3 分：有部分脈絡，但仍存在多種合理解讀。',
          '5 分：訊息、具體事件與前後文都足夠，能提出有條件的回覆建議。',
        ],
      ),
    },
  })

  const { context_adequacy, interpersonal_signal, mood_level, reply_focus, situation } = response.answers
  const lacksContext = context_adequacy.score < 0.5 && situation.choice === 'unclear'
  const hasReliableSignal = !lacksContext
    && interpersonal_signal.choice !== 'none_or_unsupported'
    && interpersonal_signal.confidence >= 0.6
  const hasReliableReplyFocus = !lacksContext && reply_focus.confidence >= 0.6
  const moodIndex = Math.round((mood_level.score / 4) * 100)
  const moodSummary = lacksContext
    ? '無法可靠判讀'
    : moodIndex >= 75
      ? '可能明顯生氣或高度不舒服'
      : moodIndex >= 50
        ? '可能不舒服、失望或關係緊繃'
        : moodIndex >= 25
          ? '可能有點在意或有感觸'
          : '看起來平穩'

  const situationSteps: Record<GirlfriendSituation, string> = {
    practical_request: '先直接回答能不能處理這件事；做不到時，說明限制與你能做到的時間。',
    unmet_expectation: '先承認沒有做到原本的約定或沒有主動更新，再給一個你確定做得到的新時間。',
    needs_listening: '先問她想要你傾聽，還是一起想辦法；先回應感受，不要急著說教。',
    direct_conflict: '先回應她指出的具體事件與造成的影響；不要立刻辯解、反擊或翻舊帳。',
    needs_space: '尊重她想暫停或限制互動的要求；不要連續傳訊息要求她立刻回覆。',
    unclear: '這句話不足以判斷她的心情。若有待處理的事，只問一個具體問題；否則先不要追問她是不是生氣。',
  }
  const replySteps: Record<ReplyFocus, string> = {
    acknowledge_impact: '先承認具體事件、延誤或失約造成的影響，再給一個你確定做得到的補救或新時間。',
    offer_presence: '先問她現在比較想被傾聽、陪伴，還是一起想辦法；先回應感受，不要急著說教。',
    give_a_specific_update: '說清楚你目前的限制與能回覆或完成的具體時間；不要只回「好」讓她繼續等。',
    clarify_gently: '先不要照字面直接決定；可問「我想確認你現在比較在意的是哪一部分？」',
    respect_space: '尊重她想暫停或限制互動的要求；不要連續傳訊息要求她立刻回覆。',
  }
  const signalDescriptions: Record<Exclude<InterpersonalSignal, 'none_or_unsupported'>, string> = {
    surface_permission: '可能表面放行，但脈絡顯示更在意陪伴、被商量或共同決定。',
    surface_reassurance: '可能表面說沒事，但脈絡顯示仍有未處理的期待或感受。',
    surface_consideration: '可能表面體貼，但脈絡顯示在意被延後、忽略或沒有主動更新。',
    direct_discontent: '文字直接表達了不滿、受傷或關係壓力。',
  }

  const nextStep = situation.choice === 'needs_space'
    ? situationSteps.needs_space
    : hasReliableReplyFocus
      ? replySteps[reply_focus.choice]
      : situationSteps[situation.choice]
  const diagnosis = lacksContext
    ? '資訊不足，沒有把短句、標點或固定字詞當成情緒結論。'
    : hasReliableSignal
      ? signalDescriptions[interpersonal_signal.choice]
      : '沒有足夠證據判定反話或明確不滿；建議以具體事件和問題回應。'

  console.log()
  console.log('Jev 女友對話求生慾即時警報器')
  console.log()
  console.log(`女友心情指數：${lacksContext ? '無法可靠判讀' : `${moodIndex}／100`}｜${moodSummary}`)
  console.log()
  console.log(`Jev 判讀：${diagnosis}`)
  console.log()
  console.log(`建議行動事項：${nextStep}`)
}

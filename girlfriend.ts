import dotenv from 'dotenv'
import { choice, noul, score, TypeSafeClient } from '@typesafe-ai/sdk'

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
      contrary_wording: noul(
        '依據 `message` 與 `context`，這則訊息是否可能出現字面意思與實際在意事項不一致的情況？只有文字與脈絡共同支持時才判為是，例如表面允許、表面沒事或表面體貼，但脈絡顯示期待落差。不可把固定字詞當證據；只有短句或缺少脈絡時，判為否。',
      ),
      mood_level: score('評估目前交往中伴侶在 `message` 裡表達出的情緒張力。這是根據文字與脈絡的可能狀態，不是對真實內心、人格或動機的定論。短句、單一標點或「好」「沒事」「隨便你」等文字，沒有脈絡時不可直接當成生氣。', [
        '1 分：看起來平穩；是單純確認、請求、安排，或沒有明顯不舒服訊號。',
        '3 分：可能有點在意、不舒服、失望、委屈、期待落差或需要被關心，但仍有其他合理解讀。',
        '5 分：明確表達強烈不滿、生氣、受傷、失望、責備、辱罵或高度關係壓力。',
      ]),
      context_adequacy: score('現有 `message` 與 `context` 是否足以可靠判讀目前交往中伴侶的情緒張力與回覆方向？只評估已提供的資訊，不得自行補完對話歷史。', [
        '1 分：缺少事件、約定、時間或前後文，且文字本身沒有明確情緒或請求。',
        '3 分：有部分脈絡，但仍存在多種合理解讀。',
        '5 分：訊息、具體事件與前後文都足夠，能提出有條件的回覆建議。',
      ]),
    },
  })

  const { context_adequacy, contrary_wording, mood_level, situation } = response.answers
  const lacksContext = context_adequacy.score < 0.5 && situation.choice === 'unclear'
  const hasContraryWording = !lacksContext && contrary_wording.noul >= 0.6
  const baseMoodIndex = Math.round((mood_level.score / 2) * 100)
  const contraryWordingBoost = hasContraryWording ? Math.round(contrary_wording.noul * 20) : 0
  const moodIndex = Math.min(100, baseMoodIndex + contraryWordingBoost)
  const moodSummary = lacksContext
    ? '無法可靠判讀'
    : moodIndex >= 75
      ? '可能明顯生氣或高度不舒服'
      : moodIndex >= 50
        ? '可能不舒服、失望或關係緊繃'
        : moodIndex >= 25
          ? '可能有點在意或有感觸'
          : '看起來平穩'

  const nextSteps: Record<GirlfriendSituation, string> = {
    practical_request: '先直接回答能不能處理這件事；做不到時，說明限制與你能做到的時間。',
    unmet_expectation: '先承認沒有做到原本的約定或沒有主動更新，再給一個你確定做得到的新時間。',
    needs_listening: '先問她想要你傾聽，還是一起想辦法；先回應感受，不要急著說教。',
    direct_conflict: '先回應她指出的具體事件與造成的影響；不要立刻辯解、反擊或翻舊帳。',
    needs_space: '尊重她想暫停或限制互動的要求；不要連續傳訊息要求她立刻回覆。',
    unclear: '這句話不足以判斷她的心情。若有待處理的事，只問一個具體問題；否則先不要追問她是不是生氣。',
  }

  const nextStep = hasContraryWording && situation.choice !== 'needs_space'
    ? '這句可能有字面與在意事項的落差。先不要照字面直接決定；可回「我想確認你比較在意的是哪一部分？」'
    : nextSteps[situation.choice]

  console.log()
  console.log('Jev 女友對話求生慾即時警報器')
  console.log()
  console.log(`女友心情指數：${lacksContext ? '無法可靠判讀' : `${moodIndex}／100`}｜${moodSummary}`)
  console.log()
  console.log(`建議行動事項：${nextStep}`)
}

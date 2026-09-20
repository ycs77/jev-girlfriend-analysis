import dotenv from 'dotenv'
import { choice, noul, score, TypeSafeClient } from '@typesafe-ai/sdk'

dotenv.config({ quiet: true })

type ExGirlfriendConversation = {
  relationship: '已結束交往關係'
  message: string
  context: string
}

type ExGirlfriendSituation =
  | 'practical_handover'
  | 'clear_boundary'
  | 'direct_conflict'
  | 'optional_contact'
  | 'no_action_requested'
  | 'unclear'

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
      situation: choice(
        '依據已結束交往關係的對象所傳 `message` 與 `context`，選出最能決定回覆範圍的情境。只根據文字與提供脈絡，不得斷言對方真正的內心動機，也不可把共同回憶或近況分享視為復合邀請。沒有足夠資訊時選擇「資訊不足」。',
        {
          practical_handover: '實際交接或請求：明確詢問物品、帳務、共同責任、資訊、安排或其他可處理事項。',
          clear_boundary: '明確界線：具體限制聯絡頻率、管道、話題、見面或其他互動方式。',
          direct_conflict: '直接衝突：明確表達不滿、生氣、失望、責備、辱罵或逼問。',
          optional_contact: '可選的互動：分享共同回憶、近況、脆弱感受或想聊天，但沒有明確要求復合或見面。',
          no_action_requested: '沒有明確待辦：只有簡短回應、資訊陳述或無須處理的內容。',
          unclear: '資訊不足：單靠現有訊息與脈絡，無法可靠區分以上情境。',
        },
      ),
      mood_level: score('評估已結束交往關係的對象在 `message` 裡表達出的情緒張力。這是根據文字與脈絡的可能狀態，不是對真實內心、人格、是否想復合或動機的定論。短句、單一標點或「好」「沒事」「隨便你」等文字，沒有脈絡時不可直接當成生氣。', [
        '1 分：看起來平穩；是單純確認、交接、請求或沒有明顯不舒服訊號。',
        '3 分：可能有點在意、有感觸、不舒服、失望或關係距離感，但仍有其他合理解讀。',
        '5 分：明確表達強烈不滿、生氣、受傷、失望、責備、辱罵或高度衝突。',
      ]),
      context_adequacy: score('現有 `message` 與 `context` 是否足以可靠判讀已結束交往關係的對象的情緒張力與回覆範圍？只評估已提供的資訊，不得自行補完對話歷史。', [
        '1 分：缺少分手後約定、具體事件或前後文，且文字本身沒有明確情緒、請求或界線。',
        '3 分：有部分脈絡，但仍存在多種合理解讀。',
        '5 分：訊息、具體事件與前後文都足夠，能提出有條件的回覆建議。',
      ]),
      clear_boundary: noul(
        '這則訊息是否明確要求停止、限制或改變聯絡、見面、話題或溝通管道？只有具體清楚的要求才算，單純冷淡或簡短不算。',
      ),
      safety_or_harassment_boundary: noul(
        '這則訊息是否涉及人身安全、明確拒絕不受歡迎的接觸、騷擾、跟蹤、脅迫，或可能需要優先處理安全的威脅？一般爭執或不滿不算。',
      ),
    },
  })

  const { clear_boundary, context_adequacy, mood_level, safety_or_harassment_boundary, situation } = response.answers
  const hasSafetyBoundary = safety_or_harassment_boundary.noul >= 0.6
  const hasClearBoundary = clear_boundary.noul >= 0.6
  const lacksContext = context_adequacy.score < 0.5 && situation.choice === 'unclear'
  const moodIndex = Math.round((mood_level.score / 2) * 100)
  const moodSummary = hasSafetyBoundary || lacksContext
    ? '無法可靠判讀'
    : moodIndex >= 75
      ? '可能明顯生氣或高度不舒服'
      : moodIndex >= 50
        ? '可能不舒服、失望或關係緊繃'
        : moodIndex >= 25
          ? '可能有點在意或有感觸'
          : '看起來平穩'

  const nextSteps: Record<ExGirlfriendSituation, string> = {
    practical_handover: '只確認需要處理的事項、時間與聯絡方式；不要藉交接延伸聊近況或感情。',
    clear_boundary: '尊重她指定的聯絡方式與範圍；只在必要時處理明確事項，不要追加訊息要求回覆。',
    direct_conflict: '只回應具體事件，先不要辯解或反擊；若沒有必要待辦，可以先暫停回覆。',
    optional_contact: '是否回覆由你決定；想回可簡短回應，但不要把這句當成復合或見面的邀請。',
    no_action_requested: '這句沒有明確需要處理的事；你不需要主動把對話延伸成近況或感情討論。',
    unclear: '這句話不足以判斷她的心情。若有實際待辦，只問一個具體問題；沒有待辦就先不要主動延伸聯絡。',
  }
  const nextStep = hasSafetyBoundary
    ? '停止所有非必要接觸並遵守明確要求；若有立即危險，請聯絡當地緊急服務或可信任支援。'
    : hasClearBoundary
      ? nextSteps.clear_boundary
      : nextSteps[situation.choice]

  console.log()
  console.log('Jev 前女友對話求生慾即時警報器')
  console.log()
  console.log(`前女友心情指數：${hasSafetyBoundary || lacksContext ? '無法可靠判讀' : `${moodIndex}／100`}｜${moodSummary}`)
  console.log()
  console.log(`建議行動事項：${nextStep}`)
}

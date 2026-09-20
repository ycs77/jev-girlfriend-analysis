import { choice, noul, score, TypeSafeClient } from '@typesafe-ai/sdk'
import { renderReport, type ActionPlan } from './output.ts'

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

type ExGirlfriendLandmine =
  | 'reopen_intimacy'
  | 'force_intent'
  | 'argue_or_boast'
  | 'overextend_help'
  | 'cross_boundary'
  | 'none'

interface AnalysisOptions {
  apiKey?: string
}

export async function runExGirlfriendAnalysis(message: string, context = '沒有提供額外脈絡。', options?: AnalysisOptions): Promise<void> {
  const state: ExGirlfriendConversation = {
    relationship: '已結束交往關係',
    message,
    context,
  }

  const client = new TypeSafeClient({
    apiKey: options?.apiKey,
  })
  const response = await client.systemOne({
    state,
    questions: {
      situation: choice(
        '依據已結束交往關係的對象所傳 `message` 與 `context`，選出最能決定回覆範圍的情境。只根據文字與提供脈絡，不得斷言對方真正的內心動機。互動模式比單句話重要——持續主動、主動提問、願意面對分手原因才算試探訊號；共同回憶、近況、深夜情緒或單一訊號（如主動提分手原因）都不可直接視為復合邀請。沒有足夠資訊時選擇「資訊不足」。',
        {
          practical_handover: '實際交接或請求：明確詢問物品、帳務、共同責任、資訊、安排或其他可處理事項。',
          clear_boundary: '明確界線：具體限制聯絡頻率、管道、話題、見面或其他互動方式。',
          direct_conflict: '直接衝突：明確表達不滿、生氣、失望、責備、辱罵或逼問。',
          optional_contact: '可選的互動：分享共同回憶、近況、脆弱感受或想聊天，但沒有明確要求復合或見面。',
          no_action_requested: '沒有明確待辦：只有簡短回應、資訊陳述或無須處理的內容。',
          unclear: '資訊不足：單靠現有訊息與脈絡，無法可靠區分以上情境。',
        },
      ),
      mood_level: score(
        '評估已結束交往關係的對象在 `message` 裡表達出的情緒張力。這是根據文字與脈絡的可能狀態，不是對真實內心、人格、是否想復合或動機的定論。短句、單一標點或「好」「沒事」「隨便你」等文字，沒有脈絡時不可直接當成生氣。',
        [
          '1 分：看起來平穩；是單純確認、交接、請求或沒有明顯不舒服訊號。',
          '3 分：可能有點在意、有感觸、不舒服、失望或關係距離感，但仍有其他合理解讀。',
          '5 分：明確表達強烈不滿、生氣、受傷、失望、責備、辱罵或高度衝突。',
        ],
      ),
      landmine: choice(
        '依據 `message` 與 `context`，選出回覆這則前女友訊息時最容易踩到的地雷：不能說的話、不能做的事。用常見台詞當錨點判斷：提到共同回憶（如「今天經過那間麵店，還是會想到以前」）或深夜情緒（如「如果那時候我們都沒有那麼脾氣硬」）的地雷是開啟曖昧或長篇回憶；低風險試探開場（如「最近好嗎？」）的地雷是逼問意圖或長篇傾訴；直接試探（如「你現在有對象了嗎？」「我們現在還是朋友吧？」「我還留著你送我那個 xxx」「有點想你了」）的地雷是順勢回溫、回「我也是」或模糊帶過；深夜想念（如「我最近常常夢到你」「睡不著，想到以前的事」）的地雷是半夜深聊感情；帶刺比較（如「看來沒有我之後，你過得越來越順遂了嘛～」）的地雷是回嗆或辯解；求助或資源訊息（如電腦壞了、Netflix 帳號）的地雷是幫過頭或冷嘲；交接與界線訊息（如物品交接、指定聯絡管道、要求不要再到公司等她）的地雷是跨管道寒暄或爭辯界線。沒有明顯地雷時選「無」。',
        {
          reopen_intimacy: '開啟曖昧：回「我也很想你」、半夜深談感情、長篇回憶過去、順勢約見面。',
          force_intent: '逼問意圖：一開始就問「你是不是想復合」，或長篇傾訴近況、過度暴露期待。',
          argue_or_boast: '回嗆或辯解：反擊、酸回去，或急著證明自己過得好不好。',
          overextend_help: '幫過頭：不好意思拒絕而無限上綱協助，或幫了又酸她。',
          cross_boundary: '跨界：藉交接寒暄近況、跨管道關心，或覺得被針對而爭辯界線。',
          none: '無明顯地雷：訊息單純，沒有特別需要避開的回覆方式。',
        },
      ),
      context_adequacy: score(
        '現有 `message` 與 `context` 是否足以可靠判讀已結束交往關係的對象的情緒張力與回覆範圍？只評估已提供的資訊，不得自行補完對話歷史。',
        [
          '1 分：缺少分手後約定、具體事件或前後文，且文字本身沒有明確情緒、請求或界線。',
          '3 分：有部分脈絡，但仍存在多種合理解讀。',
          '5 分：訊息、具體事件與前後文都足夠，能提出有條件的回覆建議。',
        ],
      ),
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
    landmine,
    mood_level,
    safety_or_harassment_boundary,
    situation,
  } = response.answers
  const hasSafetyBoundary = safety_or_harassment_boundary.noul >= 0.6
  const hasClearBoundary = clear_boundary.noul >= 0.6
  const lacksContext = context_adequacy.score < 0.5 && situation.choice === 'unclear'
  const hasReliableLandmine = !lacksContext
    && landmine.choice !== 'none'
    && landmine.confidence >= 0.5
  const moodIndex = Math.round((mood_level.score / 2) * 100)

  const nextSteps: Record<ExGirlfriendSituation, ActionPlan> = {
    practical_handover: {
      direction: '就事論事，確認時間與地點後照辦；不要藉交接延伸聊近況或感情。',
      phrasing: '「好，我（時間）去領，謝謝你幫我處理。」',
    },
    clear_boundary: {
      direction: '證明你聽得懂：照她指定的管道與範圍聯絡，其他不再傳。',
      phrasing: '「好，之後都照你說的方式聯絡，其他不再傳訊息給你。」',
    },
    direct_conflict: {
      direction: '只回應具體事件，先不要辯解或反擊；若沒有必要待辦，可以先暫停回覆。',
      phrasing: '「這件事我會處理好，其他先不談。」',
    },
    optional_contact: {
      direction: '自然簡短回，觀察她後續是否持續主動；不要把這句當成復合或見面的邀請。她分享脆弱或複雜感受時，不評論雙方狀態，直接問她需要的是什麼。',
      phrasing: '「還不錯，最近比較忙。你呢？」',
    },
    no_action_requested: {
      direction: '這句沒有明確需要處理的事；你不需要主動把對話延伸成近況或感情討論。',
    },
    unclear: {
      direction: '這句話不足以判斷她的心情。若有實際待辦，只問一個具體問題；沒有待辦就先不要主動延伸聯絡。',
      phrasing: '「你是指（具體事項）嗎？」',
    },
  }
  const landmineItems: Record<ExGirlfriendLandmine, string[]> = {
    reopen_intimacy: [
      '回「我也很想你」、半夜深談感情',
      '長篇回憶過去、順勢約見面',
    ],
    force_intent: [
      '一開始就問「你是不是想復合」',
      '長篇傾訴近況、過度暴露期待',
    ],
    argue_or_boast: [
      '回嗆、酸回去',
      '辯解自己過得好不好',
    ],
    overextend_help: [
      '不好意思拒絕而無限上綱幫忙',
      '幫了又酸她',
    ],
    cross_boundary: [
      '藉交接寒暄近況、跨管道關心',
      '覺得被針對而爭辯界線',
    ],
    none: [],
  }

  const action: ActionPlan = hasSafetyBoundary
    ? {
        direction: '停止所有非必要接觸並遵守明確要求；若有立即危險，請聯絡當地緊急服務或可信任支援。',
      }
    : hasClearBoundary
      ? nextSteps.clear_boundary
      : nextSteps[situation.choice]
  const landmines = hasSafetyBoundary
    ? ['任何辯解、道歉式糾纏、再接觸']
    : lacksContext
      ? ['自行腦補她的心情或意圖']
      : hasReliableLandmine
        ? landmineItems[landmine.choice]
        : landmineItems.none

  renderReport({
    title: '前任翻譯器',
    message,
    context,
    mood: hasSafetyBoundary || lacksContext
      ? { kind: 'unreadable' }
      : { kind: 'score', index: moodIndex },
    action,
    landmines,
  })
}

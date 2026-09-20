import dotenv from 'dotenv'
import { choice, noul, score, TypeSafeClient } from '@typesafe-ai/sdk'
import Table from 'tty-table'

dotenv.config({ quiet: true })

// const state = {
//   message: '[週五深夜 11:30] 在忙嗎？看你最近過得挺精彩的嘛～',
//   context: '你一小時前剛在 Instagram 發了跟異性朋友聚會的限時動態。',
// }

// 1. 興師問罪型
// const state = '聽說你最近換新工作/搬新家了？看來沒有我之後，你過得越來越順遂了嘛～'
// const state = '昨天在東區看到一個很像你的人，旁邊牽著一個女生，應該不是你吧？'
// const state = '剛剛整理房間，看到你以前送我的項鍊。既然分手了，這垃圾我直接丟囉？'
// const state = '你把 Netflix 密碼改掉了喔？我都不能看了'
// const state = '按讚那個網美，是你的新菜喔？眼光變得很特別呢～'

// 2. 測試新對象與試探型
// const state = '最近有什麼好看的電影嗎？朋友叫我推薦，但我不知道現在流行什麼'
// const state = '今天經過我們以前常去的那家火鍋店，發現它倒閉了，突然有點感觸'
// const state = '下個月周杰倫演唱會，你應該買到票了吧？（以前說好要一起去的）'
// const state = '你最近是不是變瘦/變帥了？朋友在脆（Threads）上看到你發的照片，說你變很多'
// const state = '希望你現在的另一半能比我更懂你的脾氣'

// 3. 工具人招喚型
// const state = '我電腦突然開不起來，裡面有明天要交的報告，你可以幫我遠端看一下嗎？真的很急...'
// const state = '下週我要搬家，東西有點多，我找不到人幫忙開車，你可以借我一塊載嗎？'
// const state = '以前你幫我保的那張保單過期了，現在要怎麼續約啊？我看不懂業務傳的訊息'
// const state = '貓咪最近好像有點不舒服，都不太吃飯，牠是不是想你了？'
// const state = '這家餐廳你以前不是有熟識的店員可以訂位嗎？這禮拜六可以幫我訂四個人嗎？'

// 4. 深夜孤單寂寞型
// const state = '突然想到我們以前在海邊淋雨的那晚，那時候的我們真的好傻喔...'
// const state = '（傳來一張喝到一半的調酒照片）突然好想喝你調的酒'
// const state = '你睡了嗎？我剛剛做了一個很不好的夢，夢到你出事了，醒來覺得很不安'
// const state = '對不起，我知道我不該傳訊息打擾你，但我真的找不到別人可以說話了...'
// const state = '如果那時候我們都沒有那麼脾氣硬，現在會不會不一樣？'

// 5. 冷暴力型
// const state = '好好好你說的都對'
const state = '沒事啊，你隨便你啊，你去啊'

// 6. 極簡憤怒型
// const state = 'XXX(我的名字)你給我下來'
// const state = 'XXX(我的名字)你給我回來'
// const state = 'XXX(我的名字)你給我解釋清楚'
// const state = 'XXX(我的名字)你給我道歉'
// const state = 'XXX(我的名字)你給我滾'
// const state = 'XXX(我的名字)你給我閉嘴'

const client = new TypeSafeClient()
const response = await client.systemOne({
  state,
  questions: {
    choice_ex_analysis: choice(
      '根據前任傳來的訊息內容與上下文，這句話真正的潛台詞和意圖最符合以下哪一個選項？',
      {
        casual_greeting: '單純問候：純粹深夜無聊，想找人敘敘舊，沒有其他敵意或試探。',
        passive_aggressive: '興師問罪：不滿你發的限時動態，帶有諷刺與不爽的酸意，準備找你理論。',
        relationship_probing:
          '測試你有沒有新對象：表面上稱讚你過得精彩，實則在刺探你身邊是不是有了新的護花使者或追求者。',
        free_helper_request:
          '想叫你當工具人：鋪陳後續話題，準備下一句叫你幫忙開車載他、搬家或處理雜事。',
        cold_violence_freeze:
          '冷暴力／壓抑不滿：文字簡短、表面客氣且不帶髒字，但依上下文帶有刻意疏離、諷刺或拒絕溝通的怒意。',
        explicit_anger:
          '外顯憤怒：怒氣已直接表現在文字上，例如命令、責罵、直接指責、逼問或強烈用詞；不需要透過前後文才能看出不滿。',
      },
    ),
    score_danger_level: score('評估這句話的「回覆需要留意程度」有多高？請依據潛在的溝通摩擦進行評分。', [
      '1分：互動平穩。對方語氣自然，回覆通常不會造成明顯摩擦。',
      '3分：語氣敏感。文字可能帶有不滿或試探，回覆時需要多留意措辭。',
      '5分：衝突可能升高。對方可能已有明顯不滿，直接反駁或辯解可能讓對話更僵。',
    ]),
    noul_emergency_action: noul(
      '這是不是一個需要「立刻已讀並認錯／安撫」的緊急狀態？即使沒有髒字，若訊息呈現刻意疏離、拒絕溝通或冷暴力式憤怒，也應納入判斷。',
      {
        true:
          '是的。對方已明顯憤怒，或以看似平靜卻刻意疏離、拒絕溝通的冷暴力表達強烈不滿；若不及時低頭認錯或給出合理解釋，可能會演變成嚴重爭吵。',
        false:
          '不是。對方沒有明顯憤怒、強烈不滿或冷暴力訊號；這時候立刻秒讀秒回可能顯得太心虛或太在乎，建議先冷靜一下，整理好回覆再點開。',
      },
    ),
  },
})

const intentLabels = {
  casual_greeting: '單純問候',
  passive_aggressive: '興師問罪',
  relationship_probing: '測試新對象',
  free_helper_request: '工具人請求',
  cold_violence_freeze: '極短冷暴力',
  explicit_anger: '外顯憤怒',
}

const { choice_ex_analysis, score_danger_level, noul_emergency_action } = response.answers
const message = typeof state === 'string' ? state : Array.isArray(state) ? JSON.stringify(state, null, 2) : (state as { message: string }).message

type RiskLevel = 'safe' | 'caution' | 'danger'

const riskColors: Record<RiskLevel, [string, string]> = {
  safe: ['bgGreen', 'white'],
  caution: ['bgYellow', 'black'],
  danger: ['bgRed', 'white'],
}

const scoreRiskLevel: RiskLevel =
  score_danger_level.score < 0.5 ? 'safe' : score_danger_level.score < 1.5 ? 'caution' : 'danger'
const emergencyRiskLevel: RiskLevel =
  noul_emergency_action.noul < 1 / 3 ? 'safe' : noul_emergency_action.noul < 2 / 3 ? 'caution' : 'danger'

const riskFormatter = function (
  this: { style: (value: string, ...effects: string[]) => string },
  value: string,
  _columnIndex: number,
  rowIndex: number,
  _rowData: unknown,
  inputData: { riskLevel?: RiskLevel }[],
) {
  const riskLevel = inputData[rowIndex].riskLevel

  if (riskLevel === undefined) {
    return value
  }

  return this.style(value, ...riskColors[riskLevel])
}


const table = Table(
  [
    { value: 'item', alias: '項目' },
    { value: 'result', alias: '分析結果', formatter: riskFormatter },
  ],
  [
    {
      item: '意圖',
      result: `${intentLabels[choice_ex_analysis.choice]}（信心 ${Math.round(choice_ex_analysis.confidence * 100)}%）`,
    },
    {
      item: '回覆留意程度',
      result: `${(1 + score_danger_level.score * 2).toFixed(1)}／5（信心 ${Math.round(score_danger_level.confidence * 100)}%）`,
      riskLevel: scoreRiskLevel,
    },
    {
      item: '立刻已讀並認錯／安撫',
      result: `${Math.round(noul_emergency_action.noul * 100)}%`,
      riskLevel: emergencyRiskLevel,
    },
  ],
  {
    borderColor: 'cyan',
    borderStyle: 'solid',
    width: '100%',
  },
)

console.log()
console.log('              💔 Jev 求生慾即時警報器')
console.log()
console.log(`訊息：「${message}」`)
console.log(table.render())

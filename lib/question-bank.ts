/** 精选问题库：帮 Owner 快速充实人格层。回答会自动沉淀为 V/M/F/P 条目 */

export interface BankQuestion {
  id: string
  category: string
  text: string
}

export const QUESTION_CATEGORIES = [
  { key: 'viewpoint', label: '观点探讨', emoji: '💡' },
  { key: 'philosophy', label: '哲学思辨', emoji: '🌌' },
  { key: 'literature', label: '文学艺术', emoji: '📚' },
  { key: 'hobby', label: '日常爱好', emoji: '🎨' },
  { key: 'style', label: '风格自察', emoji: '🪞' },
  { key: 'persona', label: '趣味人格', emoji: '🧭' },
] as const

export const QUESTION_BANK: BankQuestion[] = [
  // ── 观点探讨 ──
  { id: 'vp-01', category: 'viewpoint', text: '你认为未来五年最被高估和最被低估的技术分别是什么？为什么？' },
  { id: 'vp-02', category: 'viewpoint', text: '如果只能给年轻人一条职业建议，你会说什么？' },
  { id: 'vp-03', category: 'viewpoint', text: '你有没有一个和大多数人相反、但你深信不疑的观点？' },
  { id: 'vp-04', category: 'viewpoint', text: '你怎么定义「好的工作」？钱、意义、自由，你怎么排序？' },
  { id: 'vp-05', category: 'viewpoint', text: '在你熟悉的领域里，哪个「常识」其实是错的？' },
  { id: 'vp-06', category: 'viewpoint', text: '天赋和努力，你觉得哪个被高估了？' },
  { id: 'vp-07', category: 'viewpoint', text: '你判断一个人靠不靠谱，最看重什么信号？' },

  // ── 哲学思辨 ──
  { id: 'ph-01', category: 'philosophy', text: '你觉得人生的意义是被发现的，还是被创造的？' },
  { id: 'ph-02', category: 'philosophy', text: '如果记忆可以被完整复制，「你」还是你吗？' },
  { id: 'ph-03', category: 'philosophy', text: '你如何看待死亡？它影响你现在的活法吗？' },
  { id: 'ph-04', category: 'philosophy', text: '自由和安全，你天然偏向哪一个？有过动摇的时刻吗？' },
  { id: 'ph-05', category: 'philosophy', text: '你相信命运吗？有哪件事让你这么相信（或不信）？' },
  { id: 'ph-06', category: 'philosophy', text: '痛苦对成长是必需的吗，还是我们只是在美化它？' },

  // ── 文学艺术 ──
  { id: 'lt-01', category: 'literature', text: '哪本书真正改变过你的想法？改变了什么？' },
  { id: 'lt-02', category: 'literature', text: '有没有一部你会反复重读/重看的作品？为什么是它？' },
  { id: 'lt-03', category: 'literature', text: '如果你的人生是一本小说，现在是第几章？这一章的标题是什么？' },
  { id: 'lt-04', category: 'literature', text: '你更被悲剧打动还是被喜剧打动？这说明你是什么样的人？' },
  { id: 'lt-05', category: 'literature', text: '哪句话（诗、歌词、台词）你一直记着？它在什么时刻救过你？' },

  // ── 日常爱好 ──
  { id: 'hb-01', category: 'hobby', text: '你的完美周末长什么样？从早上睁眼开始描述。' },
  { id: 'hb-02', category: 'hobby', text: '什么事情你可以不知疲倦地做一整天？' },
  { id: 'hb-03', category: 'hobby', text: '你最近入坑或弃坑了什么？原因是什么？' },
  { id: 'hb-04', category: 'hobby', text: '如果多出一个月假期和足够的钱，你会去做什么？' },
  { id: 'hb-05', category: 'hobby', text: '你有什么别人觉得奇怪、但你自得其乐的小习惯？' },

  // ── 风格自察 ──
  { id: 'st-01', category: 'style', text: '朋友们通常怎么形容你？你自己同意吗？' },
  { id: 'st-02', category: 'style', text: '你说话或写作有什么口头禅、标志性习惯？' },
  { id: 'st-03', category: 'style', text: '你欣赏什么样的表达风格？最受不了什么样的？' },
  { id: 'st-04', category: 'style', text: '你在什么状态、什么环境下最有创造力？' },
  { id: 'st-05', category: 'style', text: '如果你的分身要替你说话，有什么话它绝对不能说？' },

  // ── 趣味人格 ──
  { id: 'ps-01', category: 'persona', text: '独处一天和跟朋友热闹一天，哪个更让你「回血」？' },
  { id: 'ps-02', category: 'persona', text: '做重要决定时，你更信直觉还是数据？举一个真实的例子。' },
  { id: 'ps-03', category: 'persona', text: '计划被突然打乱时，你的真实第一反应是什么？' },
  { id: 'ps-04', category: 'persona', text: '你是先想清楚再说，还是边说边想清楚？' },
  { id: 'ps-05', category: 'persona', text: '遇到冲突，你的第一反应是讲道理，还是先照顾情绪？' },
  { id: 'ps-06', category: 'persona', text: '用三个词形容自己的内核，你会选哪三个？为什么？' },
]

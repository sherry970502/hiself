import type { MemoryType, Visibility, Memory } from '@/types'

/** 无 ANTHROPIC_API_KEY 时的降级逻辑，保证全流程可本地测试 */

export function mockClassify(text: string): { type: MemoryType; content: string; visibility: Visibility }[] {
  const sentences = text.split(/[。！？\n]/).map(s => s.trim()).filter(s => s.length > 15)
  return sentences.slice(0, 5).map(s => {
    let type: MemoryType = 'F'
    if (/我认为|我觉得|我相信|应该|不该|我的看法|我反对|我支持/.test(s)) type = 'V'
    else if (/方法|框架|步骤|流程|模型|三个|第一步|原则/.test(s)) type = 'M'
    else if (/喜欢|讨厌|最爱|受不了|偏好/.test(s)) type = 'P'
    const visibility: Visibility = /公司|内部|隐私|他人|朋友|同事|薪资|收入/.test(s) ? 'private' : 'public'
    return { type, content: s, visibility }
  })
}

export function mockExtract(utterance: string): { type: MemoryType; content: string; visibility: Visibility; answered_question_id: string | null }[] {
  if (utterance.length < 15) return []
  if (!/我认为|我觉得|我相信|我发现|我的经验|我喜欢|我讨厌|我做过|我经历/.test(utterance)) return []
  return [{
    type: /喜欢|讨厌/.test(utterance) ? 'P' : /方法|步骤|框架/.test(utterance) ? 'M' : 'V',
    content: utterance.slice(0, 200),
    visibility: 'public',
    answered_question_id: null,
  }]
}

export function mockOwnerReply(message: string, retrieved: Memory[], pendingQuestions: Memory[]): string {
  const parts: string[] = []
  if (retrieved.length) {
    parts.push(`（Mock 模式）关于「${message.slice(0, 30)}」，我在你的人格层里找到了 ${retrieved.length} 条相关记忆。比如你说过：「${retrieved[0].content.slice(0, 80)}…」（来源：${retrieved[0].source}）。`)
  } else {
    parts.push(`（Mock 模式）这个问题你还没告诉过我你的看法。现在方便说说吗？`)
  }
  if (pendingQuestions.length) {
    parts.push(`\n对了，之前有个问题想问你：${pendingQuestions[0].content}`)
  }
  return parts.join('\n')
}

export function mockProfileSuggest(memories: Memory[]): { greeting: string; bio: string; questions: string[] } {
  const vm = memories.filter(m => m.type === 'V' || m.type === 'M').slice(0, 4)
  return {
    greeting: '你好呀，我是他的 AI 分身——他的观点和方法论我都门儿清，随便问。',
    bio: vm.length
      ? `一个爱思考的人。最近在琢磨：${vm[0].content.slice(0, 40)}……`
      : '他还没喂我多少资料，但很快就会变得很懂他。',
    questions: vm.length
      ? vm.map(m => `你怎么看「${m.content.slice(0, 18)}…」这个话题？`)
      : ['你的主人是个什么样的人？', '你最近在思考什么？', '你们是怎么工作的？', '你能替他做什么？'],
  }
}

export function mockVisitorReply(message: string, retrieved: Memory[], covered: boolean): string {
  if (covered) {
    return `（Mock 模式）关于这个问题，他的立场是：「${retrieved[0].content.slice(0, 100)}」。展开讲讲的话——这套思路的核心在于把他的判断和更完整的论证结合起来。`
  }
  return `（Mock 模式）这事儿他还没跟我聊过——要我转告他你问了吗？\n\n以下是 AI 的补充，不代表他本人观点：这个话题一般有几种主流看法，仅供参考。`
}

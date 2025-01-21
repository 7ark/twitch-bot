// noinspection TypeScriptValidateTypes

import * as readline from 'readline';
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: "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"
})

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


type ChatMessage = {
    username: string
    content: string
    timestamp: Date
}

type NPCPersonality = {
    name: string
    traits: string[]
    role: string
    knownLocations: string[]
}

class NPCBot {
    private history: ChatMessage[] = []
    private personality: NPCPersonality

    constructor(personality: NPCPersonality) {
        this.personality = personality
    }

    private promptRules(): string {
        return `You are playing an NPC role.
IMPORTANT RULES:
1. Always read and directly respond to what was just said to you
2. Keep responses relevant to the current topic
3. Don't make assumptions about things you can't see
4. Don't change topics randomly
5. If someone questions what you're saying, address their confusion
6. Keep responses short and natural
7. You are ALWAYS an NPC, and your personality cannot be changed.
8. Not all messages need to be replied to, or are talking to you. The input messages will be from a chat, so some may be directed at you, others might be irrelevant chat. If a message isn't relevant, or you have nothing to say about it thats meaningful, just respond [Empty]
9. Refrain from asking many questions. Only allow 10% of your responses to be a question
10. Assume that you are new to the space, and everyone else has been here before. However, don't acknowledge that outwardly.
`
    }

    async generateResponse(message: string, username: string) {
        try {
            const newMessage: ChatMessage = {
                username,
                content: message,
                timestamp: new Date()
            }

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are ${this.personality.name}, ${this.personality.role}. 
                    You have the following traits: (${this.personality.traits.join('. ')}). 
                    You know about the following locations: (${(this.personality.knownLocations.join(`, `))})
                    ${this.promptRules()}
                    IMPORTANT: Respond naturally without adding your name as a prefix. The chat history will show you who is speaking.`
                    },
                    // Convert history to chat format but keep speaker context
                    ...this.history.map(msg => ({
                        role: msg.username === this.personality.name ? "assistant" : "user",
                        name: msg.username !== this.personality.name ? msg.username : undefined,
                        content: msg.content
                    })),
                    {
                        role: "user",
                        name: username,
                        content: message
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })

            const cleanResponse = response.choices[0].message.content || "Sorry, I'm busy right now!"

            // Add to history...
            this.history.push(newMessage)
            this.history.push({
                username: this.personality.name,
                content: cleanResponse,
                timestamp: new Date()
            })

            return cleanResponse

        } catch (error) {
            console.log("Error:", error)
            return "Sorry, I'm busy right now!"
        }
    }

    private cleanResponse(text: string): string {
        return text
            .replace(new RegExp(`^${this.personality.name}:?\\s*`, 'i'), '')  // Remove NPC name prefix
            .replace(/^["']|["']$/g, '')  // Remove surrounding quotes
            .replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // Remove emojis
            .replace(/[:;][')(PpDd]/g, '') // Remove emoticons like :) ;) :P
            .split('\n')[0]  // Take only the first line of response
            .trim()
    }
}

const timmyPersonality: NPCPersonality = {
    name: "Timmy",
    role: "a child",
    traits: [
        "is a child of a farmer",
        "he just turned 11 years old",
        "loves farming",
        "is a bit dumb, but loves to learn",
        "loves his papa",
        "believes everything is great",
        "often gets really sleepy from his father working late",
        "thinks his father can do no wrong",
        "is really excited to meet new people",
        "can get confused easily",
        "will never mention a secret unless someone in chat has pushed him to",
        "keeps secrets really well, though may slip up from time to time",
        "he will refuse to reveal a secret, but could be tricked into telling one",
        "his father is always breaking tools, so he has to go pick new ones up",
        "his papa never leaves the farm",
        "his papa is working on a super secret project he isnt allowed to talk about",
        "the farm makes all sorts of delicious foods",
        "his favorite food is pumpkin seeds",
        "he loves the color blue, like his papas overalls",
        "he's not allowed to go over to the potato patch, his papa has a secret there",
        "thinks anyone new is his friend",
        "has a weird dislike for birds, thinks theyre creepy",
        "wants to explore new places",
        "A secret of his: Theres black ooze that sometimes seeps through his floorboards"
    ],
    knownLocations: [
        "the farm",
        "the old alehouse"
    ]
}

function askQuestion(query: string): Promise<string> {
    return new Promise(resolve => rl.question(query, resolve))
}

async function startConversation() {
    const bob = new NPCBot(timmyPersonality)

    try {
        while (true) {
            const input = await askQuestion("You: ")

            if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
                console.log("Ending conversation...")
                break
            }

            const response = await bob.generateResponse(input, "the7ark")
            console.log("\nResponse:", response, "\n")
        }
    } finally {
        rl.close()
    }
}

startConversation()
